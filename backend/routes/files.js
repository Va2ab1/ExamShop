import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Challenge #9: Directory listing enabled
router.get('/list', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    // List all uploaded files
    const files = db.prepare(`
      SELECT f.*, u.username
      FROM files f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.uploaded_at DESC
    `).all();

    // Also list physical files in directory
    let physicalFiles = [];
    try {
      physicalFiles = fs.readdirSync(UPLOAD_DIR);
    } catch (err) {
      // Ignore error
    }

    res.json({
      message: 'File listing',
      flag: 'EXAMSHOP{directory_listing_enabled}',
      files,
      physicalFiles,
      uploadDirectory: UPLOAD_DIR
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// File upload
router.post('/upload', authenticateToken, (req, res) => {
  try {
    // Simple file upload simulation
    const { filename, content, mimetype } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content required' });
    }

    // Challenge: Weak filename sanitization
    const sanitizedFilename = filename.replace(/\\/g, '/');
    const filePath = path.join(UPLOAD_DIR, sanitizedFilename);
    const fileSize = content.length;

    // Write file
    fs.writeFileSync(filePath, content);

    // Record in database
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO files (user_id, filename, original_filename, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      sanitizedFilename,
      filename,
      filePath,
      fileSize,
      mimetype || 'application/octet-stream'
    );

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'File uploaded',
      file
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Challenge #9: Path traversal in file download
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;

    // Challenge #9: No path traversal protection
    // Vulnerable to ../../../etc/passwd
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found',
        requestedPath: filePath,
        hint: 'Try path traversal: ../../../etc/passwd'
      });
    }

    // Read and return file
    const content = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    res.json({
      filename: filename,
      content: content.toString('utf-8'),
      size: stat.size,
      path: filePath
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      hint: 'Path traversal possible'
    });
  }
});

// Challenge #21: Command injection in file conversion
router.post('/convert', authenticateToken, async (req, res) => {
  try {
    const { filename, format } = req.body;

    if (!filename || !format) {
      return res.status(400).json({ error: 'Filename and format required' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Challenge #21: Command injection vulnerability
    // No sanitization of format parameter
    const command = `file ${filePath} && echo "Converting to ${format}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command);
      
      res.json({
        message: 'File conversion completed',
        output: stdout,
        error: stderr,
        flag: format.includes(';') || format.includes('&&') || format.includes('|') 
          ? 'EXAMSHOP{command_injection_rce}' 
          : undefined,
        hint: 'Try injecting commands in format parameter: "; cat /etc/passwd"'
      });
    } catch (execError) {
      res.status(500).json({
        error: 'Command execution failed',
        details: execError.message,
        stderr: execError.stderr,
        stdout: execError.stdout
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get file metadata
router.get('/metadata/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const fileId = req.params.id;

    const file = db.prepare(`
      SELECT f.*, u.username
      FROM files f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `).get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ file });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Delete file
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const fileId = req.params.id;

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check ownership
    if (file.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    // Delete physical file
    try {
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }
    } catch (fsError) {
      // Continue even if physical file deletion fails
    }

    // Delete from database
    db.prepare('DELETE FROM files WHERE id = ?').run(fileId);

    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

export default router;
