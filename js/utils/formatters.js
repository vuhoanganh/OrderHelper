/**
 * Formatting Utilities
 * Centralized formatting functions for dates, money, numbers
 */

/**
 * Format money value
 * @param {number} value - Amount to format
 * @returns {string} Formatted money string (e.g., "100đ", "-50đ")
 */
export function formatMoney(value) {
    const neg = value < 0;
    const v = Math.round(Math.abs(value) * 100) / 100;
    return (neg ? '-' : '') + (Number.isInteger(v) ? v.toString() : v.toFixed(2)) + 'đ';
}

/**
 * Format date to local string
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) {
            return 'Invalid Date';
        }
        return d.toLocaleString('vi-VN');
    } catch (error) {
        console.error('[Formatters] Failed to format date:', error);
        return 'Invalid Date';
    }
}

/**
 * Format date to ISO string
 * @param {Date|string|number} date - Date to format
 * @returns {string} ISO date string
 */
export function formatDateISO(date) {
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) {
            return '';
        }
        return d.toISOString();
    } catch (error) {
        console.error('[Formatters] Failed to format date to ISO:', error);
        return '';
    }
}

/**
 * Format number with decimals
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(value, decimals = 0) {
    try {
        return Number(value).toFixed(decimals);
    } catch (error) {
        console.error('[Formatters] Failed to format number:', error);
        return '0';
    }
}

/**
 * Ceil to integer
 * @param {number} value - Value to ceil
 * @returns {number} Ceiled integer
 */
export function ceilInt(value) {
    return Math.ceil(value);
}

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, wait) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(null, args), wait);
    };
}

/**
 * Throttle function execution
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}

/**
 * Format draft timestamp to localized string
 * @param {number} ts - Timestamp to format
 * @returns {string} Formatted draft time or '—' if no timestamp
 */
export function formatDraftTime(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('vi-VN', { hour12: false });
}

// Export all as default
export default {
    formatMoney,
    formatDate,
    formatDateISO,
    formatNumber,
    ceilInt,
    debounce,
    throttle,
    formatDraftTime,
};
