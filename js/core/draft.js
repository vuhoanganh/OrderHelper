/**
 * Draft Management Module
 * Handles order draft creation, persistence, and restoration
 */

import { STORAGE_KEYS, DRAFT_CONFIG } from '../config.js';
import { formatDraftTime } from '../utils/formatters.js';

/**
 * Get current draft payload from UI
 * @param {boolean} hasChanges - Whether draft has unsaved changes
 * @returns {Object} Draft payload
 */
export function getDraftPayload(hasChanges = false) {
  const people = Array.from(document.querySelectorAll('#orderTable tbody tr')).map(tr => {
    const nameInput = tr.children[0]?.querySelector('input');
    const qtyInput = tr.children[1]?.querySelector('input');
    const shipPartsInput = tr.children[2]?.querySelector('input');
    const paidCheck = tr.children[3]?.querySelector('input[type="checkbox"]');
    return {
      name: (nameInput?.value || '').trim(),
      qty: Number(qtyInput?.value || 0),
      shipParts: Number(shipPartsInput?.value || 0),
      paid: !!paidCheck?.checked
    };
  }).filter(p => p.name);

  return {
    draftOrder: {
      itemName: document.getElementById('itemName')?.value || '',
      totalParts: Number(document.getElementById('n')?.value || 0),
      alvinFree: !!document.getElementById('alvinFree')?.checked,
      desiredPrice: Number(document.getElementById('desiredPrice')?.value || 0),
      people,
      lastModified: Date.now(),
      hasChanges: hasChanges === true
    }
  };
}

/**
 * Apply people array to order table
 * @param {Array} people - Array of person objects
 * @param {Function} addRowFn - Function to add table row
 * @param {boolean} suppressChange - Suppress draft change detection
 */
export function applyPeopleToTable(people = [], addRowFn, suppressChange = false) {
  const tbody = document.querySelector('#orderTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!Array.isArray(people) || people.length === 0) {
    if (addRowFn) addRowFn();
    return;
  }

  people.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="name-input" value="${p.name || ''}" placeholder="Nhập tên..."></td>
      <td><input type="number" min="1" step="1" value="${p.qty || 1}"></td>
      <td><input type="number" min="0" step="1" value="${p.shipParts || 0}" class="ship-count-input" placeholder="0"></td>
      <td style="text-align: center;"><input type="checkbox" class="payment-check" ${p.paid === true ? 'checked' : ''}></td>
      <td style="text-align: center;"><button class="btn btn-danger" onclick="delRow(this)">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Update draft status UI
 * @param {Object} draftOrder - Draft order object
 * @param {boolean} isDirty - Whether draft is dirty
 */
export function updateDraftStatusUI(draftOrder = {}, isDirty = false) {
  const dot = document.getElementById('draftStatusDot');
  const statusText = document.getElementById('draftStatusText');
  const metaText = document.getElementById('draftMetaText');
  const hasChanges = draftOrder.hasChanges || isDirty;
  const lastModified = draftOrder.lastModified || draftOrder.draftModified || Date.now();

  if (dot) {
    dot.classList.toggle('saved', !hasChanges);
    dot.classList.toggle('unsaved', hasChanges);
  }
  if (statusText) {
    statusText.textContent = hasChanges ? 'Nháp có thay đổi (chưa backup iCloud)' : 'Nháp đã lưu';
  }
  if (metaText) {
    metaText.textContent = `Tự động lưu 30 phút/lần | Lưu cuối: ${formatDraftTime(lastModified)}`;
  }
}

/**
 * Set draft banner message
 * @param {string} message - Banner message
 */
export function setDraftBanner(message) {
  const banner = document.getElementById('draftBannerMessage');
  if (banner) banner.textContent = message || '';
}

/**
 * Save draft to localStorage
 * @param {boolean} isDirty - Whether to mark as dirty
 * @returns {Object} Saved draft
 */
export function saveDraftToLocalStorage(isDirty = true) {
  const draft = getDraftPayload(true);
  localStorage.setItem(STORAGE_KEYS.DRAFT_ORDER, JSON.stringify(draft));
  updateDraftStatusUI(draft.draftOrder, isDirty);
  return draft;
}

/**
 * Load draft from localStorage
 * @returns {Object|null} Draft object or null
 */
export function loadDraftFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFT_ORDER);
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

/**
 * Restore draft to UI
 * @param {Object} draftData - Draft data to restore
 * @param {Function} addRowFn - Function to add table row
 * @param {Function} clearPricingFn - Function to clear pricing fields
 * @param {Object} state - State object to update (selectedPrice, draftDirty)
 */
