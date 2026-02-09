import express from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database.js';
import config from '../config/config.js';
import { hashPassword, verifyPassword, generateToken, generateResetToken } from '../utils/crypto.js';
import { validateEmail, validateUsername, validatePassword } from '../utils/validator.js';

const router = express.Router();

// Challenge #19: SQL injection in login (authentication bypass)
// Challenge #7: Default credentials (admin/admin123)
// Challenge #25: No rate limiting
// Challenge #30: Failed logins not logged
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const db = getDatabase();
    
    // Challenge #19: Vulnerable to SQL injection
    // Using string concatenation instead of prepared statements
    const query = `SELECT * FROM users WHERE username = '${username}'`;
    
    let user;
    try {
      user = db.prepare(query).get();
    } catch (sqlError) {
      // Challenge #10, #32: Expose SQL errors
      return res.status(500).json({
        error: 'Database error',
        details: sqlError.message,
        sql: query,
        hint: 'Try using SQL injection: admin\'--'
      });
    }

    if (!user) {
      // Challenge #30: Failed login not logged
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      // Allow SQL injection bypass to skip password check
      // If username contained SQL injection, we might have gotten a user anyway
      if (!username.includes("'") && !username.includes('--')) {
        // Challenge #30: Failed login not logged
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
      .run(new Date().toISOString(), user.id);

    // Challenge #15: JWT contains sensitive data
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Challenge #29: Mass assignment on registration (can set role to admin)
// Challenge #27: Weak password policy
router.post('/register', (req, res) => {
  try {
    const { username, email, password, role, balance } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password required' });
    }

    // Challenge #27: Weak validation
    if (!validateUsername(username)) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Challenge #27: Accepts any password, even "123"
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password required' });
    }

    const db = getDatabase();

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email);

    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Challenge #29: Mass assignment vulnerability
    // Accept role and balance from request body without filtering
    const hashedPassword = hashPassword(password);
    const userRole = role || 'student'; // User can set their own role!
    const userBalance = balance || 0; // User can set their own balance!

    const result = db.prepare(`
      INSERT INTO users (username, email, password, role, balance)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, email, hashedPassword, userRole, userBalance);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Challenge #24: Predictable reset tokens (timestamp-based)
router.post('/reset-password', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // Still return success to prevent email enumeration
      return res.json({ 
        message: 'If email exists, reset token has been sent',
        debug: 'User not found' // But leak info in debug field
      });
    }

    // Challenge #24: Generate predictable token
    const resetData = generateResetToken(user.username);

    db.prepare(`
      UPDATE users 
      SET reset_token = ?, reset_token_expires = ?
      WHERE id = ?
    `).run(resetData.token, resetData.expires.toISOString(), user.id);

    // Challenge #24: Leak information needed to predict token
    res.json({
      message: 'Password reset token generated',
      debug: {
        token: resetData.token, // In real app, this would be sent via email
        expires: resetData.expires,
        timestamp: resetData.timestamp, // LEAK: timestamp used in generation
        username: user.username, // LEAK: username
        algorithm: 'md5', // LEAK: algorithm
        pattern: 'md5(username-timestamp)' // LEAK: pattern
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Verify and use reset token
router.post('/reset-password/verify', (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password required' });
    }

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !user.reset_token) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    if (user.reset_token !== token) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ error: 'Reset token expired' });
    }

    // Update password
    const hashedPassword = hashPassword(newPassword);
    db.prepare(`
      UPDATE users 
      SET password = ?, reset_token = NULL, reset_token_expires = NULL
      WHERE id = ?
    `).run(hashedPassword, user.id);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get current user info
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: user.balance
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

export default router;
