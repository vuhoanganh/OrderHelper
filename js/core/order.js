/**
 * Order Management Module
 * Handles order creation, computation, and history management
 */

import { BUILD_TAG } from '../config.js';
import { formatMoney, formatDate } from '../utils/formatters.js';

/**
 * Add new row to order table
 */
export function addRow() {
  const tbody = document.querySelector('#orderTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="name-input" value="" placeholder="Nhập tên..."></td>
    <td><input type="number" min="1" step="1" value="1"></td>
    <td><input type="number" min="0" step="1" value="0" class="ship-count-input" placeholder="0"></td>
    <td style="text-align: center;"><input type="checkbox" class="payment-check"></td>
    <td style="text-align: center;"><button class="btn btn-danger" onclick="delRow(this)">✕</button></td>
  `;
  tbody.appendChild(tr);

  // Trigger draft changed if handler exists
  if (window.markDraftChanged) {
    window.markDraftChanged();
  }
}

/**
 * Delete row from order table
 * @param {HTMLElement} btn - Delete button element
 */
export function delRow(btn) {
  btn.closest('tr')?.remove();

  // Trigger draft changed if handler exists
  if (window.markDraftChanged) {
    window.markDraftChanged();
  }
}

/**
 * Build order signature for comparison
 * @param {Object} data - Order data
 * @returns {string} JSON signature
 */
export function buildOrderSignature(data = {}) {
  const normalizedDetails = Array.isArray(data.details) ? data.details.map(d => ({
    name: d.name,
    qty: d.qty,
    shipQty: d.shipQty || d.shipParts || 0,
    paid: d.paid === true,
    due: Number(d.due || 0),
    unitPrice: d.unitPrice
  })) : [];

  return JSON.stringify({
    itemName: data.itemName || '',
    totalParts: data.totalParts || 0,
    alvinFree: !!data.alvinFree,
    totalCostInput: Number(data.totalCostInput || 0),
    costPerUnitInput: Number(data.costPerUnitInput || 0),
    shipFee: Number(data.shipFee || 0),
    targetProfit: Number(data.targetProfit || 0),
    priceNonShip: Number(data.priceNonShip || 0),
    priceShip: Number(data.priceShip || data.priceNonShip || 0),
    splitShipMode: !!data.splitShipMode,
    details: normalizedDetails
  });
}

/**
 * Get final message from order
 * @param {Object} order - Order object
 * @returns {string} Formatted message
 */
export function getFinalMsgFromOrder(order) {
  const lines = [];
  lines.push(`🍽️ ${order.itemName || 'Order'}`);

  if (order.itemDesc) {
    lines.push(`📝 ${order.itemDesc}`);
  }

  if (order.deadline) {
    lines.push(`⏰ Deadline: ${order.deadline}`);
  }

  lines.push('');
  lines.push('👥 Chi tiết:');

  if (Array.isArray(order.details)) {
    const paidDetails = order.details.filter(d => d.paid);
    const unpaidDetails = order.details.filter(d => !d.paid);

    if (paidDetails.length > 0) {
      lines.push('\n✅ Đã trả:');
      paidDetails.forEach(d => {
        const shipInfo = d.shipQty > 0 ? ` (${d.shipQty} ship)` : '';
        lines.push(`  • ${d.name}: ${d.qty} phần${shipInfo} - ${formatMoney(d.due)}`);
      });
    }

    if (unpaidDetails.length > 0) {
      lines.push('\n❌ Chưa trả:');
      unpaidDetails.forEach(d => {
        const shipInfo = d.shipQty > 0 ? ` (${d.shipQty} ship)` : '';
        lines.push(`  • ${d.name}: ${d.qty} phần${shipInfo} - ${formatMoney(d.due)}`);
      });
    }
  }

  lines.push('');
  lines.push('💰 Tổng kết:');
  lines.push(`  • Giá/phần: ${formatMoney(order.priceNonShip || 0)}`);

  if (order.splitShipMode && order.priceShip !== order.priceNonShip) {
    lines.push(`  • Giá/phần (có ship): ${formatMoney(order.priceShip || 0)}`);
  }

  lines.push(`  • Tổng thu: ${formatMoney(order.totalRevenue || 0)}`);
  lines.push(`  • Lợi nhuận: ${formatMoney(order.profit || 0)}`);

  return lines.join('\n');
}

/**
 * Filter order history based on criteria
 * @param {Array} orders - Array of orders
 * @returns {Array} Filtered orders
 */
export function filterOrderHistory(orders) {
  const searchTerm = document.getElementById('historySearch')?.value?.toLowerCase() || '';
  const paidFilter = document.getElementById('historyPaidFilter')?.value || 'all';
  const dateFrom = document.getElementById('historyDateFrom')?.value || '';
  const dateTo = document.getElementById('historyDateTo')?.value || '';

  return orders.filter(order => {
    // Search filter
    if (searchTerm) {
      const matchItem = order.itemName?.toLowerCase().includes(searchTerm);
      const matchPerson = order.details?.some(d =>
        d.name?.toLowerCase().includes(searchTerm)
      );
      if (!matchItem && !matchPerson) return false;
    }

    // Paid filter
    if (paidFilter !== 'all') {
      const hasUnpaid = order.details?.some(d => !d.paid);
      if (paidFilter === 'paid' && hasUnpaid) return false;
      if (paidFilter === 'unpaid' && !hasUnpaid) return false;
    }

    // Date filter
    if (dateFrom || dateTo) {
      const orderDate = new Date(order.date).toISOString().split('T')[0];
      if (dateFrom && orderDate < dateFrom) return false;
      if (dateTo && orderDate > dateTo) return false;
    }

    return true;
  });
}

/**
 * Go to specific order in history
 * @param {string} orderId - Order ID
 */
export function goToOrder(orderId) {
  // Switch to history tab
  if (window.switchTab) {
    window.switchTab('history');
  }

  // Highlight order
  setTimeout(() => {
    const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
    if (orderCard) {
      orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      orderCard.classList.add('highlight-flash');
      setTimeout(() => orderCard.classList.remove('highlight-flash'), 2000);
    }
  }, 300);
}

/**
 * Search orders by item name
 * @param {string} itemName - Item name to search
 */
export function searchOrdersByItem(itemName) {
  const searchInput = document.getElementById('historySearch');
  if (searchInput) {
    searchInput.value = itemName;

    // Trigger filter
    if (window.applyHistoryFilters) {
      window.applyHistoryFilters();
    }
  }

  // Switch to history tab
  if (window.switchTab) {
    window.switchTab('history');
  }
}

/**
 * Start new order (reset form)
 */
export function startNewOrder() {
  // Reset form fields
  document.getElementById('itemName').value = '';
  document.getElementById('n').value = '';
  document.getElementById('alvinFree').checked = false;
  document.getElementById('totalCost').value = '';
  document.getElementById('costPerUnit').value = '';
  document.getElementById('shipFee').value = '';

  const targetProfit = document.getElementById('targetProfit');
  const desiredPrice = document.getElementById('desiredPrice');
  const itemDesc = document.getElementById('itemDesc');
  const deadline = document.getElementById('deadline');

  if (targetProfit) targetProfit.value = '';
  if (desiredPrice) desiredPrice.value = '';
  if (itemDesc) itemDesc.value = '';
  if (deadline) deadline.value = '';

  // Clear selected price
  if (window.selectedPrice !== undefined) {
    window.selectedPrice = null;
  }

  // Reset order table
  const tbody = document.querySelector('#orderTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    addRow();
  }

  // Reset output
  if (window.resetOutput) {
    window.resetOutput();
  }

  // Clear editing state
  if (window.editingOrderId !== undefined) {
    window.editingOrderId = null;
    window.editingOrderDate = null;
  }

  // Update draft status
  if (window.updateDraftStatusUI) {
    window.updateDraftStatusUI({});
  }

  // Clear draft
  if (window.clearDraft) {
    window.clearDraft();
  }

  console.log(`[${BUILD_TAG}] Started new order`);
}

/**
 * Show order summary message
 * @param {string} orderId - Order ID
 * @param {Event} event - Click event
 */
export function showOrderSummaryMsg(orderId, event) {
  if (event) event.stopPropagation();

  const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  const order = orderHistory.find(o => o.id === orderId);

  if (!order) {
    alert('❌ Không tìm thấy order');
    return;
  }

  const message = getFinalMsgFromOrder(order);

  // Show in modal or alert
  if (window.showModal) {
    const modalContent = `<pre style="white-space: pre-wrap; font-family: monospace;">${message}</pre>`;
    window.showModal('Order Summary', modalContent);
  } else {
    alert(message);
  }
}

/**
 * Delete order from history
 * @param {string} orderId - Order ID
 */
export function deleteOrder(orderId) {
  if (!confirm('⚠️ Xóa order này?\n\nThao tác này không thể hoàn tác.')) {
    return;
  }

  const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  const filtered = orderHistory.filter(o => o.id !== orderId);

  localStorage.setItem('orderHistory', JSON.stringify(filtered));

  // Refresh history display
  if (window.loadHistory) {
    window.loadHistory();
  }

  console.log(`[${BUILD_TAG}] Deleted order: ${orderId}`);
}

/**
 * Mark all people in order as paid
 * @param {string} orderId - Order ID
 */
export function markAllPaid(orderId) {
  const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  const order = orderHistory.find(o => o.id === orderId);

  if (!order) return;

  // Mark all as paid
  if (Array.isArray(order.details)) {
    order.details.forEach(d => {
      d.paid = true;
    });
  }

  // Save
  localStorage.setItem('orderHistory', JSON.stringify(orderHistory));

  // Refresh display
  if (window.loadHistory) {
    window.loadHistory();
  }

  console.log(`[${BUILD_TAG}] Marked all paid for order: ${orderId}`);
}

// Export all as default
export default {
  addRow,
  delRow,
  buildOrderSignature,
  getFinalMsgFromOrder,
  filterOrderHistory,
  goToOrder,
  searchOrdersByItem,
  startNewOrder,
  showOrderSummaryMsg,
  deleteOrder,
  markAllPaid,
};
