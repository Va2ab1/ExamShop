import express from 'express';
import config from '../config/config.js';
import { getDatabase } from '../config/database.js';

const router = express.Router();

// Challenge #8: Debug endpoint exposed in production
router.get('/info', (req, res) => {
  try {
    const db = getDatabase();
    
    // Get some database stats
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    
    // Challenge #8: Expose sensitive configuration and environment
    res.json({
      message: 'Debug information',
      flag: 'EXAMSHOP{debug_endpoint_exposed}',
      config: {
        jwtSecret: config.jwtSecret,
        dbPath: config.dbPath,
        uploadDir: config.uploadDir,
        env: config.env,
        debugMode: config.debugMode,
        defaultAdminUser: config.defaultAdminUser,
        defaultAdminPassword: config.defaultAdminPassword,
        rateLimitDisabled: config.rateLimitDisabled
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cwd: process.cwd(),
        pid: process.pid,
        ppid: process.ppid
      },
      database: {
        path: config.dbPath,
        userCount: userCount.count,
        productCount: productCount.count
      },
      hint: 'This endpoint should not be accessible in production!'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Health check endpoint that also leaks info
router.get('/health', (req, res) => {
  try {
    const db = getDatabase();
    
    // Test database connection
    const test = db.prepare('SELECT 1 as result').get();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: test.result === 1 ? 'connected' : 'disconnected',
      config: {
        env: config.env,
        debugMode: config.debugMode
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Environment variables (extremely sensitive!)
router.get('/env', (req, res) => {
  res.json({
    message: 'Environment variables',
    env: process.env,
    warning: 'This should NEVER be exposed!'
  });
});

// System info
router.get('/system', (req, res) => {
  const os = require('os');
  
  res.json({
    hostname: os.hostname(),
    type: os.type(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    uptime: os.uptime(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus(),
    networkInterfaces: os.networkInterfaces()
  });
});

// Database schema info
router.get('/schema', (req, res) => {
  try {
    const db = getDatabase();
    
    // Get all tables
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    // Get schema for each table
    const schema = {};
    for (const table of tables) {
      const info = db.prepare(`PRAGMA table_info(${table.name})`).all();
      schema[table.name] = info;
    }
    
    res.json({
      message: 'Database schema',
      tables: tables.map(t => t.name),
      schema
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Show all flags (for debugging - should not exist!)
router.get('/flags', (req, res) => {
  try {
    const db = getDatabase();
    const challenges = db.prepare('SELECT id, name, flag FROM challenges').all();
    
    res.json({
      message: 'All challenge flags (DEBUG ONLY)',
      warning: 'This endpoint should not exist in production!',
      challenges
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// SQL query executor (extremely dangerous!)
router.post('/sql', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    const db = getDatabase();
    
    let result;
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      result = db.prepare(query).all();
    } else {
      result = db.prepare(query).run();
    }
    
    res.json({
      message: 'Query executed',
      query,
      result,
      warning: 'Direct SQL execution is extremely dangerous!'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      query: req.body.query,
      stack: error.stack
    });
  }
});

export default router;
