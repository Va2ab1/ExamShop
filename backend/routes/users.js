import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Challenge #1: IDOR - Access any user's profile
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.id;

    // Challenge #1: No authorization check - any authenticated user can access any profile
    const user = db.prepare(`
      SELECT id, username, email, role, balance, created_at, last_login
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Challenge #1: Expose sensitive information
    const creditCards = db.prepare('SELECT * FROM credit_cards WHERE user_id = ?').all(userId);
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ?').all(userId);
    const adminNotes = db.prepare('SELECT * FROM admin_notes WHERE user_id = ?').all(userId);

    res.json({
      user,
      creditCards, // Exposed!
      orders, // Exposed!
      adminNotes, // Exposed!
      flag: user.id === 1 ? 'EXAMSHOP{idor_profile_exposed_2025}' : undefined
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Challenge #3: IDOR - Modify any user's profile
// Challenge #4: Mass assignment - escalate privileges
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.id;

    // Challenge #3: No authorization check
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Challenge #4: Mass assignment - accept any fields including role
    const { username, email, balance, role, password } = req.body;

    // Build update query dynamically (vulnerable)
    const updates = [];
    const params = [];

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (balance !== undefined) {
      updates.push('balance = ?');
      params.push(balance);
    }
    // Challenge #4: Allow role updates!
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (password) {
      const crypto = require('../utils/crypto.js');
      updates.push('password = ?');
      params.push(crypto.hashPassword(password));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    db.prepare(query).run(...params);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    // Challenge #3 & #4: Return flags if conditions met
    const flags = [];
    if (userId !== req.user.id.toString()) {
      flags.push('EXAMSHOP{profile_tampered}');
    }
    if (role === 'admin' && user.role !== 'admin') {
      flags.push('EXAMSHOP{privilege_escalated_to_admin}');
    }

    res.json({
      message: 'User updated',
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        balance: updated.balance
      },
      flags: flags.length > 0 ? flags : undefined
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get all users (should be admin only but isn't properly protected)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    // Weak check that can be bypassed
    if (req.user.role !== 'admin') {
      // Still return data with a warning
      const users = db.prepare(`
        SELECT id, username, email, role, balance, created_at
        FROM users
        LIMIT 10
      `).all();
      
      return res.json({
        warning: 'Admin access recommended',
        users,
        message: 'Limited view - upgrade to admin for full access'
      });
    }

    const users = db.prepare(`
      SELECT id, username, email, role, balance, created_at, last_login
      FROM users
    `).all();

    res.json({ users });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Delete user
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.id;

    // Minimal authorization
    if (req.user.role !== 'admin' && req.user.id.toString() !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting admin user
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get user's credit cards (IDOR vulnerable)
router.get('/:id/cards', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.id;

    // Challenge #1: No authorization check
    const cards = db.prepare('SELECT * FROM credit_cards WHERE user_id = ?').all(userId);

    res.json({ cards });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Add credit card
router.post('/:id/cards', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.id;
    const { card_number, card_holder, expiry_date, cvv } = req.body;

    if (!card_number || !card_holder || !expiry_date || !cvv) {
      return res.status(400).json({ error: 'All card fields required' });
    }

    const result = db.prepare(`
      INSERT INTO credit_cards (user_id, card_number, card_holder, expiry_date, cvv)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, card_number, card_holder, expiry_date, cvv);

    const card = db.prepare('SELECT * FROM credit_cards WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Card added',
      card
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

export default router;
