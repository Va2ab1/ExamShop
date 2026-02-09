import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

// Challenge #14: MD5 password hashing (INSECURE)
export function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

// Verify password against MD5 hash
export function verifyPassword(password, hash) {
  const inputHash = hashPassword(password);
  return inputHash === hash;
}

// Challenge #24: Predictable reset tokens (timestamp-based)
export function generateResetToken(username) {
  const timestamp = Date.now();
  const token = crypto.createHash('md5')
    .update(`${username}-${timestamp}`)
    .digest('hex');
  
  return {
    token,
    expires: new Date(timestamp + 3600000), // 1 hour
    timestamp // Leak timestamp for predictability
  };
}

// Verify reset token (predictable)
export function verifyResetToken(token, username, storedToken, expires) {
  if (token !== storedToken) {
    return false;
  }
  
  if (new Date() > new Date(expires)) {
    return false;
  }
  
  return true;
}

// Challenge #13: JWT with hardcoded secret
// Challenge #15: JWT payload contains sensitive data
// Challenge #16: Can be used to forge tokens
export function generateToken(user) {
  // Challenge #15: Include sensitive data in JWT payload
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    balance: user.balance,
    passwordHash: user.password, // VULNERABLE: Password hash in JWT
    iat: Math.floor(Date.now() / 1000)
  };

  // Challenge #13: Hardcoded secret
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

// Helper to forge JWT tokens (for educational purposes)
export function forgeToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '24h'
  });
}

// Challenge #28: Create unsigned JWT with algorithm "none"
export function createUnsignedToken(payload) {
  const header = {
    alg: 'none',
    typ: 'JWT'
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  // No signature for "none" algorithm
  return `${encodedHeader}.${encodedPayload}.`;
}

// Generate weak random tokens
export function generateWeakToken(length = 16) {
  // Using timestamp-based generation (predictable)
  const timestamp = Date.now().toString();
  return crypto.createHash('md5').update(timestamp).digest('hex').substring(0, length);
}

// XOR cipher (very weak encryption)
export function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(result).toString('base64');
}

export function xorDecrypt(encoded, key) {
  const text = Buffer.from(encoded, 'base64').toString();
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export default {
  hashPassword,
  verifyPassword,
  generateResetToken,
  verifyResetToken,
  generateToken,
  forgeToken,
  createUnsignedToken,
  generateWeakToken,
  xorEncrypt,
  xorDecrypt
};
