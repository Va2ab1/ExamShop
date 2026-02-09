import express from 'express';
import { getDatabase } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateProductData, sanitizeInput } from '../utils/validator.js';

const router = express.Router();

// Challenge #20: SQL injection in search
// Challenge #17: Reflected XSS in search
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDatabase();
    const { search, category, minPrice, maxPrice, sortBy } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Challenge #20: SQL injection in search parameter
    if (search) {
      // Vulnerable: Using string concatenation
      query += ` AND (name LIKE '%${search}%' OR description LIKE '%${search}%')`;
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (minPrice) {
      query += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Sort
    const validSortFields = ['name', 'price', 'created_at', 'stock'];
    if (sortBy && validSortFields.includes(sortBy)) {
      query += ` ORDER BY ${sortBy}`;
    } else {
      query += ' ORDER BY created_at DESC';
    }

    let products;
    try {
      if (params.length > 0) {
        products = db.prepare(query).all(...params);
      } else {
        products = db.prepare(query).all();
      }
    } catch (sqlError) {
      // Challenge #10, #32: Expose SQL errors
      return res.status(500).json({
        error: 'Database error',
        details: sqlError.message,
        sql: query,
        hint: 'SQL injection possible in search parameter',
        example: "?search=' UNION SELECT flag_value,description,flag_name,id,challenge_id,flag_value FROM secret_flags--"
      });
    }

    // Challenge #17: Reflected XSS - search term reflected in response
    res.json({
      products,
      search: search || null, // Reflected without sanitization
      total: products.length,
      message: search ? `Search results for: ${search}` : 'All products'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get single product
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get reviews for this product
    const reviews = db.prepare(`
      SELECT r.*, u.username 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);

    res.json({
      ...product,
      reviews
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Create product (admin only - but we'll check this weakly)
router.post('/', (req, res) => {
  try {
    const { name, description, price, category, stock, image_url } = req.body;

    const validation = validateProductData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO products (name, description, price, category, stock, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description, price, category || 'Other', stock || 100, image_url || null);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Product created',
      product
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Update product
router.put('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, price, category, stock, image_url } = req.body;

    const validation = validateProductData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    db.prepare(`
      UPDATE products
      SET name = ?, description = ?, price = ?, category = ?, stock = ?, image_url = ?
      WHERE id = ?
    `).run(
      name || product.name,
      description || product.description,
      price !== undefined ? price : product.price,
      category || product.category,
      stock !== undefined ? stock : product.stock,
      image_url !== undefined ? image_url : product.image_url,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    res.json({
      message: 'Product updated',
      product: updated
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Delete product
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);

    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get categories
router.get('/meta/categories', (req, res) => {
  try {
    const db = getDatabase();
    const categories = db.prepare(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM products
      GROUP BY category
    `).all();

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

export default router;
