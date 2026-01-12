# PROMPT 4 - SELF-TEST IMPLEMENTATION PLAN
**Date:** 2025-12-21
**Status:** 🚧 IN PROGRESS

---

## 🎯 Objective

Create automated self-tests to lock in 3 critical invariants:
1. **VIP Balance Formula Correctness**
2. **No Double-Count in Recompute**
3. **Backup/Restore Roundtrip Integrity**

---

## 📋 Test Suite Structure

### Test 1: VIP Balance Formula ⚠️ HIGH PRIORITY
```javascript
function selfTest_vipBalanceFormula() {
  // For EACH VIP member:
  // 1. Get all transactions from vipTransactions ledger
  // 2. Calculate: opening + topup - cashout - orders
  // 3. Compare with displayed balance
  // 4. Report mismatches
  
  // PASS criteria:
  // - Calculated balance === Displayed balance for ALL members
  // - No exceptions thrown
}
```

### Test 2: No Double-Count ⚠️ CRITICAL
```javascript
function selfTest_noDoubleCount() {
  // 1. Snapshot current balances
  // 2. Call recomputeVipBalances()
  // 3. Get new balances
  // 4. Compare: should be IDENTICAL
  
  // PASS criteria:
  // - All balances unchanged after recompute
  // - No new transactions created
  // - vipTransactions length unchanged
}
```

### Test 3: Backup/Restore Roundtrip ⚠️ DATA INTEGRITY
```javascript
function selfTest_backupRestoreRoundtrip() {
  // 1. Create backup (JSON)
  // 2. Get snapshot of current state
  // 3. Simulate restore from backup
  // 4. Compare restored state with snapshot
  
  // PASS criteria:
  // - orderHistory identical
  // - vipTransactions identical
  // - vipList identical
  // - All balances match
}
```

---

## 🔧 Implementation Steps

### Step 1: Create selfTest.js utility module ✅
```javascript
// /js/utils/selfTest.js
export const SelfTest = {
  run: async function() { /* ... */ },
  vipBalanceFormula: function() { /* ... */ },
  noDoubleCount: function() { /* ... */ },
  backupRestoreRoundtrip: function() { /* ... */ }
};
```

### Step 2: Add test UI in Backup tab
- Button "🧪 Run Self-Test"
- Results display area
- PASS/FAIL indicators
- Detailed error messages

### Step 3: Integrate with app.js
- Import selfTest module
- Add to window object for manual trigger
- Optional: Run on startup (dev mode)

---

## 📊 Test Execution Flow

```
User clicks "🧪 Run Self-Test"
  ↓
Run Test 1: VIP Balance Formula
  ↓ PASS
Run Test 2: No Double-Count
  ↓ PASS
Run Test 3: Backup/Restore
  ↓ PASS
Display: ✅ ALL TESTS PASSED
```

---

## ⚠️ Failure Handling

If ANY test fails:
- ❌ Display detailed error
- 🛑 STOP further changes
- 📊 Show comparison data
- 💡 Suggest fix

---

## 🧪 Test Data Requirements

**Minimum test data:**
- At least 2 VIP members with balances
- At least 5 transactions (mix of topup/cashout/orders)
- At least 2 orders in history

**Edge cases to cover:**
- VIP with 0 balance
- VIP with negative balance (should not exist)
- Empty transactions
- Large transaction counts

---

## 📝 Success Metrics

- ✅ All 3 tests can run without errors
- ✅ Tests accurately detect formula errors
- ✅ Tests detect double-count issues
- ✅ Tests verify backup integrity
- ✅ Clear PASS/FAIL reporting
- ✅ Tests run in < 1 second

---

## 🚀 Next Actions

1. [ ] Create `/js/utils/selfTest.js`
2. [ ] Implement Test 1: VIP Balance Formula
3. [ ] Implement Test 2: No Double-Count
4. [ ] Implement Test 3: Backup/Restore
5. [ ] Add UI button and results display
6. [ ] Test with real data
7. [ ] Git commit

---

**Status:** Ready to implement  
**Estimated Time:** 1-2 hours  
**Risk Level:** LOW (read-only tests, no data modification)

---

*Created: 2025-12-21*
