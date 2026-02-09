// Challenge #27: Weak password policy (or none at all)

export function validateEmail(email) {
  // Very basic validation
  return email && email.includes('@');
}

export function validateUsername(username) {
  // Minimal validation
  return username && username.length >= 3;
}

// Challenge #27: No real password policy
export function validatePassword(password) {
  // Extremely weak validation - accepts anything
  return password && password.length >= 1;
}

export function validateProductData(data) {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Product name is required' };
  }
  
  if (data.price === undefined || data.price === null) {
    return { valid: false, error: 'Price is required' };
  }
  
  // Challenge #22: No validation for negative prices
  // Allow negative prices/quantities (vulnerable)
  
  return { valid: true };
}

export function validateOrderData(data) {
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return { valid: false, error: 'Order must contain items' };
  }
  
  // Challenge #22: No validation for negative quantities or prices
  // This allows price manipulation
  
  return { valid: true };
}

export function sanitizeInput(input) {
  // Challenge #17, #18: No real sanitization
  // Just return input as-is (vulnerable to XSS)
  return input;
}

export function sanitizeFilename(filename) {
  // Weak sanitization that doesn't prevent path traversal
  // Challenge #9: Path traversal possible
  return filename.replace(/\\/g, '/');
}

export function validateFileUpload(file) {
  // Minimal validation
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  // No real file type checking
  // No size limits enforced strictly
  // No content validation
  
  return { valid: true };
}

export function validateURL(url) {
  // Challenge #6: No SSRF protection
  // Allows internal URLs like localhost, 127.0.0.1, file://, etc.
  try {
    new URL(url);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid URL' };
  }
}

// SQL injection "prevention" that doesn't work
export function sanitizeSQL(input) {
  // Challenge #19, #20: Ineffective SQL sanitization
  // Only removes some obvious patterns but not all
  if (typeof input !== 'string') {
    return input;
  }
  
  // This doesn't actually prevent SQL injection
  return input.replace(/;--/g, '');
}

export function validateCouponCode(code) {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Coupon code is required' };
  }
  
  return { valid: true };
}

export function validateReview(data) {
  if (!data.product_id) {
    return { valid: false, error: 'Product ID is required' };
  }
  
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    return { valid: false, error: 'Rating must be between 1 and 5' };
  }
  
  // Challenge #18: No XSS protection on comments
  return { valid: true };
}

export function validateSupportTicket(data) {
  if (!data.subject || data.subject.trim().length === 0) {
    return { valid: false, error: 'Subject is required' };
  }
  
  if (!data.message || data.message.trim().length === 0) {
    return { valid: false, error: 'Message is required' };
  }
  
  // Challenge #6: No URL validation for SSRF
  return { valid: true };
}

export default {
  validateEmail,
  validateUsername,
  validatePassword,
  validateProductData,
  validateOrderData,
  sanitizeInput,
  sanitizeFilename,
  validateFileUpload,
  validateURL,
  sanitizeSQL,
  validateCouponCode,
  validateReview,
  validateSupportTicket
};
