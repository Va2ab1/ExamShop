import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Challenge #2: Broken access control - trusts client-sent role header
// All admin routes are "protected" but accept X-User-Role header

// Admin dashboard
router.get('/dashboard', authenticateToken, (req, res) => {
  try {
    // Challenge #2: Trust client role from auth middleware
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'Try setting X-User-Role header to admin'
      });
    }

    const db = getDatabase();

    // Get statistics
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const revenue = db.prepare('SELECT SUM(total_price) as total FROM orders').get();

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, u.username
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();

    // Top products
    const topProducts = db.prepare(`
      SELECT p.id, p.name, p.price, COUNT(oi.id) as sales
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id
      ORDER BY sales DESC
      LIMIT 5
    `).all();

    res.json({
      message: 'Welcome to admin dashboard',
      flag: 'EXAMSHOP{admin_panel_unlocked}',
      statistics: {
        users: userCount.count,
        products: productCount.count,
        orders: orderCount.count,
        revenue: revenue.total || 0
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get all users with full details
router.get('/users', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'Try setting X-User-Role header to admin'
      });
    }

    const db = getDatabase();
    const users = db.prepare(`
      SELECT u.*, 
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
        (SELECT SUM(total_price) FROM orders WHERE user_id = u.id) as total_spent
      FROM users u
    `).all();

    res.json({ users });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Update user role
router.post('/users/:id/role', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'Try setting X-User-Role header to admin'
      });
    }

    const db = getDatabase();
    const { role } = req.body;
    const userId = req.params.id;

    if (!role) {
      return res.status(400).json({ error: 'Role required' });
    }

    const validRoles = ['student', 'professor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    res.json({
      message: 'User role updated',
      user: {
        id: updated.id,
        username: updated.username,
        role: updated.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Update user balance
router.post('/users/:id/balance', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'Try setting X-User-Role header to admin'
      });
    }

    const db = getDatabase();
    const { balance } = req.body;
    const userId = req.params.id;

    if (balance === undefined || balance === null) {
      return res.status(400).json({ error: 'Balance required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(balance, userId);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    res.json({
      message: 'User balance updated',
      user: {
        id: updated.id,
        username: updated.username,
        balance: updated.balance
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// View admin notes
router.get('/notes', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'Try setting X-User-Role header to admin'
      });
    }

    const db = getDatabase();
    const notes = db.prepare(`
      SELECT n.*, u1.username as user, u2.username as created_by_name
      FROM admin_notes n
      JOIN users u1 ON n.user_id = u1.id
      JOIN users u2 ON n.created_by = u2.id
      ORDER BY n.created_at DESC
    `).all();

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Add admin note
router.post('/notes', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'Try setting X-User-Role header to admin'
      });
    }

    const db = getDatabase();
    const { user_id, note } = req.body;

    if (!user_id || !note) {
      return res.status(400).json({ error: 'User ID and note required' });
    }

    const result = db.prepare(`
      INSERT INTO admin_notes (user_id, note, created_by)
      VALUES (?, ?, ?)
    `).run(user_id, note, req.user.id);

    const newNote = db.prepare(`
      SELECT n.*, u1.username as user, u2.username as created_by_name
      FROM admin_notes n
      JOIN users u1 ON n.user_id = u1.id
      JOIN users u2 ON n.created_by = u2.id
      WHERE n.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Note added',
      note: newNote
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get all orders
router.get('/orders', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'Try setting X-User-Role header to admin'
      });
    }

    const db = getDatabase();
    const orders = db.prepare(`
      SELECT o.*, u.username
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all();

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// System configuration (exposes sensitive info)
router.get('/config', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'Try setting X-User-Role header to admin'
      });
    }

    const config = require('../config/config.js').default;

    res.json({
      message: 'System configuration',
      config: {
        jwtSecret: config.jwtSecret, // Exposed!
        dbPath: config.dbPath,
        uploadDir: config.uploadDir,
        env: config.env,
        debugMode: config.debugMode,
        defaultAdminUser: config.defaultAdminUser,
        defaultAdminPassword: config.defaultAdminPassword
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

export default router;
