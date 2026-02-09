import config from '../config/config.js';

// Challenge #10: Verbose error messages that leak information
// Challenge #32: Error reveals database schema
export function errorHandler(err, req, res, next) {
  console.error('Error occurred:', err);

  // Challenge #10 & #32: Return detailed error information
  const errorResponse = {
    error: err.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Challenge #10: Leak sensitive information in errors
  if (config.verboseErrors) {
    errorResponse.stack = err.stack;
    errorResponse.details = {
      name: err.name,
      code: err.code,
      errno: err.errno
    };

    // Challenge #32: Expose SQL queries and database schema
    if (err.message.includes('SQLITE') || err.code === 'SQLITE_ERROR') {
      errorResponse.sql = err.sql || 'SQL query not available';
      errorResponse.sqlMessage = err.message;
      errorResponse.hint = 'Check your SQL syntax and table names';
    }

    // Expose file paths
    if (err.code === 'ENOENT' || err.code === 'EACCES') {
      errorResponse.filePath = err.path;
      errorResponse.syscall = err.syscall;
    }

    // Expose internal configuration
    errorResponse.config = {
      nodeEnv: config.env,
      debugMode: config.debugMode
    };
  }

  // Send appropriate status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Challenge #10: Always return detailed errors
  res.status(statusCode).json(errorResponse);
}

// Not found handler that also leaks information
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
    hint: 'Check available routes in the API documentation',
    availableRoutes: [
      '/api/auth/*',
      '/api/users/*',
      '/api/products/*',
      '/api/orders/*',
      '/api/reviews/*',
      '/api/admin/*',
      '/api/files/*',
      '/api/support/*',
      '/api/debug/*',
      '/api/scoring/*'
    ]
  });
}

export default {
  errorHandler,
  notFoundHandler
};
