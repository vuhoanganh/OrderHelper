# PROMPT 1 - PHASE 2: localStorage Migration Plan
**Date:** 2025-12-21
**Status:** 🚧 PLANNING

---

## 📊 Migration Statistics

**Total localStorage calls found:** 86+ occurrences

**Breakdown by category:**
1. **VIP Data** (~15 calls) - HIGHEST PRIORITY ⚠️
   - vipList
   - vipUpdatedAt
   - vipTransactions (VIP_TX_KEY)
   - vipInitialBalance_*

2. **Order History** (~10 calls) - HIGH PRIORITY
   - orderHistory
   
3. **GitHub Settings** (~30 calls) - MEDIUM PRIORITY
   - GITHUB_TOKEN_KEY
   - GITHUB_REPO_KEY
   - GITHUB_BRANCH_KEY
   - GITHUB_AUTO_BACKUP_ENABLED_KEY
   - GITHUB_BACKUP_INTERVAL_KEY
   - GITHUB_LAST_BACKUP_KEY
   - GITHUB_LAST_COMMIT_SHA_KEY

4. **Draft System** (~10 calls) - MEDIUM PRIORITY
   - draftOrder
   - draftBackupMeta

5. **Other** (~20 calls) - LOW PRIORITY

---

## 🎯 Migration Strategy

### Phase 2A: Setup & Infrastructure (CURRENT)
- [x] Import storage service in HTML
- [ ] Import STORAGE_KEYS config
- [ ] Add migration helper function
- [ ] Test infrastructure

### Phase 2B: VIP Data Migration (NEXT)
**Why first:** Most critical, highest risk of bugs
- [ ] vipList (getText/setText)
- [ ] vipUpdatedAt (getNumber/setNumber)
- [ ] vipTransactions (getJSON/setJSON)
- [ ] vipInitialBalance_* (dynamic keys)
- [ ] Test VIP features thoroughly

### Phase 2C: Order History Migration
- [ ] orderHistory (getJSON/setJSON)
- [ ] Test order creation/viewing

### Phase 2D: GitHub Settings Migration
- [ ] All GITHUB_* keys
- [ ] Test backup/restore

### Phase 2E: Draft & Others
- [ ] draftOrder
- [ ] draftBackupMeta
- [ ] Any remaining keys

---

## ⚠️ CRITICAL RULES

1. **ONE SECTION AT A TIME**
   - Complete one category before moving to next
   - Test thoroughly after each category

2. **NEVER CHANGE BUSINESS LOGIC**
   - Only replace localStorage.* calls
   - Keep exact same behavior

3. **VERIFY INVARIANTS**
   - VIP balance = opening + topup - cashout - orders
   - No double-count
   - All existing features work

4. **TEST CHECKLIST (After each migration)**
   - [ ] Page loads without errors
   - [ ] Can create new order
   - [ ] VIP top-up works
   - [ ] VIP report shows correct
   - [ ] Backup/restore works
   - [ ] All numbers match

5. **ROLLBACK READY**
   - Git commit after each success
   - Can revert if anything breaks

---

## 🔧 Implementation Approach

### Step 1: Add module import to HTML
```html
<script type="module">
  import storage from './js/utils/storage.js';
  import { STORAGE_KEYS } from './js/config.js';
  
  // Make available globally for now (gradual migration)
  window.storageService = storage;
  window.STORAGE_KEYS = STORAGE_KEYS;
</script>
```

### Step 2: Migration pattern
```javascript
// BEFORE
const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');

// AFTER
const orderHistory = window.storageService.getJSON(window.STORAGE_KEYS.ORDER_HISTORY, []);
```

### Step 3: Test each migration
- Run page
- Test affected features
- Check console for errors
- Verify data integrity

---

## 📝 Progress Tracker

### Phase 2A: Infrastructure ✅
- [x] Created this plan
- [ ] Add storage import to HTML
- [ ] Test imports work
- [ ] Verify storage service accessible

### Phase 2B: VIP Data 🔄
- [ ] vipList migrations (2 getItem, 3 setItem)
- [ ] vipUpdatedAt migrations (1 getItem, 1 setItem)
- [ ] vipTransactions migrations (2 getItem, 5 setItem)
- [ ] vipInitialBalance_* migrations (dynamic keys)
- [ ] Test all VIP features
- [ ] Git commit

### Phase 2C: Order History ⏳
- [ ] orderHistory migrations (~10 calls)
- [ ] Test order features
- [ ] Git commit

### Phase 2D: GitHub Settings ⏳
- [ ] All GITHUB_* key migrations (~30 calls)
- [ ] Test backup/restore
- [ ] Git commit

### Phase 2E: Cleanup ⏳
- [ ] Remaining migrations
- [ ] Remove window.storageService (if possible)
- [ ] Final testing
- [ ] Git commit

---

## 🧪 Testing Matrix

| Feature | Before Migration | After Migration | Status |
|---------|-----------------|-----------------|--------|
| Create Order | ✅ | ⏳ | |
| VIP Top-up | ✅ | ⏳ | |
| VIP Cashout | ✅ | ⏳ | |
| VIP Report | ✅ | ⏳ | |
| Order History | ✅ | ⏳ | |
| Backup Download | ✅ | ⏳ | |
| Backup Restore | ✅ | ⏳ | |
| GitHub Backup | ✅ | ⏳ | |
| Stats | ✅ | ⏳ | |

---

## 🚨 Risk Assessment

**High Risk Areas:**
1. VIP transaction handling - Can cause balance errors
2. Order history - Can lose data if wrong
3. Backup/restore - Must not corrupt data

**Mitigation:**
- Test extensively before each commit
- Keep browser localStorage inspector open
- Compare before/after values
- Have backup JSON ready

---

## 📈 Success Metrics

- ✅ All localStorage calls migrated to storage service
- ✅ 0 direct localStorage.* in code (except storage.js)
- ✅ All features work identical to before
- ✅ VIP balances match
- ✅ Can export/import backup successfully
- ✅ DEBUG_STORAGE shows all operations

---

**Current Status:** Phase 2A - Setting up infrastructure  
**Next Action:** Import storage service to HTML  
**Estimated Time:** 2-3 hours for full migration  
**Risk Level:** HIGH (touching critical data paths)

---

*Created: 2025-12-21*  
*Last Updated: 2025-12-21*
