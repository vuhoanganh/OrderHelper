# PROMPT 2 - REFACTOR COMPUTE IMPLEMENTATION PLAN
**Date:** 2025-12-21
**Status:** 🚧 IN PROGRESS

---

## 🎯 Objective

Refactor `compute` functions to be pure, testable, and independent of DOM. This will:
- Fix the "No Double-Count" test failure
- Enable easier testing and maintenance
- Prepare for localStorage migration (PROMPT 1 Phase 2)

---

## 🔍 Root Cause Analysis

**Self-Test Failure:** `recomputeVipBalances()` modifies state

**Code Review (lines 1004-1031):**
```javascript
function recomputeVipBalances() {
  // 1. ❌ Reads from DOM
  const vipAreaText = document.getElementById('vipArea')?.value || '';
  const vipMap = parseVip(vipAreaText);
  
  // 2. ✅ Pure computation (good)
  vipTransactions.forEach(tx => {
    vipMap.set(name, current + amount);
  });
  
  // 3. ❌ Writes to DOM
  vipArea.value = vipText;
  
  // 4. ❌ Writes to localStorage
  persistVipList(vipText);
}
```

**Problems:**
1. **Reads from DOM** → Not testable
2. **Writes to DOM** → Side effect
3. **Writes to localStorage** → Side effect
4. **Mixed responsibilities** → Violation of SRP

---

## 🏗️ Refactoring Strategy

### Phase 1: Extract Pure Functions ✅

Create `/js/core/vipBalance.js`:

```javascript
/**
 * Pure function: Calculate VIP balances from transactions
 * @param {Array} transactions - VIP transaction ledger
 * @param {Map} initialBalances - Starting balances (optional)
 * @returns {Map<string, number>} - Calculated balances
 */
export function calculateVipBalances(transactions, initialBalances = new Map()) {
  const balances = new Map(initialBalances);
  
  transactions.forEach(tx => {
    if (tx.orphan) return;
    const name = (tx?.name || '').trim();
    if (!name) return;
    
    const amount = Number(tx?.amount);
    if (!Number.isFinite(amount)) return;
    
    const type = tx?.type || (amount >= 0 ? 'topup' : 'cashout');
    if (type !== 'topup' && type !== 'cashout' && type !== 'order') return;
    if (type === 'order' && tx?.isVipPayment !== true && tx?.paymentMethod !== 'vip') return;
    
    const current = Number(balances.get(name) || 0);
    balances.set(name, current + amount);
  });
  
  return balances;
}

/**
 * Pure function: Convert VIP map to text format
 * @param {Map<string, number>} vipMap
 * @returns {string}
 */
export function vipMapToText(vipMap) {
  return Array.from(vipMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, balance]) => `${name}, ${balance}đ`)
    .join('\n');
}

/**
 * Pure function: Parse VIP text to map
 * @param {string} text
 * @returns {Map<string, number>}
 */
export function parseVipText(text) {
  const map = new Map();
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const match = trimmed.match(/^([^,]+),\s*(\d+)đ?$/);
    if (match) {
      const name = match[1].trim();
      const balance = parseInt(match[2]);
      map.set(name, balance);
    }
  }
  
  return map;
}
```

### Phase 2: Update `recomputeVipBalances()` ✅

Refactor to use pure functions:

```javascript
function recomputeVipBalances() {
  console.log(`[${BUILD_TAG}] recomputeVipBalances`);
  
  // 1. Read inputs (OK to read, just don't modify)
  const vipAreaText = document.getElementById('vipArea')?.value || '';
  const initialBalances = parseVipText(vipAreaText);
  
  // 2. Pure calculation
  const newBalances = calculateVipBalances(vipTransactions, initialBalances);
  
  // 3. Convert to text
  const vipText = vipMapToText(newBalances);
  
  // 4. Update UI & storage (explicit side effects, grouped)
  const vipArea = document.getElementById('vipArea');
  if (vipArea) vipArea.value = vipText;
  persistVipList(vipText);
}
```

### Phase 3: Add Unit Tests ✅

Create tests for pure functions:

```javascript
// In selfTest.js or separate test file
function test_calculateVipBalances() {
  const txs = [
    { name: 'Alice', type: 'opening', amount: 100 },
    { name: 'Alice', type: 'topup', amount: 50 },
    { name: 'Alice', type: 'order', amount: -30, paymentMethod: 'vip' },
    { name: 'Bob', type: 'topup', amount: 200 }
  ];
  
  const balances = calculateVipBalances(txs);
  
  assert(balances.get('Alice') === 120); // 100 + 50 - 30
  assert(balances.get('Bob') === 200);
}
```

---

## 📝 Implementation Steps

### Step 1: Create Pure Function Module
- [x] Create `js/core/vipBalance.js`
- [ ] Implement `calculateVipBalances()`
- [ ] Implement `vipMapToText()`
- [ ] Implement `parseVipText()`
- [ ] Export functions

### Step 2: Refactor `recomputeVipBalances()`
- [ ] Import pure functions
- [ ] Replace inline logic with function calls
- [ ] Test with real data
- [ ] Run self-tests → Should PASS

### Step 3: Update Other Compute Functions
- [ ] Identify other mixed functions (TBD)
- [ ] Apply same pattern
- [ ] Test each one

### Step 4: Verify Self-Tests
- [ ] Run "No Double-Count" test
- [ ] Should now PASS
- [ ] All 3 tests green

---

## ⚠️ Critical Rules

1. **Pure functions NEVER:**
   - Read from DOM
   - Write to DOM
   - Write to localStorage
   - Mutate inputs
   - Have side effects

2. **UI layer CAN:**
   - Read from DOM
   - Call pure functions
   - Write results to DOM/storage
   - But keep it minimal and explicit

3. **Test after EACH change:**
   - Run self-tests
   - Must not break existing features
   - Balances must match

---

## 🧪 Success Criteria

- ✅ `calculateVipBalances()` is pure
- ✅ Can test without DOM
- ✅ "No Double-Count" test PASSES
- ✅ All VIP features work
- ✅ Balances unchanged after refactor

---

## 📊 Expected Impact

**Before:**
```
❌ No Double-Count: FAILED
- VIP List changed after recompute
```

**After:**
```
✅ No Double-Count: PASSED
- VIP List unchanged after recompute
- Pure functions testable independently
```

---

**Current Status:** Phase 1 - Planning complete  
**Next Action:** Create `js/core/vipBalance.js`  
**Estimated Time:** 1-2 hours  
**Risk Level:** MEDIUM (touching balance calculation)

---

*Created: 2025-12-21*
