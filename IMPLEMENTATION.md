# ExamShop Backend Implementation Summary

## Overview
Complete implementation of the ExamShop intentionally vulnerable backend application for security training purposes.

## What Was Built

### Project Structure
```
backend/
├── config/
│   ├── config.js           # Configuration with hardcoded secrets
│   └── database.js         # SQLite database setup and seeding
├── middleware/
│   ├── auth.js             # JWT authentication (with vulnerabilities)
│   ├── errorHandler.js     # Verbose error handling
│   └── logging.js          # Minimal logging (missing security events)
├── routes/
│   ├── admin.js            # Admin endpoints (broken access control)
│   ├── auth.js             # Authentication (SQL injection)
│   ├── debug.js            # Debug endpoints (should not exist)
│   ├── files.js            # File operations (path traversal, command injection)
│   ├── orders.js           # Order management (price manipulation, race conditions)
│   ├── products.js         # Product catalog (SQL injection in search)
│   ├── reviews.js          # Product reviews (XSS vulnerabilities)
│   ├── scoring.js          # Challenge scoring system
│   ├── support.js          # Support tickets (SSRF)
│   └── users.js            # User management (IDOR)
├── utils/
│   ├── crypto.js           # MD5 hashing, weak tokens, JWT utilities
│   ├── scorer.js           # Complete scoring engine
│   └── validator.js        # Insufficient validation
├── server.js               # Main Express application
├── README.md               # Comprehensive documentation
└── test-vulnerabilities.sh # Automated vulnerability tests
```

## All 33 Vulnerabilities Implemented

### Access Control (5 challenges)
1. **IDOR in User Profile** - Access any user data via `/api/users/:id`
2. **Broken Admin Access** - Bypass with `X-User-Role: admin` header
3. **Profile Modification IDOR** - Modify any user via PUT request
4. **Mass Assignment Role Escalation** - Set own role to admin
5. **Order IDOR** - Access any order data

### Injection (6 challenges)
6. **SSRF** - Fetch internal URLs via support ticket attachments
12. **Prototype Pollution** - Vulnerable lodash 4.17.20
19. **SQL Injection Login** - Bypass with `admin'--`
20. **SQL Injection Data Extraction** - UNION SELECT from secret tables
21. **Command Injection** - RCE via file conversion format parameter
31. **Log Injection** - Inject fake log entries

### Authentication (6 challenges)
7. **Default Credentials** - admin/admin123
24. **Predictable Reset Tokens** - MD5(username-timestamp)
25. **No Rate Limiting** - Unlimited attempts allowed
26. **Session Not Rotated** - JWT remains valid after privilege changes
27. **Weak Password Policy** - Accepts "123" as password
28. **JWT Algorithm None** - Accept unsigned tokens

### Cryptographic Failures (4 challenges)
13. **Hardcoded Secrets** - JWT secret in config
14. **Weak Password Hashing** - MD5 instead of bcrypt
15. **Sensitive Data in JWT** - Password hash and balance exposed
16. **JWT Forgery** - Can forge with known secret

### XSS (2 challenges)
17. **Reflected XSS** - Search parameter reflected unsanitized
18. **Stored XSS** - Review comments not sanitized

### Security Misconfiguration (5 challenges)
8. **Debug Endpoint Exposed** - `/api/debug/info` leaks everything
9. **Directory Listing** - File listing enabled
10. **Verbose Error Messages** - Stack traces and SQL in errors
30. **Missing Security Logging** - Failed logins not logged
32. **Error Reveals Schema** - SQL errors show table structure

### Vulnerable Components (1 challenge)
11. **Vulnerable Dependencies** - lodash 4.17.20 (CVE-2020-8203)

### Business Logic (2 challenges)
22. **Price Manipulation** - Negative prices/quantities
23. **Coupon Abuse** - Race condition in validation

### Mass Assignment (1 challenge)
29. **Mass Assignment Registration** - Set role during signup

### Fail-Open (1 challenge)
33. **Fail-Open Authentication** - Malformed JWT grants admin access

## Key Features

### Database Schema
- **11 tables**: users, products, orders, order_items, reviews, support_tickets, secret_flags, credit_cards, admin_notes, scoring, challenges, coupons, coupon_usage, files
- **4 default users** with different roles
- **10 Russian exam products** with humorous descriptions
- **33 challenges** with flags, hints, and solutions

### Scoring System
- **Difficulty-based scoring**: 100/250/500 points
- **Hint penalty**: -20% per hint
- **Solution penalty**: -50%
- **Group penalty**: -30% if submitted within 5 minutes
- **Speed bonus**: +10% for faster than median

### API Endpoints
20+ endpoint categories covering:
- Authentication and authorization
- User management
- Product catalog
- Order processing
- Reviews and ratings
- File operations
- Support tickets
- Admin panel
- Debug information
- Scoring and leaderboard

## Technical Specifications

### Technology
- **Node.js 20+** with ES modules
- **Express.js** web framework
- **SQLite3** via better-sqlite3
- **JWT** authentication
- **MD5** password hashing (intentionally weak)

### Dependencies
```json
{
  "express": "^4.18.2",
  "better-sqlite3": "^11.7.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "lodash": "^4.17.20"
}
```

### Code Statistics
- **~4,000 lines** of backend code
- **19 JavaScript files**
- **20+ route handlers**
- **33 exploitable vulnerabilities**
- **0 placeholders or TODOs**

## Testing

### Manual Testing
Server starts successfully on port 3000 with:
- Database initialization and seeding
- All routes mounted
- Middleware configured
- Clear warnings about intentional vulnerabilities

### Verified Functionality
✓ Default credential login works
✓ SQL injection login bypass works
✓ Admin panel bypass with header works
✓ Debug endpoint exposes secrets
✓ Directory listing enabled
✓ IDOR vulnerabilities accessible
✓ All 33 challenges present in database
✓ 10 Russian products seeded
✓ Scoring system functional

## Security Warnings

**⚠️ CRITICAL**: This application contains REAL, EXPLOITABLE vulnerabilities:
- SQL Injection (authentication bypass, data extraction)
- Command Injection (RCE)
- SSRF (internal network access)
- XSS (reflected and stored)
- IDOR (access any user data)
- Authentication bypass (multiple methods)
- Privilege escalation
- And 26 more vulnerabilities!

**DO NOT**:
- Deploy to production
- Use on public networks
- Store real data
- Use real credentials
- Connect to production databases

## Educational Value

This application is designed to teach:
- Common web vulnerabilities
- OWASP Top 10
- Secure coding practices (by example of what NOT to do)
- Penetration testing techniques
- Security assessment methodologies

## Next Steps

The backend is complete and functional. To make it a full application:
1. Build frontend interface (React/Vue)
2. Create Docker deployment
3. Add challenge walkthroughs
4. Create instructor guide
5. Add automated testing suite

## Conclusion

Successfully implemented a complete, intentionally vulnerable backend with:
- ✓ All 33 real, exploitable vulnerabilities
- ✓ Complete scoring system
- ✓ Comprehensive documentation
- ✓ No placeholders or TODOs
- ✓ Production-quality code (intentionally insecure)
- ✓ Educational value for security training

Ready for use in security training environments!
