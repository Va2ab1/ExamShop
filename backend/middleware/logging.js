// Challenge #30: Doesn't log failed logins
// Challenge #31: Vulnerable to log injection

export function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Challenge #31: No sanitization - vulnerable to log injection
  const username = req.body?.username || req.user?.username || 'anonymous';
  
  // Basic logging without sanitization
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - User: ${username}`);
  
  // Challenge #30: We don't log authentication failures
  // Failed logins are not recorded anywhere
  
  next();
}

export function accessLogger(action, req) {
  const timestamp = new Date().toISOString();
  const username = req.user?.username || 'anonymous';
  const ip = req.ip || req.connection.remoteAddress;
  
  // Challenge #31: Vulnerable to log injection through username
  console.log(`[${timestamp}] ACCESS - Action: ${action} - User: ${username} - IP: ${ip}`);
}

// No security event logging for:
// - Failed login attempts (Challenge #30)
// - Multiple failed attempts
// - Privilege escalation attempts
// - IDOR attempts
// - SQL injection attempts
// - Any suspicious activity

export default {
  requestLogger,
  accessLogger
};
