# ExamShop Backend - Intentionally Vulnerable Application

**⚠️ WARNING: This application contains REAL, EXPLOITABLE security vulnerabilities for educational purposes only. DO NOT deploy to production!**

## Overview

ExamShop is an intentionally vulnerable e-commerce platform designed for security training. It simulates an online shop selling Russian exam answers and cheat sheets. The backend contains **33 real, exploitable vulnerabilities** covering the OWASP Top 10 and beyond.

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js (ES modules)
- **Database**: SQLite3 via better-sqlite3
- **Authentication**: JWT (with intentional flaws)
- **Password Hashing**: MD5 (intentionally weak)

## Installation

```bash
cd backend
npm install
npm start
```

The server will start on port 3000.

## Default Credentials

- **Admin**: `admin` / `admin123` (Challenge #7)
- **Student**: `student1` / `student1pass`
- **Professor**: `professor` / `pr0f3ss0r!`
- **Test User**: `testuser` / `password123`

## All 33 Vulnerabilities

### Access Control (Challenges 1-5)

1. **IDOR in User Profile** (#1)
   - **Flag**: `EXAMSHOP{idor_profile_exposed_2025}`
   - Access any user's profile by changing the ID in `/api/users/:id`
   - No authorization check implemented

2. **Broken Admin Access** (#2)
   - **Flag**: `EXAMSHOP{admin_panel_unlocked}`
   - Access admin endpoints by sending `X-User-Role: admin` header
   - Server trusts client-sent role header

3. **Profile Modification IDOR** (#3)
   - **Flag**: `EXAMSHOP{profile_tampered}`
   - Modify any user's profile via `PUT /api/users/:id`

4. **Mass Assignment - Role Escalation** (#4)
   - **Flag**: `EXAMSHOP{privilege_escalated_to_admin}`
   - Include `"role": "admin"` in user update request
   - No field filtering on updates

5. **Order IDOR** (#5)
   - **Flag**: `EXAMSHOP{order_data_leaked}`
   - Access other users' orders via `GET /api/orders/:id`

### Injection Vulnerabilities (Challenges 6, 12, 19-21)

6. **SSRF in Support Tickets** (#6)
   - **Flag**: `EXAMSHOP{ssrf_internal_access}`
   - Submit support ticket with `attachment_url: http://localhost:3000/api/debug/info`
   - No URL validation against internal endpoints

12. **Prototype Pollution** (#12)
   - **Flag**: `EXAMSHOP{prototype_polluted}`
   - Exploit vulnerable lodash 4.17.20 with `__proto__` in JSON

19. **SQL Injection - Login Bypass** (#19)
   - **Flag**: `EXAMSHOP{sql_injection_login_bypass}`
   - Username: `admin'--` with any password
   - String concatenation instead of prepared statements

20. **SQL Injection - Data Extraction** (#20)
   - **Flag**: `EXAMSHOP{union_select_all_secrets}`
   - Search: `' UNION SELECT flag_value,description,flag_name,id,challenge_id,flag_value FROM secret_flags--`
   - Extract data from `secret_flags` table

21. **Command Injection** (#21)
   - **Flag**: `EXAMSHOP{command_injection_rce}`
   - POST `/api/files/convert` with `format: "; cat /etc/passwd"`
   - Unsanitized input to shell commands

### Authentication Failures (Challenges 7, 24-28)

7. **Default Credentials** (#7)
   - **Flag**: `EXAMSHOP{default_creds_never_change}`
   - Login with `admin` / `admin123`

24. **Predictable Reset Tokens** (#24)
   - **Flag**: `EXAMSHOP{predictable_reset_token}`
   - Reset tokens based on `md5(username-timestamp)`
   - Timestamp leaked in response

25. **No Rate Limiting** (#25)
   - **Flag**: `EXAMSHOP{no_rate_limiting}`
   - Unlimited login attempts allowed

26. **Session Not Rotated** (#26)
   - **Flag**: `EXAMSHOP{session_not_rotated}`
   - JWT token remains valid after privilege escalation

27. **Weak Password Policy** (#27)
   - **Flag**: `EXAMSHOP{password_policy_missing}`
   - Register with password: `"123"` - no policy enforcement

28. **JWT Algorithm None** (#28)
   - **Flag**: `EXAMSHOP{jwt_algorithm_none}`
   - Create JWT with `alg: "none"` and no signature

### Cryptographic Failures (Challenges 13-16)

13. **Hardcoded Secrets** (#13)
   - **Flag**: `EXAMSHOP{hardcoded_secret_found}`
   - JWT secret: `super-secret-key-examshop-2025` (in config)

14. **Weak Password Hashing** (#14)
   - **Flag**: `EXAMSHOP{md5_is_not_hashing}`
   - Passwords hashed with MD5 (crackable)

15. **Sensitive Data in JWT** (#15)
   - **Flag**: `EXAMSHOP{jwt_payload_is_public}`
   - Decode JWT to find password hash and balance

16. **JWT Forgery** (#16)
   - **Flag**: `EXAMSHOP{jwt_forged_successfully}`
   - Forge JWT with hardcoded secret and `role: admin`

### XSS Vulnerabilities (Challenges 17-18)

17. **Reflected XSS** (#17)
   - **Flag**: `EXAMSHOP{xss_reflected_in_search}`
   - Search parameter reflected without sanitization
   - Try: `?search=<script>alert(1)</script>`

18. **Stored XSS** (#18)
   - **Flag**: `EXAMSHOP{stored_xss_in_review}`
   - Post review with `comment: "<script>alert('XSS')</script>"`

### Security Misconfiguration (Challenges 8-10, 30, 32)

8. **Debug Endpoint Exposed** (#8)
   - **Flag**: `EXAMSHOP{debug_endpoint_exposed}`
   - Access `/api/debug/info` for full config and secrets

9. **Directory Listing** (#9)
   - **Flag**: `EXAMSHOP{directory_listing_enabled}`
   - `GET /api/files/list` shows all uploaded files
   - Path traversal in `/api/files/download/:filename`

10. **Verbose Error Messages** (#10)
    - **Flag**: `EXAMSHOP{verbose_errors_are_helpful}`
    - Error responses include stack traces and SQL queries

30. **Missing Security Logging** (#30)
    - **Flag**: `EXAMSHOP{logging_is_absent}`
    - Failed login attempts not logged

32. **Error Reveals Schema** (#32)
    - **Flag**: `EXAMSHOP{error_reveals_schema}`
    - SQL errors reveal table names and structure

### Vulnerable Components (Challenge 11)

11. **Vulnerable Dependencies** (#11)
    - **Flag**: `EXAMSHOP{vulnerable_dependency_found}`
    - lodash 4.17.20 has CVE-2020-8203 (prototype pollution)

### Business Logic Flaws (Challenges 22-23)

22. **Price Manipulation** (#22)
    - **Flag**: `EXAMSHOP{free_exam_answers}`
    - Order with negative quantity/price to gain money
    - No validation on order totals

23. **Coupon Code Abuse** (#23)
    - **Flag**: `EXAMSHOP{coupon_abused}`
    - Race condition in coupon validation
    - Send multiple concurrent requests with same coupon

### Mass Assignment (Challenge 29)

29. **Mass Assignment on Registration** (#29)
    - **Flag**: `EXAMSHOP{mass_assignment_admin}`
    - Register with `"role": "admin"` in request body

### Log Injection (Challenge 31)

31. **Log Injection** (#31)
    - **Flag**: `EXAMSHOP{log_injection_success}`
    - Username with newlines to inject fake log entries

### Fail-Open Authentication (Challenge 33)

33. **Fail-Open Authentication** (#33)
    - **Flag**: `EXAMSHOP{fail_open_auth}`
    - Send malformed JWT to crash auth - fails open with admin access

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (SQL injection vulnerable)
- `POST /api/auth/register` - Register (mass assignment vulnerable)
- `POST /api/auth/reset-password` - Reset password (predictable tokens)

### Users
- `GET /api/users/:id` - Get user profile (IDOR)
- `PUT /api/users/:id` - Update user (IDOR + mass assignment)
- `GET /api/users/:id/cards` - Get credit cards (IDOR)

### Products
- `GET /api/products` - List products (SQL injection in search)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product

### Orders
- `POST /api/orders` - Create order (price manipulation)
- `GET /api/orders/:id` - Get order (IDOR)
- `POST /api/orders/coupon` - Apply coupon (race condition)

### Reviews
- `POST /api/reviews` - Submit review (stored XSS)
- `GET /api/reviews/:productId` - Get reviews

### Admin
- `GET /api/admin/dashboard` - Admin dashboard (broken access control)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/:id/role` - Update user role

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/download/:filename` - Download file (path traversal)
- `GET /api/files/list` - List files (directory listing)
- `POST /api/files/convert` - Convert file (command injection)

### Support
- `POST /api/support/tickets` - Create ticket (SSRF)
- `GET /api/support/tickets/:id` - Get ticket

### Debug (Should not exist!)
- `GET /api/debug/info` - System information
- `GET /api/debug/env` - Environment variables
- `GET /api/debug/schema` - Database schema
- `GET /api/debug/flags` - All challenge flags
- `POST /api/debug/sql` - Execute SQL query

### Scoring
- `POST /api/scoring/submit` - Submit flag
- `GET /api/scoring/challenges` - List challenges
- `GET /api/scoring/leaderboard` - View leaderboard
- `GET /api/scoring/stats/:userId` - User statistics
- `POST /api/scoring/hint` - Get hint (-20% score)
- `POST /api/scoring/solution-view` - View solution (-50% score)

## Scoring System

- **⭐ Difficulty 1**: 100 points
- **⭐⭐ Difficulty 2**: 250 points
- **⭐⭐⭐ Difficulty 3**: 500 points

### Penalties
- **Hint used**: -20% per hint
- **Solution viewed**: -50%
- **Group submission** (within 5 min): -30%

### Bonus
- **Speed bonus**: +10% if faster than median solve time

## Database Schema

### users
- id, username, email, password (MD5), role, balance, created_at, last_login
- reset_token, reset_token_expires

### products
- id, name, description, price, category, stock, image_url

### orders
- id, user_id, total_price, status, coupon_code, created_at

### order_items
- id, order_id, product_id, quantity, price

### reviews
- id, product_id, user_id, rating, comment, created_at

### support_tickets
- id, user_id, subject, message, attachment_url, status

### secret_flags
- id, flag_name, flag_value, challenge_id, description

### credit_cards
- id, user_id, card_number, card_holder, expiry_date, cvv

### admin_notes
- id, user_id, note, created_by, created_at

### scoring
- id, user_id, challenge_id, flag_submitted, score, hints_used, solution_viewed, solved_at

### challenges
- id, name, description, category, difficulty, flag, base_score, hint_text, solution_text

### coupons
- id, code, discount_percent, max_uses, current_uses, expires_at

## Products (Russian Exam Answers)

1. Шпаргалка по Высшей Математике (Math cheat sheet) - $299.99
2. Ответы на Экзамен по Физике (Physics answers) - $349.99
3. Готовые Рефераты по Истории России (History essays) - $199.99
4. Решебник по Органической Химии (Chemistry solutions) - $279.99
5. Шпора по Английскому Языку (English cheat sheet) - $149.99
6. Ответы на Тесты по Программированию (Coding answers) - $399.99
7. Билеты по Философии с Ответами (Philosophy tickets) - $229.99
8. Курсовая Работа по Экономике (Economics coursework) - $599.99
9. Шпаргалки по Биологии (Biology cheats) - $179.99
10. Дипломная Работа по Юриспруденции (Law diploma) - $1299.99

## Educational Use Only

This application is designed for:
- Security training and education
- Penetration testing practice
- Understanding common web vulnerabilities
- Teaching secure coding practices

**DO NOT:**
- Deploy to production
- Use on public networks
- Store real data
- Use real credentials

## License

MIT License - For educational purposes only
