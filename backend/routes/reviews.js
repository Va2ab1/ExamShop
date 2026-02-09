import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validateReview } from '../utils/validator.js';

const router = express.Router();

// Challenge #18: Stored XSS in reviews
router.post('/', authenticateToken, (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    const validation = validateReview({ product_id, rating, comment });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const db = getDatabase();

    // Check if product exists
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existing = db.prepare(`
      SELECT id FROM reviews WHERE product_id = ? AND user_id = ?
    `).get(product_id, req.user.id);

    if (existing) {
      return res.status(400).json({ error: 'You already reviewed this product' });
    }

    // Challenge #18: Store comment without sanitization
    // This allows XSS payloads like <script>alert('XSS')</script>
    const result = db.prepare(`
      INSERT INTO reviews (product_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(product_id, req.user.id, rating, comment);

    const review = db.prepare(`
      SELECT r.*, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Review submitted',
      review,
      flag: comment && (comment.includes('<script>') || comment.includes('onerror=') || comment.includes('onclick=')) 
        ? 'EXAMSHOP{stored_xss_in_review}' 
        : undefined
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get reviews for a product
// Challenge #18: Returns unsanitized XSS payloads
router.get('/:productId', optionalAuth, (req, res) => {
  try {
    const db = getDatabase();
    const productId = req.params.productId;

    // Check if product exists
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get reviews - no sanitization
    const reviews = db.prepare(`
      SELECT r.*, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(productId);

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      product: {
        id: product.id,
        name: product.name
      },
      reviews, // Challenge #18: Unsanitized reviews with potential XSS
      average_rating: avgRating.toFixed(1),
      review_count: reviews.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Update review
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this review' });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Challenge #18: No sanitization on update either
    db.prepare(`
      UPDATE reviews
      SET rating = ?, comment = ?
      WHERE id = ?
    `).run(
      rating !== undefined ? rating : review.rating,
      comment !== undefined ? comment : review.comment,
      reviewId
    );

    const updated = db.prepare(`
      SELECT r.*, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).get(reviewId);

    res.json({
      message: 'Review updated',
      review: updated
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Delete review
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const reviewId = req.params.id;

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);

    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get user's reviews
router.get('/user/:userId', optionalAuth, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.userId;

    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name, p.id as product_id
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

export default router;
