export default {
  port: process.env.PORT || 3000,
  jwtSecret: 'super-secret-key-examshop-2025', // Challenge #13: Hardcoded secret
  jwtExpiresIn: '24h',
  dbPath: './data/examshop.db',
  uploadDir: './uploads',
  env: process.env.NODE_ENV || 'development',
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  allowedOrigins: '*',
  defaultAdminUser: 'admin',
  defaultAdminPassword: 'admin123', // Challenge #7: Default credentials
  rateLimitDisabled: true, // Challenge #25: No rate limiting
  debugMode: true, // Challenge #8: Debug endpoints exposed
  verboseErrors: true // Challenge #10: Verbose error messages
};
