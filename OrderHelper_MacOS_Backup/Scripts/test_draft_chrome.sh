#!/usr/bin/env bash
# Automation test using headless Chrome (no interference with current tabs)
# File: test_draft_chrome.sh

set -euo pipefail

HTML_FILE="/Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html"
ICLOUD_DRAFTS="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Kitchen/drafts"
LOG_FILE="/Users/alvin/Desktop/Kitchen/test_autosave.log"
TEMP_DIR="/tmp/orderhelper_test_$$"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        log "PASS: $2"
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        log "FAIL: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

cleanup() {
    rm -rf "$TEMP_DIR" 2>/dev/null || true
}

trap cleanup EXIT

echo "========================================"
echo "  Draft Auto-Save Test (Chrome)"
echo "========================================"
echo ""
> "$LOG_FILE"

mkdir -p "$TEMP_DIR"
FAILED_TESTS=0

# Check if Chrome is installed
if ! command -v "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" &> /dev/null; then
    echo -e "${RED}❌ Chrome not found${NC}"
    echo "Please install Chrome or use Safari version of test"
    exit 1
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Test 1: Check HTML file has draft functions
echo "Test 1: Checking draft functions in HTML..."
if grep -q "saveDraftToLocalStorage" "$HTML_FILE" && \
   grep -q "saveDraftToICloud" "$HTML_FILE" && \
   grep -q "draftOrder" "$HTML_FILE"; then
    test_result 0 "Draft functions exist in HTML"
else
    test_result 1 "Draft functions missing in HTML"
fi

# Test 2: Check iCloud drafts folder
echo ""
echo "Test 2: Checking iCloud drafts folder..."
if [ -d "$ICLOUD_DRAFTS" ]; then
    test_result 0 "iCloud drafts folder exists"
else
    mkdir -p "$ICLOUD_DRAFTS" 2>/dev/null || true
    if [ -d "$ICLOUD_DRAFTS" ]; then
        test_result 0 "iCloud drafts folder created"
    else
        test_result 1 "Cannot create iCloud drafts folder"
    fi
fi

# Test 3: Test draft save with headless Chrome
echo ""
echo "Test 3: Testing draft save (headless Chrome)..."

# Create test HTML that saves draft
TEST_SAVE_SCRIPT="$TEMP_DIR/test_save.js"
cat > "$TEST_SAVE_SCRIPT" <<'EOFJS'
// Test: Save draft to localStorage
const testDraft = {
    itemName: 'Test Automation',
    totalParts: 3,
    alvinFree: true,
    people: [
        {name: 'AutoTest1', qty: 1, paid: false},
        {name: 'AutoTest2', qty: 2, paid: false}
    ],
    lastModified: Date.now(),
    hasChanges: true
};

localStorage.setItem('draftOrder', JSON.stringify(testDraft));

// Verify save
const saved = localStorage.getItem('draftOrder');
if (saved) {
    const data = JSON.parse(saved);
    console.log('DRAFT_SAVED:' + data.people.length);
} else {
    console.log('DRAFT_FAILED');
}
EOFJS

# Run Chrome headless
CHROME_OUTPUT=$("$CHROME" \
    --headless \
    --disable-gpu \
    --user-data-dir="$TEMP_DIR/chrome_profile" \
    --disable-extensions \
    --no-sandbox \
    "file://$HTML_FILE" \
    --virtual-time-budget=5000 \
    --dump-dom 2>&1 | grep -o 'DRAFT_[A-Z_:0-9]*' | head -1)

if [[ "$CHROME_OUTPUT" == DRAFT_SAVED:* ]]; then
    test_result 0 "Draft saved to localStorage"
else
    test_result 1 "Draft save failed"
fi

# Test 4: Test localStorage persistence
echo ""
echo "Test 4: Testing localStorage persistence..."

TEST_RESTORE_SCRIPT="$TEMP_DIR/test_restore.js"
cat > "$TEST_RESTORE_SCRIPT" <<'EOFJS'
// Test: Restore draft from localStorage
setTimeout(() => {
    const draft = localStorage.getItem('draftOrder');
    if (draft) {
        const data = JSON.parse(draft);
        if (data.people && data.people.length > 0) {
            console.log('DRAFT_RESTORED:' + data.people.length);
        } else {
            console.log('DRAFT_EMPTY');
        }
    } else {
        console.log('DRAFT_MISSING');
    }
}, 2000);
EOFJS

