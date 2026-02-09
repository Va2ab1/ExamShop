import Database from 'better-sqlite3';
import config from './config.js';
import crypto from 'crypto';

let db = null;

export function initializeDatabase() {
  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  
  createTables();
  seedData();
  
  return db;
}

export function getDatabase() {
  if (!db) {
    db = initializeDatabase();
  }
  return db;
}

function createTables() {
  // Users table - Challenge #14: MD5 password hashing
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      reset_token TEXT,
      reset_token_expires DATETIME
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      stock INTEGER DEFAULT 100,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      coupon_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Order items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Reviews table - Challenge #18: Stored XSS
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Support tickets table - Challenge #6: SSRF
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      attachment_url TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Secret flags table - Challenge #19, #20: SQL Injection
  db.exec(`
    CREATE TABLE IF NOT EXISTS secret_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flag_name TEXT NOT NULL,
      flag_value TEXT NOT NULL,
      challenge_id INTEGER NOT NULL,
      description TEXT
    )
  `);

  // Credit cards table - for IDOR challenges
  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_number TEXT NOT NULL,
      card_holder TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      cvv TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Admin notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Scoring table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scoring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      challenge_id INTEGER NOT NULL,
      flag_submitted TEXT NOT NULL,
      score INTEGER NOT NULL,
      hints_used INTEGER DEFAULT 0,
      solution_viewed INTEGER DEFAULT 0,
      solved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submission_time_seconds INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, challenge_id)
    )
  `);

  // Files metadata table
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Coupons table - Challenge #23: Coupon abuse
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_percent REAL NOT NULL,
      max_uses INTEGER DEFAULT 1,
      current_uses INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Coupon usage tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupon_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  // Challenge tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty INTEGER NOT NULL,
      flag TEXT NOT NULL,
      base_score INTEGER NOT NULL,
      hint_text TEXT,
      solution_text TEXT
    )
  `);
}

