# PROMPT 1 - REFACTOR FOUNDATION
## Implementation Progress Tracker

**Status:** 🚧 IN PROGRESS
**Started:** 2025-12-21
**Approach:** Gradual migration (non-breaking)

---

## ✅ Phase 1: Foundation Setup (COMPLETED)

### Created Module Structure
- [x] `/js/config.js` - Constants & feature flags
- [x] `/js/utils/storage.js` - localStorage wrapper (SINGLE SOURCE OF TRUTH)
- [x] `/js/utils/formatters.js` - Centralized formatting
- [x] `/js/utils/dom.js` - DOM utilities
- [x] `/js/app.js` - Bootstrap entry point

### Key Achievements
- ✅ Storage service layer created with debug logging
- ✅ All localStorage keys centralized in config
- ✅ Formatting utilities consolidated
- ✅ DOM helpers with event delegation support

---

## 🔄 Phase 2: HTML Integration (NEXT)

### Tasks
- [ ] Add `<script type="module" src="js/app.js"></script>` to HTML
- [ ] Verify app still works with new module loaded
- [ ] Keep existing inline `<script>` for now (gradual migration)

### Testing Checklist
- [ ] Page loads without errors
- [ ] Console shows "[App] Application initialized"
- [ ] Storage service verification passes
- [ ] All existing features still work

---

## 🔄 Phase 3: Migrate localStorage Calls (PENDING)

### Strategy
Replace direct `localStorage` calls with `storage` service:

1. **Find & Replace Pattern:**
   ```javascript
   // OLD
   localStorage.getItem('orderHistory')
   JSON.parse(localStorage.getItem('orderHistory') || '[]')
   
   // NEW
   storage.getText(STORAGE_KEYS.ORDER_HISTORY)
   storage.getJSON(STORAGE_KEYS.ORDER_HISTORY, [])
   ```

2. **Priority Order:**
   - [ ] VIP-related storage (high risk area)
   - [ ] Order history storage
   - [ ] Backup/restore storage
   - [ ] GitHub settings storage
   - [ ] Draft storage

### Validation
- [ ] Enable `DEBUG_STORAGE` flag
- [ ] Test each migration area
- [ ] Verify no double-writes
- [ ] Check console for storage operations

---

## 🔄 Phase 4: Remove Inline Event Handlers (PENDING)

### Inline Handlers to Migrate
- [ ] `onclick="..."`on buttons
- [ ] `onchange="..."` on inputs/selects  
- [ ] `oninput="..."` on inputs
- [ ] `onblur="..."` on inputs

### Migration Pattern
```javascript
// OLD (inline)
<button onclick="exportVipReportCSV()">

// NEW (event delegation)
<button data-action="export-vip-report">

// In app.js
dom.on(document, 'click', '[data-action="export-vip-report"]', (e) => {
  exportVipReportCSV();
});
```

### Sections to Migrate
- [ ] Tab navigation
- [ ] VIP Report controls
- [ ] Order form buttons
- [ ] Backup/restore buttons
- [ ] History filters

---

## 🔄 Phase 5: Extract Feature Modules (PENDING)

### `/js/features/vip.js`
Move VIP-related functions:
- [ ] `renderVipReport()`
- [ ] `exportVipReportCSV()`
- [ ] `toggleReconcile()`
- [ ] `buildVipStatementFromDB()`
- [ ] VIP balance calculations

### `/js/features/orders.js`  
Move order-related functions:
- [ ] `compute()` orchestration (keep in HTML for now)
- [ ] `addRow()`, `delRow()`
- [ ] Order history render functions

### `/js/features/backup.js`
Move backup-related functions:
- [ ] `backupToGithub()`
- [ ] `restoreFromGithub()`
- [ ] `downloadBackup()`
- [ ] Export/import functions

---

## 📋 Invariants Checklist (MUST VERIFY AFTER EACH PHASE)

- [ ] **VIP Balance Formula:** opening + topup - cashout - vip_orders = ending
- [ ] **No Double-Count:** Transactions not duplicated in ledger
- [ ] **Report from Ledger:** Calculations use vipTransactions, not UI text
- [ ] **Data Structure:** localStorage keys unchanged
- [ ] **Backward Compat:** Can restore old backups
- [ ] **GitHub Pages:** App runs without build tools

---

## 🧪 Testing Strategy

### After Each Phase
1. **Manual Testing:**
   - Create new order
   - Top up VIP balance
   - View VIP report
   - Export/import backup
   - Verify all numbers match

2. **Console Checks:**
   - No JavaScript errors
   - Storage debug logs (if enabled)
   - Module loading confirms

3. **Data Integrity:**
   - Export backup before changes
   - Compare backup after changes
   - Verify JSON structure identical

---

## 🚨 Rollback Plan

If anything breaks:
1. Comment out `<script type="module" src="js/app.js">`
2. Restore inline `<script>` from backup
3. App returns to previous state
4. Debug issue in isolation

---

## 📝 Notes

- **Gradual Migration:** New modules coexist with old code
- **Non-Breaking:** Each phase keeps app functional  
- **Single Responsibility:** Each module has clear purpose
- **Debug Logging:** Can trace all storage operations
- **Event Delegation:** More performant than individual handlers

---

## Next Steps

1. ✅ **Integrate app.js into HTML**
2. 🔄 **Test that existing app still works**
3. 🔄 **Begin localStorage migration**
4. 🔄 **Migrate event handlers**
5. 🔄 **Extract feature modules**

---

**⚠️ CRITICAL RULES:**
- NEVER change business logic during refactoring
- ALWAYS test after each change
- KEEP backup before major changes
- VERIFY invariants after migration
