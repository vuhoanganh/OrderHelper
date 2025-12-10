// Utility functions for formatting

export function formatMoney(x) {
    const neg = x < 0;
    const v = Math.round(Math.abs(x) * 100) / 100;
    return (neg ? '-' : '') + (Number.isInteger(v) ? v.toString() : v.toFixed(2)) + 'đ';
}

export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatDraftTime(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('vi-VN', { hour12: false });
}

export function ceilInt(x) {
    return Math.ceil(x);
}