RESTORE_OUTPUT=$("$CHROME" \
    --headless \
    --disable-gpu \
    --user-data-dir="$TEMP_DIR/chrome_profile" \
    --disable-extensions \
    --no-sandbox \
    "file://$HTML_FILE" \
    --virtual-time-budget=5000 \
    --dump-dom 2>&1 | grep -o 'DRAFT_[A-Z_:0-9]*' | head -1)

if [[ "$RESTORE_OUTPUT" == DRAFT_RESTORED:* ]]; then
    test_result 0 "Draft persisted and restored"
else
    test_result 1 "Draft not restored: $RESTORE_OUTPUT"
fi

# Test 5: Check iCloud draft files
echo ""
echo "Test 5: Checking iCloud draft files..."

DRAFT_COUNT=$(ls -1 "$ICLOUD_DRAFTS"/draft_order_*.json 2>/dev/null | wc -l | tr -d ' ')

if [ "$DRAFT_COUNT" -gt 0 ]; then
    test_result 0 "Found $DRAFT_COUNT draft file(s) in iCloud"
    echo "Latest draft:"
    ls -lt "$ICLOUD_DRAFTS"/draft_order_*.json 2>/dev/null | head -1
else
    echo -e "${YELLOW}⚠️  WARN${NC}: No iCloud draft files yet (may need 30min or manual save)"
    log "WARN: No iCloud draft files found"
fi

# Test 6: Check UI elements using DOM
echo ""
echo "Test 6: Checking UI elements..."

UI_CHECK=$("$CHROME" \
    --headless \
    --disable-gpu \
    --user-data-dir="$TEMP_DIR/chrome_profile" \
    --no-sandbox \
    "file://$HTML_FILE" \
    --dump-dom 2>/dev/null | grep -c "Lưu nháp" || echo "0")

if [ "$UI_CHECK" -ge 1 ]; then
    test_result 0 "Draft UI buttons found"
else
    test_result 1 "Draft UI buttons missing"
fi

# Test 7: Function existence check
echo ""
echo "Test 7: Checking JavaScript functions..."

FUNC_TEST=$(cat <<'EOFTEST'
<!DOCTYPE html>
<html>
<body>
<script>
// Load the main HTML
fetch('file:///Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html')
.then(r => r.text())
.then(html => {
    const hasSave = html.includes('function saveDraftToLocalStorage');
    const hasRestore = html.includes('function restoreDraftToUI');
    const hasTimer = html.includes('setInterval') && html.includes('1800000');
    
    if (hasSave && hasRestore && hasTimer) {
        console.log('FUNCTIONS_OK');
    } else {
        console.log('FUNCTIONS_MISSING');
    }
});
</script>
</body>
</html>
EOFTEST
)

echo "$FUNC_TEST" > "$TEMP_DIR/func_test.html"

FUNC_RESULT=$("$CHROME" \
    --headless \
    --disable-gpu \
    --user-data-dir="$TEMP_DIR/chrome_profile" \
    --no-sandbox \
    "file://$TEMP_DIR/func_test.html" \
    --virtual-time-budget=3000 \
    --dump-dom 2>&1 | grep -o 'FUNCTIONS_[A-Z_]*' | head -1)

if [ "$FUNC_RESULT" = "FUNCTIONS_OK" ]; then
    test_result 0 "All draft functions present"
else
    test_result 1 "Some draft functions missing"
fi

# Summary
echo ""
echo "========================================"
echo "           TEST SUMMARY"
echo "========================================"

PASS_COUNT=$(grep -c "PASS:" "$LOG_FILE" || echo "0")
FAIL_COUNT=$(grep -c "FAIL:" "$LOG_FILE" || echo "0")
TOTAL=$((PASS_COUNT + FAIL_COUNT))

echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"

echo ""
echo "Log file: $LOG_FILE"

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open HTML and manually test: add people → see 🟠 → wait → see 🟢"
    echo "2. Click '💾 Lưu nháp' to manually save to iCloud"
    echo "3. Wait 30 min and check: $ICLOUD_DRAFTS"
    exit 0
else
    echo ""
    echo -e "${RED}❌ $FAIL_COUNT TEST(S) FAILED${NC}"
    exit 1
fi