export function restoreDraftToUI(draftData, addRowFn, clearPricingFn, state = {}) {
  if (!draftData || !draftData.draftOrder) return;

  const data = draftData.draftOrder;
  document.getElementById('itemName').value = data.itemName || '';
  document.getElementById('n').value = data.totalParts || 0;
  document.getElementById('alvinFree').checked = !!data.alvinFree;
  const desiredPriceInput = document.getElementById('desiredPrice');
  if (desiredPriceInput) desiredPriceInput.value = data.desiredPrice || '';

  if (state.selectedPrice !== undefined) {
    state.selectedPrice = data.desiredPrice ? Number(data.desiredPrice) : null;
  }

  applyPeopleToTable(data.people || [], addRowFn);

  if (state.draftDirty !== undefined) {
    state.draftDirty = !!data.hasChanges;
  }

  updateDraftStatusUI(data, !!data.hasChanges);
  setDraftBanner('📋 Đã khôi phục đơn nháp');

  // Clear pricing fields when restoring draft
  if (clearPricingFn) {
    clearPricingFn();
  }
}

/**
 * Record draft metadata
 * @param {string} path - Draft file path
 * @param {number} savedAt - Timestamp when saved
 * @param {string} name - Draft name
 */
export function recordDraftMeta(path, savedAt, name = '') {
  const meta = {
    path,
    savedAt,
    name: name || `Draft ${new Date(savedAt).toLocaleString('vi-VN')}`
  };
  localStorage.setItem(STORAGE_KEYS.DRAFT_META, JSON.stringify(meta));
}

/**
 * Get draft filename from timestamp
 * @param {number} ts - Timestamp
 * @returns {string} Draft filename
 */
export function getDraftFilename(ts) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hhmm = String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
  return `draft_order_${yyyy}-${mm}-${dd}_${hhmm}.json`;
}

/**
 * Clear draft from localStorage
 */
export function clearDraft() {
  localStorage.removeItem(STORAGE_KEYS.DRAFT_ORDER);
  localStorage.removeItem(STORAGE_KEYS.DRAFT_META);
  setDraftBanner('');
  updateDraftStatusUI({}, false);
}

/**
 * Save temp draft with key
 * @param {string} key - Draft key
 */
export function saveTempDraft(key) {
  const draft = getDraftPayload(true);
  draft.draftOrder.savedKey = key;
  draft.draftOrder.savedAt = Date.now();
  localStorage.setItem(`draft-${key}`, JSON.stringify(draft));
  alert(`✅ Đã lưu nháp: ${key}`);
}

/**
 * Load temp draft by key
 * @param {string} key - Draft key
 * @param {Function} addRowFn - Function to add table row
 * @param {Function} clearPricingFn - Function to clear pricing fields
 * @param {Object} state - State object
 */
export function loadTempDraft(key, addRowFn, clearPricingFn, state = {}) {
  try {
    const raw = localStorage.getItem(`draft-${key}`);
    if (!raw) {
      alert('❌ Không tìm thấy nháp');
      return;
    }
    const data = JSON.parse(raw);
    restoreDraftToUI(data, addRowFn, clearPricingFn, state);
    setDraftBanner(`📋 Đã load nháp: ${key}`);
  } catch (err) {
    console.error('Error loading temp draft:', err);
    alert('❌ Lỗi khi load nháp');
  }
}

/**
 * Delete temp draft
 * @param {string} key - Draft key
 */
export function deleteTempDraft(key) {
  if (confirm(`Xóa nháp "${key}"?`)) {
    localStorage.removeItem(`draft-${key}`);
    alert(`✅ Đã xóa nháp: ${key}`);
  }
}

/**
 * Setup draft change listeners
 * @param {Function} markChangedFn - Function to call when draft changes
 */
export function setupDraftListeners(markChangedFn) {
  const inputs = ['itemName', 'n', 'alvinFree', 'desiredPrice'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', markChangedFn);
      el.addEventListener('change', markChangedFn);
    }
  });

  // Table inputs
  const table = document.getElementById('orderTable');
  if (table) {
    table.addEventListener('input', e => {
      if (e.target.matches('input')) {
        markChangedFn();
      }
    });
    table.addEventListener('change', e => {
      if (e.target.matches('input[type="checkbox"]')) {
        markChangedFn();
      }
    });
  }
}

/**
 * Initialize draft autosave
 * @param {Function} saveFn - Function to save draft
 * @param {Object} intervalRef - Object to store interval ID
 */
export function initDraftAutosave(saveFn, intervalRef = {}) {
  // Clear existing interval
  if (intervalRef.id) {
    clearInterval(intervalRef.id);
    intervalRef.id = null;
  }

  // Set up new interval
  intervalRef.id = setInterval(() => {
    console.log('[Draft] Autosave triggered');
    saveFn();
  }, DRAFT_CONFIG.BACKUP_INTERVAL_MS);

  console.log(`[Draft] Autosave initialized: every ${DRAFT_CONFIG.BACKUP_INTERVAL_MS / 60000} minutes`);
}

// Export all as default
export default {
  getDraftPayload,
  applyPeopleToTable,
  updateDraftStatusUI,
  setDraftBanner,
  saveDraftToLocalStorage,
  loadDraftFromLocalStorage,
  restoreDraftToUI,
  recordDraftMeta,
  getDraftFilename,
  clearDraft,
  saveTempDraft,
  loadTempDraft,
  deleteTempDraft,
  setupDraftListeners,
  initDraftAutosave,
};
