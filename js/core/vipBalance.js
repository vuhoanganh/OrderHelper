/**
 * VIP Balance Core Logic
 * Pure functions for VIP balance calculation
 * No DOM access, no side effects, fully testable
 */

/**
 * Parse VIP text to map
 * @param {string} text - VIP list text (format: "Name, 100đ")
 * @returns {Map<string, number>} - Map of name → balance
 */
export function parseVipText(text) {
    const map = new Map();
    if (!text) return map;

    const lines = text.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Match: "Name, 100đ" or "Name, 100"
        const match = trimmed.match(/^([^,]+),\s*(\d+)đ?$/);
        if (match) {
            const name = match[1].trim();
            const balance = parseInt(match[2], 10);
            if (name && Number.isFinite(balance)) {
                map.set(name, balance);
            }
        }
    }

    return map;
}

/**
 * Convert VIP map to text format
 * @param {Map<string, number>} vipMap - Map of name → balance
 * @returns {string} - Formatted text (sorted by name)
 */
export function vipMapToText(vipMap) {
    if (!vipMap || vipMap.size === 0) return '';

    return Array.from(vipMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0], 'vi'))
        .map(([name, balance]) => `${name}, ${balance}đ`)
        .join('\n');
}

/**
 * Calculate VIP balances from transaction ledger
 * Pure function: No side effects, testable
 * 
 * @param {Array} transactions - VIP transaction ledger
 * @param {Map<string, number>} initialBalances - Starting balances (optional)
 * @returns {Map<string, number>} - Calculated balances
 */
export function calculateVipBalances(transactions, initialBalances = new Map()) {
    // Start with initial balances (copy to avoid mutation)
    const balances = new Map(initialBalances);

    if (!Array.isArray(transactions)) {
        return balances;
    }

    transactions.forEach(tx => {
        // Skip orphan transactions
        if (tx?.orphan) return;

        // Skip invalid transactions
        const name = (tx?.name || '').trim();
        if (!name) return;

        const amount = Number(tx?.amount);
        if (!Number.isFinite(amount)) return;

        // Determine transaction type
        const type = tx?.type || (amount >= 0 ? 'topup' : 'cashout');

        // Only process valid types
        if (type !== 'topup' && type !== 'cashout' && type !== 'order' && type !== 'opening') return;

        // For orders, only count VIP payments
        if (type === 'order') {
            if (tx?.isVipPayment !== true && tx?.paymentMethod !== 'vip') return;
        }

        // Apply transaction to balance
        const current = Number(balances.get(name) || 0);
        balances.set(name, current + amount);
    });

    return balances;
}

/**
 * Validate VIP balance against ledger
 * Returns { valid, expected, actual, diff }
 * 
 * @param {string} name - VIP member name
 * @param {number} expectedBalance - Expected balance from vipList
 * @param {Array} transactions - Full transaction ledger
 * @returns {Object} - Validation result
 */
export function validateVipBalance(name, expectedBalance, transactions) {
    const memberTxs = transactions.filter(tx => tx?.name === name);
    const calculated = calculateVipBalances(memberTxs);
    const actualBalance = calculated.get(name) || 0;

    return {
        name,
        valid: actualBalance === expectedBalance,
        expected: expectedBalance,
        actual: actualBalance,
        diff: actualBalance - expectedBalance,
        transactionCount: memberTxs.length
    };
}

/**
 * Get all VIP member names from ledger
 * @param {Array} transactions
 * @returns {Set<string>} - Unique member names
 */
export function getVipMemberNames(transactions) {
    const names = new Set();

    if (!Array.isArray(transactions)) return names;

    transactions.forEach(tx => {
        const name = (tx?.name || '').trim();
        if (name) names.add(name);
    });

    return names;
}

// Export as default object
export default {
    parseVipText,
    vipMapToText,
    calculateVipBalances,
    validateVipBalance,
    getVipMemberNames
};
