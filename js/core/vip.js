/**
 * VIP Management Module
 * Handles VIP member management, transactions, and balance tracking
 */

import { BUILD_TAG, STORAGE_KEYS, CONFIRMED_DELETE_TXN_IDS, VIP_CONFIG } from '../config.js';
import { formatMoney } from '../utils/formatters.js';

/**
 * Parse VIP text to Map
 * Requires SmartNameMatcher from inline script (dependency)
 * @param {string} text - VIP text (name=balance format)
 * @param {Function} SmartNameMatcher - Matcher class
 * @returns {Map} VIP map with _matcher attached
 */
export function parseVip(text, SmartNameMatcher) {
  const matcher = new SmartNameMatcher();

  text.split(/\n+/).forEach(line => {
    line = line.trim();
    if (!line) return;

    const [name, bal] = line.split('=');
    if (!name) return;

    const v = parseFloat((bal || '0').replace(/[^0-9.\-]/g, ''));
    const balance = isNaN(v) ? 0 : v;

    matcher.add(name, balance);
  });

  // Convert to Map
  const map = new Map();
  matcher.getAllEntries().forEach(entry => {
    map.set(entry.name, entry.data);
  });

  // Attach matcher for later use
  map._matcher = matcher;

  return map;
}

/**
 * Convert VIP map to text
 * @param {Map} map - VIP map
 * @returns {string} Formatted VIP text
 */
