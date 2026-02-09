import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import { initializeDatabase } from './config/database.js';
import { requestLogger } from './middleware/logging.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import fileRoutes from './routes/files.js';
import supportRoutes from './routes/support.js';
import debugRoutes from './routes/debug.js';
import scoringRoutes from './routes/scoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize database
console.log('Initializing database...');
initializeDatabase();
console.log('Database initialized successfully');

// Middleware
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Static files (for frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/debug', debugRoutes); // Challenge #8: Debug endpoints in production
app.use('/api/scoring', scoringRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ExamShop API - Intentionally Vulnerable Application',
    version: '1.0.0',
    description: 'Educational vulnerable web application for security training',
    endpoints: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      products: '/api/products/*',
      orders: '/api/orders/*',
      reviews: '/api/reviews/*',
      admin: '/api/admin/*',
      files: '/api/files/*',
      support: '/api/support/*',
      debug: '/api/debug/*',
      scoring: '/api/scoring/*'
    },
    warnings: [
      'This application contains intentional security vulnerabilities',
      'DO NOT deploy this application to production',
      'For educational purposes only'
    ],
    challenges: 33,
    totalFlags: 33
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('ExamShop Backend - Intentionally Vulnerable Application');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.env}`);
  console.log(`Debug mode: ${config.debugMode}`);
  console.log('');
  console.log('⚠️  WARNING: This application contains intentional vulnerabilities');
  console.log('⚠️  DO NOT deploy to production environments');
  console.log('⚠️  For educational and security training purposes only');
  console.log('');
  console.log('Available endpoints:');
  console.log(`  - http://localhost:${PORT}/`);
  console.log(`  - http://localhost:${PORT}/api/auth/*`);
  console.log(`  - http://localhost:${PORT}/api/products/*`);
  console.log(`  - http://localhost:${PORT}/api/users/*`);
  console.log(`  - http://localhost:${PORT}/api/admin/*`);
  console.log(`  - http://localhost:${PORT}/api/orders/*`);
  console.log(`  - http://localhost:${PORT}/api/reviews/*`);
  console.log(`  - http://localhost:${PORT}/api/files/*`);
  console.log(`  - http://localhost:${PORT}/api/support/*`);
  console.log(`  - http://localhost:${PORT}/api/debug/*`);
  console.log(`  - http://localhost:${PORT}/api/scoring/*`);
  console.log('');
  console.log('Default credentials:');
  console.log(`  - Admin: admin / admin123`);
  console.log(`  - Student: student1 / student1pass`);
  console.log(`  - Professor: professor / pr0f3ss0r!`);
  console.log('');
  console.log('Total Challenges: 33');
  console.log('All flags follow the format: EXAMSHOP{...}');
  console.log('='.repeat(60));
});

export default app;
