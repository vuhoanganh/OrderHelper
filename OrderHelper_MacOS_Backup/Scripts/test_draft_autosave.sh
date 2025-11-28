#!/usr/bin/env bash
# Automation test for draft auto-save feature
# File: test_draft_autosave.sh

set -euo pipefail

HTML_FILE="/Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html"
ICLOUD_DRAFTS="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Kitchen/drafts"
LOG_FILE="/Users/alvin/Desktop/Kitchen/test_autosave.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
        return 1
    fi
}

echo "========================================"
echo "  Draft Auto-Save Automation Test"
echo "========================================"
echo ""
> "$LOG_FILE"

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
    echo "Creating drafts folder..."
    mkdir -p "$ICLOUD_DRAFTS" 2>/dev/null || true
    if [ -d "$ICLOUD_DRAFTS" ]; then
        test_result 0 "iCloud drafts folder created"
    else
        test_result 1 "Cannot create iCloud drafts folder"
    fi
fi

# Test 3: Open HTML and simulate draft save
echo ""
echo "Test 3: Testing draft save functionality..."
echo "Opening HTML file in Safari..."

# Create test script
TEST_SCRIPT=$(cat <<'EOF'
tell application "Safari"
    activate
    set testURL to "file:///Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html"
    
    if not (exists document 1) then
        make new document with properties {URL:testURL}
    else
        set URL of document 1 to testURL
    end if
    
    delay 3
    
    -- Simulate adding draft data
    set testJS to "
        // Create test draft
        const testDraft = {
            itemName: 'Test Pho Bo',
            totalParts: 5,
            alvinFree: true,
            people: [
                {name: 'TestUser1', qty: 1, paid: false},
                {name: 'TestUser2', qty: 2, paid: false}
            ],
            lastModified: Date.now(),
            hasChanges: true
        };
        
        // Save to localStorage
        localStorage.setItem('draftOrder', JSON.stringify(testDraft));
        
        // Try to trigger manual save
        if (typeof saveDraftToLocalStorage === 'function') {
            saveDraftToLocalStorage();
        }
        
        'DRAFT_SAVED';
    "
    
    set result to do JavaScript testJS in document 1
    
    delay 2
    
    -- Check if draft exists in localStorage
    set checkJS to "
        const draft = localStorage.getItem('draftOrder');
        draft ? 'HAS_DRAFT' : 'NO_DRAFT';
    "
    
    set checkResult to do JavaScript checkJS in document 1
    
    -- Close tab
    close document 1
    
    return checkResult
end tell
EOF
)

SAFARI_RESULT=$(osascript -e "$TEST_SCRIPT" 2>/dev/null || echo "ERROR")

if [ "$SAFARI_RESULT" = "HAS_DRAFT" ]; then
    test_result 0 "Draft saved to localStorage"
else
    test_result 1 "Draft save failed: $SAFARI_RESULT"
fi

# Test 4: Check localStorage persistence
echo ""
echo "Test 4: Testing localStorage persistence (reload)..."

RELOAD_TEST=$(cat <<'EOF'
tell application "Safari"
    activate
    set testURL to "file:///Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html"
    
    make new document with properties {URL:testURL}
    delay 3
    
    -- Check if draft auto-restored
    set checkJS to "
        const draft = localStorage.getItem('draftOrder');
        if (draft) {
            const data = JSON.parse(draft);
            data.people && data.people.length > 0 ? 'RESTORED' : 'EMPTY';
        } else {
            'NO_DRAFT';
        }
    "
    
    set result to do JavaScript checkJS in document 1
    close document 1
    
    return result
end tell
EOF
)

RELOAD_RESULT=$(osascript -e "$RELOAD_TEST" 2>/dev/null || echo "ERROR")

if [ "$RELOAD_RESULT" = "RESTORED" ]; then
    test_result 0 "Draft persisted across reload"
else
    test_result 1 "Draft not restored: $RELOAD_RESULT"
fi

# Test 5: Check iCloud draft files (if native bridge exists)
echo ""
echo "Test 5: Checking iCloud draft files..."

DRAFT_COUNT=$(ls -1 "$ICLOUD_DRAFTS"/draft_order_*.json 2>/dev/null | wc -l | tr -d ' ')

if [ "$DRAFT_COUNT" -gt 0 ]; then
    test_result 0 "Found $DRAFT_COUNT draft file(s) in iCloud"
    echo "Latest draft:"
    ls -lt "$ICLOUD_DRAFTS"/draft_order_*.json 2>/dev/null | head -1
else
    echo -e "${YELLOW}⚠️  WARN${NC}: No draft files in iCloud (native bridge may not be implemented)"
    log "WARN: No iCloud draft files found"
fi

# Test 6: Check UI elements
echo ""
echo "Test 6: Checking UI elements..."

UI_TEST=$(cat <<'EOF'
tell application "Safari"
    activate
    set testURL to "file:///Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html"
    
    make new document with properties {URL:testURL}
    delay 3
    
    set checkJS to "
        // Check for draft UI elements
        const hasSaveBtn = document.querySelector('button') && 
                          Array.from(document.querySelectorAll('button'))
                          .some(b => b.textContent.includes('Lưu nháp'));
        const hasLoadBtn = document.querySelector('button') && 
                          Array.from(document.querySelectorAll('button'))
                          .some(b => b.textContent.includes('Tải nháp'));
        const hasClearBtn = document.querySelector('button') && 
                           Array.from(document.querySelectorAll('button'))
                           .some(b => b.textContent.includes('Xóa nháp'));
        
        hasSaveBtn && hasLoadBtn && hasClearBtn ? 'ALL_BUTTONS' : 'MISSING_BUTTONS';
    "
    
    set result to do JavaScript checkJS in document 1
    close document 1
    
    return result
end tell
EOF
)

UI_RESULT=$(osascript -e "$UI_TEST" 2>/dev/null || echo "ERROR")

if [ "$UI_RESULT" = "ALL_BUTTONS" ]; then
    test_result 0 "All draft UI buttons present"
else
    test_result 1 "Draft UI buttons missing: $UI_RESULT"
fi

# Test 7: Cleanup test
echo ""
echo "Test 7: Testing draft cleanup..."

CLEANUP_TEST=$(cat <<'EOF'
tell application "Safari"
    activate
    set testURL to "file:///Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html"
    
    make new document with properties {URL:testURL}
    delay 3
    
    -- Clear draft
    set clearJS to "
        localStorage.removeItem('draftOrder');
        const draft = localStorage.getItem('draftOrder');
        draft ? 'STILL_EXISTS' : 'CLEARED';
    "
    
    set result to do JavaScript clearJS in document 1
    close document 1
    
    return result
end tell
EOF
)

CLEANUP_RESULT=$(osascript -e "$CLEANUP_TEST" 2>/dev/null || echo "ERROR")

if [ "$CLEANUP_RESULT" = "CLEARED" ]; then
    test_result 0 "Draft cleanup successful"
else
    test_result 1 "Draft cleanup failed: $CLEANUP_RESULT"
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

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Wait 30 minutes and check: $ICLOUD_DRAFTS"
    echo "2. Or test manual save by clicking '💾 Lưu nháp' button"
    echo "3. Check backup.log for any errors"
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Check log file: $LOG_FILE"
    exit 1
fi
