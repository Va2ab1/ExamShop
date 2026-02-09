import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateSupportTicket, validateURL } from '../utils/validator.js';
import https from 'https';
import http from 'http';

const router = express.Router();

// Challenge #6: SSRF via URL attachment
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { subject, message, attachment_url } = req.body;

    const validation = validateSupportTicket({ subject, message });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const db = getDatabase();
    let attachmentContent = null;

    // Challenge #6: SSRF vulnerability
    if (attachment_url) {
      const urlValidation = validateURL(attachment_url);
      
      if (!urlValidation.valid) {
        return res.status(400).json({ error: 'Invalid attachment URL' });
      }

      // Challenge #6: No SSRF protection - fetches any URL including internal
      try {
        const url = new URL(attachment_url);
        const protocol = url.protocol === 'https:' ? https : http;

        attachmentContent = await new Promise((resolve, reject) => {
          const request = protocol.get(attachment_url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
              data += chunk;
            });
            
            response.on('end', () => {
              resolve(data);
            });
          });

          request.on('error', (error) => {
            reject(error);
          });

          // Timeout after 5 seconds
          request.setTimeout(5000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
          });
        });
      } catch (fetchError) {
        return res.status(400).json({ 
          error: 'Failed to fetch attachment',
          details: fetchError.message,
          hint: 'Try accessing internal endpoints like http://localhost:3000/api/debug/info'
        });
      }
    }

    // Create ticket
    const result = db.prepare(`
      INSERT INTO support_tickets (user_id, subject, message, attachment_url, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, subject, message, attachment_url || null, 'open');

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Support ticket created',
      ticket,
      attachmentContent: attachmentContent ? attachmentContent.substring(0, 500) : null,
      flag: attachmentContent && attachmentContent.includes('EXAMSHOP{') 
        ? 'EXAMSHOP{ssrf_internal_access}' 
        : undefined
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get ticket by ID
router.get('/tickets/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const ticketId = req.params.id;

    const ticket = db.prepare(`
      SELECT t.*, u.username
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Weak authorization
    if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this ticket' });
    }

    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get user's tickets
router.get('/tickets/user/:userId', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.userId;

    // Weak authorization
    if (req.user.id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const tickets = db.prepare(`
      SELECT * FROM support_tickets
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get all tickets (admin only)
router.get('/tickets', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'Use X-User-Role: admin header'
      });
    }

    const db = getDatabase();
    const tickets = db.prepare(`
      SELECT t.*, u.username
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `).all();

    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Update ticket status
router.put('/tickets/:id/status', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const ticketId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    const validStatuses = ['open', 'in_progress', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Weak authorization
    if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.prepare('UPDATE support_tickets SET status = ? WHERE id = ?').run(status, ticketId);

    const updated = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);

    res.json({
      message: 'Ticket status updated',
      ticket: updated
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Delete ticket
router.delete('/tickets/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const ticketId = req.params.id;

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Authorization check
    if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.prepare('DELETE FROM support_tickets WHERE id = ?').run(ticketId);

    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

export default router;