function seedData() {
  // Check if data already exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    return; // Already seeded
  }

  // Seed users with MD5 hashed passwords (VULNERABLE - Challenge #14)
  const users = [
    {
      username: 'admin',
      email: 'admin@examshop.local',
      password: crypto.createHash('md5').update('admin123').digest('hex'),
      role: 'admin',
      balance: 10000
    },
    {
      username: 'student1',
      email: 'student1@university.edu',
      password: crypto.createHash('md5').update('student1pass').digest('hex'),
      role: 'student',
      balance: 500
    },
    {
      username: 'professor',
      email: 'prof@university.edu',
      password: crypto.createHash('md5').update('pr0f3ss0r!').digest('hex'),
      role: 'professor',
      balance: 2000
    },
    {
      username: 'testuser',
      email: 'test@example.com',
      password: crypto.createHash('md5').update('password123').digest('hex'),
      role: 'student',
      balance: 100
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password, role, balance)
    VALUES (?, ?, ?, ?, ?)
  `);

  users.forEach(user => {
    insertUser.run(user.username, user.email, user.password, user.role, user.balance);
  });

  // Seed products - Russian exam answers (humorous)
  const products = [
    {
      name: 'Шпаргалка по Высшей Математике',
      description: 'Полный набор формул и решений для экзамена по высшей математике. Включает интегралы, производные, и теорию вероятности.',
      price: 299.99,
      category: 'Математика',
      stock: 50,
      image_url: '/images/math-cheat.jpg'
    },
    {
      name: 'Ответы на Экзамен по Физике',
      description: 'Все ответы на билеты по физике. Механика, термодинамика, электромагнетизм, и квантовая физика.',
      price: 349.99,
      category: 'Физика',
      stock: 30,
      image_url: '/images/physics-answers.jpg'
    },
    {
      name: 'Готовые Рефераты по Истории России',
      description: '20 готовых рефератов по истории России от древних времен до современности. Гарантия уникальности 80%.',
      price: 199.99,
      category: 'История',
      stock: 100,
      image_url: '/images/history-refs.jpg'
    },
    {
      name: 'Решебник по Органической Химии',
      description: 'Подробные решения всех задач из учебника по органической химии. Механизмы реакций и структурные формулы.',
      price: 279.99,
      category: 'Химия',
      stock: 40,
      image_url: '/images/chem-solutions.jpg'
    },
    {
      name: 'Шпора по Английскому Языку',
      description: 'Компактная шпаргалка с грамматикой, неправильными глаголами и устойчивыми выражениями.',
      price: 149.99,
      category: 'Иностранные языки',
      stock: 75,
      image_url: '/images/english-cheat.jpg'
    },
    {
      name: 'Ответы на Тесты по Программированию',
      description: 'Решения задач по программированию на C++, Java и Python. Алгоритмы и структуры данных.',
      price: 399.99,
      category: 'Информатика',
      stock: 25,
      image_url: '/images/coding-answers.jpg'
    },
    {
      name: 'Билеты по Философии с Ответами',
      description: 'Все 30 экзаменационных билетов по философии с развернутыми ответами. От Платона до постмодернизма.',
      price: 229.99,
      category: 'Философия',
      stock: 60,
      image_url: '/images/philosophy-tickets.jpg'
    },
    {
      name: 'Курсовая Работа по Экономике',
      description: 'Готовая курсовая работа на тему "Макроэкономические показатели развития". 35 страниц, список литературы включен.',
      price: 599.99,
      category: 'Экономика',
      stock: 15,
      image_url: '/images/economics-coursework.jpg'
    },
    {
      name: 'Шпаргалки по Биологии',
      description: 'Миниатюрные шпаргалки по всем разделам биологии: ботаника, зоология, анатомия, генетика.',
      price: 179.99,
      category: 'Биология',
      stock: 80,
      image_url: '/images/biology-cheats.jpg'
    },
    {
      name: 'Дипломная Работа по Юриспруденции',
      description: 'Образцовая дипломная работа на тему "Гражданское право в современной России". 80 страниц, защита на отлично.',
      price: 1299.99,
      category: 'Юриспруденция',
      stock: 5,
      image_url: '/images/law-diploma.jpg'
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, category, stock, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  products.forEach(product => {
    insertProduct.run(product.name, product.description, product.price, product.category, product.stock, product.image_url);
  });

  // Seed secret flags for SQL injection challenges
  const secretFlags = [
    {
      flag_name: 'admin_secret',
      flag_value: 'EXAMSHOP{union_select_all_secrets}',
      challenge_id: 20,
      description: 'Hidden admin flag for SQL injection challenge'
    },
    {
      flag_name: 'database_master_key',
      flag_value: 'db_master_key_9x8y7z',
      challenge_id: 20,
      description: 'Database master key'
    },
    {
      flag_name: 'api_secret_token',
      flag_value: 'secret_api_token_abc123xyz',
      challenge_id: 20,
      description: 'Secret API token'
    }
  ];

  const insertFlag = db.prepare(`
    INSERT INTO secret_flags (flag_name, flag_value, challenge_id, description)
    VALUES (?, ?, ?, ?)
  `);

  secretFlags.forEach(flag => {
    insertFlag.run(flag.flag_name, flag.flag_value, flag.challenge_id, flag.description);
  });

  // Seed credit cards for IDOR challenges
  const creditCards = [
    {
      user_id: 1,
      card_number: '4532-1488-0343-6467',
      card_holder: 'Admin User',
      expiry_date: '12/25',
      cvv: '123'
    },
    {
      user_id: 2,
      card_number: '5425-2334-3010-9903',
      card_holder: 'Student One',
      expiry_date: '09/26',
      cvv: '456'
    },
    {
      user_id: 3,
      card_number: '3782-822463-10005',
      card_holder: 'Professor Smith',
      expiry_date: '03/27',
      cvv: '789'
    }
  ];

  const insertCard = db.prepare(`
    INSERT INTO credit_cards (user_id, card_number, card_holder, expiry_date, cvv)
    VALUES (?, ?, ?, ?, ?)
  `);

  creditCards.forEach(card => {
    insertCard.run(card.user_id, card.card_number, card.card_holder, card.expiry_date, card.cvv);
  });

  // Seed admin notes
  const adminNotes = [
    {
      user_id: 2,
      note: 'Suspicious activity detected. Student accessed admin panel.',
      created_by: 1
    },
    {
      user_id: 3,
      note: 'Professor account verified. Increased balance approved.',
      created_by: 1
    }
  ];

  const insertNote = db.prepare(`
    INSERT INTO admin_notes (user_id, note, created_by)
    VALUES (?, ?, ?)
  `);

  adminNotes.forEach(note => {
    insertNote.run(note.user_id, note.note, note.created_by);
  });

  // Seed coupons for Challenge #23
  const DAYS_TO_MS = 24 * 60 * 60 * 1000;
  const coupons = [
    {
      code: 'WELCOME50',
      discount_percent: 50,
      max_uses: 1,
      current_uses: 0,
      expires_at: new Date(Date.now() + 30 * DAYS_TO_MS).toISOString()
    },
    {
      code: 'STUDENT25',
      discount_percent: 25,
      max_uses: 5,
      current_uses: 0,
      expires_at: new Date(Date.now() + 60 * DAYS_TO_MS).toISOString()
    },
    {
      code: 'FREESHIP',
      discount_percent: 10,
      max_uses: 100,
      current_uses: 0,
      expires_at: new Date(Date.now() + 90 * DAYS_TO_MS).toISOString()
    }
  ];

  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, discount_percent, max_uses, current_uses, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  coupons.forEach(coupon => {
    insertCoupon.run(coupon.code, coupon.discount_percent, coupon.max_uses, coupon.current_uses, coupon.expires_at);
  });

  // Seed all 33 challenges
  const challenges = [
    { id: 1, name: 'IDOR in User Profile', description: 'Access another user\'s profile information by manipulating the user ID', category: 'Access Control', difficulty: 1, flag: 'EXAMSHOP{idor_profile_exposed_2025}', base_score: 100, hint_text: 'Try changing the user ID in the URL', solution_text: 'Change /api/users/2 to /api/users/1 to access admin profile' },
    { id: 2, name: 'Broken Admin Access', description: 'Access the admin dashboard without proper authorization', category: 'Access Control', difficulty: 1, flag: 'EXAMSHOP{admin_panel_unlocked}', base_score: 100, hint_text: 'Check what headers the server accepts', solution_text: 'Send X-User-Role: admin header to access admin endpoints' },
    { id: 3, name: 'Profile Modification IDOR', description: 'Modify another user\'s profile', category: 'Access Control', difficulty: 1, flag: 'EXAMSHOP{profile_tampered}', base_score: 100, hint_text: 'Can you update someone else\'s profile?', solution_text: 'PUT request to /api/users/1 with modified data' },
    { id: 4, name: 'Mass Assignment - Role Escalation', description: 'Escalate your privileges to admin through mass assignment', category: 'Access Control', difficulty: 2, flag: 'EXAMSHOP{privilege_escalated_to_admin}', base_score: 250, hint_text: 'What fields can you modify in the update request?', solution_text: 'Include "role": "admin" in PUT /api/users/:id request body' },
    { id: 5, name: 'Order IDOR', description: 'Access another user\'s order details', category: 'Access Control', difficulty: 1, flag: 'EXAMSHOP{order_data_leaked}', base_score: 100, hint_text: 'Try different order IDs', solution_text: 'GET /api/orders/1 to access other users\' orders' },
    { id: 6, name: 'SSRF in Support Tickets', description: 'Use SSRF to access internal resources', category: 'Injection', difficulty: 2, flag: 'EXAMSHOP{ssrf_internal_access}', base_score: 250, hint_text: 'The attachment_url field fetches external resources', solution_text: 'Submit support ticket with attachment_url: http://localhost:3000/api/debug/info' },
    { id: 7, name: 'Default Credentials', description: 'Find and use default credentials', category: 'Authentication', difficulty: 1, flag: 'EXAMSHOP{default_creds_never_change}', base_score: 100, hint_text: 'Check common default credentials', solution_text: 'Login with admin/admin123' },
    { id: 8, name: 'Debug Endpoint Exposed', description: 'Find and exploit exposed debug endpoints', category: 'Security Misconfiguration', difficulty: 1, flag: 'EXAMSHOP{debug_endpoint_exposed}', base_score: 100, hint_text: 'Look for debug or diagnostic endpoints', solution_text: 'Access /api/debug/info endpoint' },
    { id: 9, name: 'Directory Listing', description: 'Exploit directory listing to find sensitive files', category: 'Security Misconfiguration', difficulty: 1, flag: 'EXAMSHOP{directory_listing_enabled}', base_score: 100, hint_text: 'File upload/download endpoints might list files', solution_text: 'GET /api/files/list to see all uploaded files' },
    { id: 10, name: 'Verbose Error Messages', description: 'Extract sensitive information from error messages', category: 'Security Misconfiguration', difficulty: 1, flag: 'EXAMSHOP{verbose_errors_are_helpful}', base_score: 100, hint_text: 'Trigger an error and examine the response', solution_text: 'Send malformed request to get detailed error with flag' },
    { id: 11, name: 'Vulnerable Dependencies', description: 'Exploit vulnerable npm package', category: 'Vulnerable Components', difficulty: 2, flag: 'EXAMSHOP{vulnerable_dependency_found}', base_score: 250, hint_text: 'Check package.json for old versions', solution_text: 'Identify lodash 4.17.20 has CVE-2020-8203' },
    { id: 12, name: 'Prototype Pollution', description: 'Exploit prototype pollution vulnerability', category: 'Injection', difficulty: 3, flag: 'EXAMSHOP{prototype_polluted}', base_score: 500, hint_text: 'Old lodash version is vulnerable to prototype pollution', solution_text: 'Use merge/set with __proto__ in JSON payload' },
    { id: 13, name: 'Hardcoded Secrets', description: 'Find hardcoded secrets in the application', category: 'Cryptographic Failures', difficulty: 1, flag: 'EXAMSHOP{hardcoded_secret_found}', base_score: 100, hint_text: 'Secrets might be in config files or source code', solution_text: 'JWT secret is hardcoded: super-secret-key-examshop-2025' },
    { id: 14, name: 'Weak Password Hashing', description: 'Exploit weak password hashing (MD5)', category: 'Cryptographic Failures', difficulty: 2, flag: 'EXAMSHOP{md5_is_not_hashing}', base_score: 250, hint_text: 'Check what hashing algorithm is used', solution_text: 'Passwords are MD5 hashed, can be cracked easily' },
    { id: 15, name: 'Sensitive Data in JWT', description: 'Extract sensitive data from JWT tokens', category: 'Cryptographic Failures', difficulty: 1, flag: 'EXAMSHOP{jwt_payload_is_public}', base_score: 100, hint_text: 'JWT tokens are base64 encoded, not encrypted', solution_text: 'Decode JWT to find password hash and balance in payload' },
    { id: 16, name: 'JWT Forgery', description: 'Forge a JWT token to gain unauthorized access', category: 'Cryptographic Failures', difficulty: 3, flag: 'EXAMSHOP{jwt_forged_successfully}', base_score: 500, hint_text: 'Use the hardcoded secret to sign your own token', solution_text: 'Create JWT with role: admin using secret: super-secret-key-examshop-2025' },
    { id: 17, name: 'Reflected XSS', description: 'Find and exploit reflected XSS vulnerability', category: 'XSS', difficulty: 2, flag: 'EXAMSHOP{xss_reflected_in_search}', base_score: 250, hint_text: 'Search parameters might not be sanitized', solution_text: 'Use XSS payload in search: <script>alert(document.domain)</script>' },
    { id: 18, name: 'Stored XSS', description: 'Execute stored XSS in product reviews', category: 'XSS', difficulty: 2, flag: 'EXAMSHOP{stored_xss_in_review}', base_score: 250, hint_text: 'Reviews might not sanitize HTML', solution_text: 'Post review with XSS: <script>alert("XSS")</script>' },
    { id: 19, name: 'SQL Injection - Authentication Bypass', description: 'Bypass login using SQL injection', category: 'Injection', difficulty: 2, flag: 'EXAMSHOP{sql_injection_login_bypass}', base_score: 250, hint_text: 'Try SQL injection in login form', solution_text: 'Username: admin\'-- Password: anything' },
    { id: 20, name: 'SQL Injection - Data Extraction', description: 'Extract secret data using UNION-based SQL injection', category: 'Injection', difficulty: 3, flag: 'EXAMSHOP{union_select_all_secrets}', base_score: 500, hint_text: 'Use UNION SELECT to query other tables', solution_text: 'Search: \' UNION SELECT flag_value,description,flag_name,id,challenge_id,flag_value FROM secret_flags--' },
    { id: 21, name: 'Command Injection', description: 'Execute arbitrary commands on the server', category: 'Injection', difficulty: 3, flag: 'EXAMSHOP{command_injection_rce}', base_score: 500, hint_text: 'File conversion might execute shell commands', solution_text: 'POST /api/files/convert with format: "; cat /etc/passwd"' },
    { id: 22, name: 'Price Manipulation', description: 'Get products for free using negative prices', category: 'Business Logic', difficulty: 2, flag: 'EXAMSHOP{free_exam_answers}', base_score: 250, hint_text: 'Can you manipulate prices or quantities?', solution_text: 'Order with negative quantity or price to get positive balance' },
    { id: 23, name: 'Coupon Code Abuse', description: 'Use a coupon code multiple times', category: 'Business Logic', difficulty: 2, flag: 'EXAMSHOP{coupon_abused}', base_score: 250, hint_text: 'Race condition in coupon validation', solution_text: 'Send multiple concurrent requests with same coupon code' },
    { id: 24, name: 'Predictable Reset Tokens', description: 'Exploit predictable password reset tokens', category: 'Authentication', difficulty: 2, flag: 'EXAMSHOP{predictable_reset_token}', base_score: 250, hint_text: 'Reset tokens might be based on timestamps', solution_text: 'Generate reset token using timestamp-based algorithm' },
    { id: 25, name: 'No Rate Limiting', description: 'Exploit missing rate limiting', category: 'Security Misconfiguration', difficulty: 1, flag: 'EXAMSHOP{no_rate_limiting}', base_score: 100, hint_text: 'Try brute forcing without restrictions', solution_text: 'Send 1000+ login requests - no rate limiting present' },
    { id: 26, name: 'Session Not Rotated', description: 'Exploit session fixation vulnerability', category: 'Authentication', difficulty: 2, flag: 'EXAMSHOP{session_not_rotated}', base_score: 250, hint_text: 'Check if tokens change after privilege changes', solution_text: 'Token remains same after role escalation' },
    { id: 27, name: 'Weak Password Policy', description: 'Create account with weak password', category: 'Authentication', difficulty: 1, flag: 'EXAMSHOP{password_policy_missing}', base_score: 100, hint_text: 'Try registering with very weak password', solution_text: 'Register with password: "123" - no policy enforcement' },
    { id: 28, name: 'JWT Algorithm None', description: 'Bypass JWT signature with "none" algorithm', category: 'Cryptographic Failures', difficulty: 3, flag: 'EXAMSHOP{jwt_algorithm_none}', base_score: 500, hint_text: 'JWT might accept unsigned tokens', solution_text: 'Create JWT with alg: "none" and no signature' },
    { id: 29, name: 'Mass Assignment on Registration', description: 'Register as admin using mass assignment', category: 'Access Control', difficulty: 2, flag: 'EXAMSHOP{mass_assignment_admin}', base_score: 250, hint_text: 'What fields does registration accept?', solution_text: 'Include "role": "admin" in registration POST body' },
    { id: 30, name: 'Missing Security Logging', description: 'Exploit missing audit logs', category: 'Security Misconfiguration', difficulty: 1, flag: 'EXAMSHOP{logging_is_absent}', base_score: 100, hint_text: 'Failed login attempts might not be logged', solution_text: 'Failed logins are not logged, can brute force undetected' },
    { id: 31, name: 'Log Injection', description: 'Inject malicious data into logs', category: 'Injection', difficulty: 2, flag: 'EXAMSHOP{log_injection_success}', base_score: 250, hint_text: 'Logs might not sanitize input', solution_text: 'Login with username containing newlines to inject log entries' },
    { id: 32, name: 'Error Reveals Schema', description: 'Extract database schema from error messages', category: 'Security Misconfiguration', difficulty: 2, flag: 'EXAMSHOP{error_reveals_schema}', base_score: 250, hint_text: 'SQL errors might reveal table structure', solution_text: 'Trigger SQL error to see full query and table names' },
    { id: 33, name: 'Fail-Open Authentication', description: 'Exploit authentication that fails open', category: 'Authentication', difficulty: 2, flag: 'EXAMSHOP{fail_open_auth}', base_score: 250, hint_text: 'What happens when auth middleware crashes?', solution_text: 'Send malformed JWT to crash auth middleware - fails open' }
  ];

  const insertChallenge = db.prepare(`
    INSERT INTO challenges (id, name, description, category, difficulty, flag, base_score, hint_text, solution_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  challenges.forEach(challenge => {
    insertChallenge.run(
      challenge.id,
      challenge.name,
      challenge.description,
      challenge.category,
      challenge.difficulty,
      challenge.flag,
      challenge.base_score,
      challenge.hint_text,
      challenge.solution_text
    );
  });

  console.log('Database seeded successfully with all challenges and data');
}

export default { initializeDatabase, getDatabase };