export function vipToText(map) {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${formatMoney(v)}`)
    .join('\n');
}

/**
 * Persist VIP list to localStorage
 * @param {string} text - VIP text
 * @param {number} timestamp - Update timestamp
 */
export function persistVipList(text, timestamp = Date.now()) {
  localStorage.setItem(STORAGE_KEYS.VIP_LIST, text);
  localStorage.setItem(STORAGE_KEYS.VIP_UPDATED_AT, String(timestamp));
}

/**
 * Record VIP transaction
 * @param {Object} params - Transaction parameters
 * @returns {Object|null} Created transaction or null
 */
export function recordVipTransaction({
  name,
  amount,
  type,
  itemName,
  orderId,
  detailIndex,
  isVipPayment,
  paymentMethod,
  ts,
  qty,
  unitPrice
}) {
  console.log(`[${BUILD_TAG}] recordVipTransaction`);
  if (!name || !Number.isFinite(amount)) return null;

  const txType = type || (amount >= 0 ? 'topup' : 'cashout');
  const entry = {
    id: crypto.randomUUID(),
    ts: (typeof ts === 'string' && ts) ? ts : new Date().toISOString(),
    name: name.trim(),
    amount,
    type: txType
  };

  if (txType === 'order') {
    if (orderId === undefined || orderId === null) return null;
    entry.orderId = orderId;
    entry.isVipPayment = isVipPayment !== undefined ? isVipPayment : true;
    entry.paymentMethod = paymentMethod || 'vip';
    entry.paid = true;

    if (itemName !== undefined) entry.itemName = itemName;
    if (detailIndex !== undefined && detailIndex !== null) entry.detailIndex = detailIndex;
    if (qty !== undefined) entry.qty = qty;
    if (unitPrice !== undefined) entry.unitPrice = unitPrice;
  }

  // Load existing transactions
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIP_TRANSACTIONS) || '[]');
  existing.push(entry);

  // Save
  localStorage.setItem(STORAGE_KEYS.VIP_TRANSACTIONS, JSON.stringify(existing));

  console.log(`[${BUILD_TAG}] Recorded VIP transaction:`, entry);
  return entry;
}

/**
 * Get VIP order transactions for a specific member
 * @param {string} vipName - VIP member name
 * @returns {Array} Array of order transactions
 */
export function getVipOrderTransactions(vipName) {
  const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIP_TRANSACTIONS) || '[]');
  return transactions.filter(tx =>
    tx.name === vipName &&
    tx.type === 'order' &&
    !CONFIRMED_DELETE_TXN_IDS.includes(tx.id)
  );
}

/**
 * Get initial balance for VIP member
 * @param {string} name - VIP member name
 * @param {Object} options - Options
 * @returns {number} Initial balance
 */
export function getInitialBalanceForVip(name, options = {}) {
  const stored = localStorage.getItem(`vipInitialBalance_${name}`);
  if (stored) {
    const val = Number(stored);
    return isFinite(val) ? val : 0;
  }

  const def = VIP_CONFIG.DEFAULT_INITIAL_BALANCE[name];
  if (options.persistDefault && def !== undefined) {
    localStorage.setItem(`vipInitialBalance_${name}`, def);
  }
  return def || 0;
}

/**
 * Update VIP display
 * @param {string} vipText - VIP text to display
 */
export function updateVipDisplay(vipText) {
  const vipArea = document.getElementById('vipArea');
  if (vipArea) {
    vipArea.value = vipText;
  }
}

/**
 * Go to VIP member (switch to VIP tab and select member)
 * @param {string} vipName - VIP member name
 */
export function goToVip(vipName) {
  // Switch to VIP tab
  if (window.switchTab) {
    window.switchTab('vip');
  }

  // Select member in dropdown
  setTimeout(() => {
    const select = document.getElementById('vipMemberSelect');
    if (select) {
      select.value = vipName;

      // Trigger change event
      const event = new Event('change');
      select.dispatchEvent(event);

      // Show member history
      if (window.showVipMemberHistory) {
        window.showVipMemberHistory();
      }
    }
  }, 300);
}

/**
 * Populate VIP member select dropdown
 * @param {Array} vipNames - Array of VIP names
 */
export function populateVipMemberSelect(vipNames) {
  const select = document.getElementById('vipMemberSelect');
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = '<option value="">-- Chọn VIP --</option>';

  vipNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  // Restore selection if still exists
  if (currentValue && vipNames.includes(currentValue)) {
    select.value = currentValue;
  }
}

/**
 * Normalize VIP transactions
 * @param {Array} data - Raw transactions
 * @param {boolean} vipPatchEnabled - Whether VIP patch is enabled
 * @returns {Array} Normalized transactions
 */
export function normalizeVipTransactions(data = [], vipPatchEnabled = false) {
  console.log(`[${BUILD_TAG}] normalizeVipTransactions`);

  if (!vipPatchEnabled) {
    return Array.isArray(data) ? data : [];
  }

  if (!Array.isArray(data)) return [];

  const normalized = data.map((tx, idx) => {
    const amount = Number(tx?.amount);
    const idRaw = tx?.id;
    const idNum = typeof idRaw === 'number' ? idRaw : (typeof idRaw === 'string' && idRaw.trim() !== '' ? Number(idRaw) : NaN);
    const parsedIdDate = isFinite(idNum) ? new Date(idNum) : null;
    const hasValidIdDate = parsedIdDate && isFinite(parsedIdDate.getTime());
    const tsSource = tx?.ts || (hasValidIdDate ? parsedIdDate.toISOString() : null);
    const parsedTs = tsSource ? new Date(tsSource) : null;
    const hasValidTs = parsedTs && isFinite(parsedTs.getTime());
    const computedType = tx?.type || (amount >= 0 ? 'topup' : 'cashout');
    const hasDetailIndex = tx && Object.prototype.hasOwnProperty.call(tx, 'detailIndex');

    const out = {
      id: (tx?.id !== undefined && tx?.id !== null && String(tx.id).trim() !== '') ? String(tx.id) : crypto.randomUUID(),
      ts: hasValidTs ? parsedTs.toISOString() : (hasValidIdDate ? parsedIdDate.toISOString() : new Date().toISOString()),
      name: (tx?.name || '').trim(),
      amount: isFinite(amount) ? amount : 0,
      type: computedType,
      detailIndex: hasDetailIndex ? tx.detailIndex : null
    };

    if (tx && Object.prototype.hasOwnProperty.call(tx, 'orderId')) out.orderId = tx.orderId;
    if (tx && Object.prototype.hasOwnProperty.call(tx, 'itemName')) out.itemName = tx.itemName;
    if (tx && Object.prototype.hasOwnProperty.call(tx, 'paid')) out.paid = tx.paid;
    if (tx && Object.prototype.hasOwnProperty.call(tx, 'isVipPayment')) out.isVipPayment = tx.isVipPayment;
    if (tx && Object.prototype.hasOwnProperty.call(tx, 'paymentMethod')) out.paymentMethod = tx.paymentMethod;

    // Migration rules
    if (out.type === 'order') {
      if (out.isVipPayment == null) out.isVipPayment = true;
      if (out.paymentMethod == null) out.paymentMethod = 'vip';
      if (out.paid == null) out.paid = true;
    }

    return out;
  }).filter(tx => tx.name);

  localStorage.setItem(STORAGE_KEYS.VIP_TRANSACTIONS, JSON.stringify(normalized.slice(0, 200)));
  return normalized;
}

// Export all as default
export default {
  parseVip,
  vipToText,
  persistVipList,
  recordVipTransaction,
  getVipOrderTransactions,
  getInitialBalanceForVip,
  updateVipDisplay,
  goToVip,
  populateVipMemberSelect,
  normalizeVipTransactions,
};
