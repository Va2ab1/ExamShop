import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { getDatabase } from '../config/database.js';

// Challenge #2: Accept client-sent role header
// Challenge #28: JWT algorithm "none" bypass
// Challenge #33: Fail-open on unexpected errors
// Challenge #26: No token rotation
export function authenticateToken(req, res, next) {
  try {
    // Challenge #2: Check for client-controlled role header first
    const clientRole = req.headers['x-user-role'];
    if (clientRole) {
      // Vulnerable: Trust client-sent role header
      req.user = {
        id: req.headers['x-user-id'] || 1,
        username: req.headers['x-username'] || 'unknown',
        role: clientRole,
        isClientControlled: true
      };
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Challenge #28: Accept algorithm "none"
    // Vulnerable JWT verification that allows "none" algorithm
    let decoded;
    try {
      // First try to decode without verification to check algorithm
      const parts = token.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        
        // Challenge #28: Allow "none" algorithm
        if (header.alg === 'none' || header.alg === 'None' || header.alg === 'NONE') {
          // Just decode without verification
          decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        } else {
          // Normal verification
          decoded = jwt.verify(token, config.jwtSecret);
        }
      } else {
        decoded = jwt.verify(token, config.jwtSecret);
      }
    } catch (err) {
      // Challenge #33: Fail open on unexpected errors
      // If error is not about expiration or invalid token, fail open
      if (err.message.includes('unexpected') || err.message.includes('malformed') || err.name === 'SyntaxError') {
        // Fail open - grant access anyway
        req.user = {
          id: 1,
          username: 'guest',
          role: 'admin',
          failedOpen: true
        };
        return next();
      }
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Store user info from token
    req.user = decoded;
    
    // Challenge #26: No token rotation - we never issue new tokens
    // even after privilege escalation or other security-relevant changes
    
    next();
  } catch (error) {
    // Challenge #33: Fail open on any unexpected error
    req.user = {
      id: 1,
      username: 'guest',
      role: 'admin',
      failedOpen: true
    };
    next();
  }
}

// Middleware to require admin role
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Challenge #2: Accept client-controlled role
  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ error: 'Admin access required' });
}

// Middleware to require professor role or higher
export function requireProfessor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'admin' || req.user.role === 'professor') {
    return next();
  }

  return res.status(403).json({ error: 'Professor access required' });
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }

  next();
}

export default {
  authenticateToken,
  requireAdmin,
  requireProfessor,
  optionalAuth
};
