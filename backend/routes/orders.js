import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateOrderData } from '../utils/validator.js';

const router = express.Router();

// Challenge #22: Price/quantity manipulation
// Challenge #23: Coupon abuse via race conditions
router.post('/', authenticateToken, (req, res) => {
  try {
    const { items, coupon_code } = req.body;

    const validation = validateOrderData({ items });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Challenge #22: No validation for negative quantities or prices
    // Calculate total - vulnerable to manipulation
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }

      // Challenge #22: Accept negative quantities or prices from client
      const quantity = item.quantity; // No validation!
      const price = item.price !== undefined ? item.price : product.price; // Client can override price!

      const itemTotal = price * quantity;
      total += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: quantity,
        price: price
      });
    }

    // Apply coupon if provided
    let discount = 0;
    let couponId = null;
    
    if (coupon_code) {
      const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(coupon_code);
      
      if (coupon) {
        const now = new Date();
        const expires = new Date(coupon.expires_at);
        
        if (now > expires) {
          return res.status(400).json({ error: 'Coupon expired' });
        }

        // Challenge #23: Race condition - check happens before update
        if (coupon.current_uses >= coupon.max_uses) {
          return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        discount = total * (coupon.discount_percent / 100);
        couponId = coupon.id;
        
        // Challenge #23: Update happens after check - race condition window
        // Multiple concurrent requests can all pass the check
        db.prepare('UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?').run(coupon.id);
      } else {
        return res.status(400).json({ error: 'Invalid coupon code' });
      }
    }

    const finalTotal = total - discount;

    // Challenge #22: If total is negative (due to manipulation), user gains money!
    if (finalTotal < 0) {
      // Give money to user instead of charging
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(Math.abs(finalTotal), user.id);
      
      return res.json({
        message: 'Order processed - you gained money!',
        flag: 'EXAMSHOP{free_exam_answers}',
        total: finalTotal,
        new_balance: user.balance + Math.abs(finalTotal)
      });
    }

    // Check if user has sufficient balance
    if (user.balance < finalTotal) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create order
    const orderResult = db.prepare(`
      INSERT INTO orders (user_id, total_price, status, coupon_code)
      VALUES (?, ?, ?, ?)
    `).run(user.id, finalTotal, 'completed', coupon_code || null);

    const orderId = orderResult.lastInsertRowid;

    // Insert order items
    for (const item of orderItems) {
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `).run(orderId, item.product_id, item.quantity, item.price);
    }

    // Record coupon usage
    if (couponId) {
      db.prepare(`
        INSERT INTO coupon_usage (coupon_id, user_id, order_id)
        VALUES (?, ?, ?)
      `).run(couponId, user.id, orderId);
    }

    // Deduct from user balance
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(finalTotal, user.id);

    const order = db.prepare(`
      SELECT o.*, 
        (SELECT json_group_array(json_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price))
         FROM order_items oi WHERE oi.order_id = o.id) as items
      FROM orders o
      WHERE o.id = ?
    `).get(orderId);

    res.status(201).json({
      message: 'Order created',
      order,
      discount: discount,
      flag: coupon_code && discount > 0 ? 'EXAMSHOP{coupon_abused}' : undefined
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Challenge #5: IDOR - Access any order
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const orderId = req.params.id;

    // Challenge #5: No authorization check
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const items = db.prepare(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId);

    // Get user info
    const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(order.user_id);

    res.json({
      order: {
        ...order,
        items,
        user
      },
      flag: order.user_id !== req.user.id ? 'EXAMSHOP{order_data_leaked}' : undefined
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get user's orders
router.get('/user/:userId', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.userId;

    // Weak authorization
    if (req.user.id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        hint: 'Try accessing another user\'s orders directly via /api/orders/:id'
      });
    }

    const orders = db.prepare(`
      SELECT o.*,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(userId);

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Apply coupon (separate endpoint for Challenge #23)
router.post('/coupon', authenticateToken, (req, res) => {
  try {
    const { coupon_code, order_total } = req.body;

    if (!coupon_code || !order_total) {
      return res.status(400).json({ error: 'Coupon code and order total required' });
    }

    const db = getDatabase();
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(coupon_code);

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    const now = new Date();
    const expires = new Date(coupon.expires_at);

    if (now > expires) {
      return res.status(400).json({ error: 'Coupon expired' });
    }

    // Challenge #23: Race condition vulnerability
    // Time window between check and update
    if (coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    // Simulate some processing time to make race condition easier to exploit
    const startTime = Date.now();
    while (Date.now() - startTime < 10) {
      // Small delay
    }

    // Update usage count
    db.prepare('UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?').run(coupon.id);

    const discount = order_total * (coupon.discount_percent / 100);
    const final_total = order_total - discount;

    res.json({
      valid: true,
      discount_percent: coupon.discount_percent,
      discount_amount: discount,
      final_total: final_total,
      message: 'Coupon applied successfully',
      hint: 'Send multiple concurrent requests to exploit race condition'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get available coupons
router.get('/coupons/list', (req, res) => {
  try {
    const db = getDatabase();
    const coupons = db.prepare(`
      SELECT code, discount_percent, max_uses, current_uses, expires_at
      FROM coupons
      WHERE datetime(expires_at) > datetime('now')
    `).all();

    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

export default router;
