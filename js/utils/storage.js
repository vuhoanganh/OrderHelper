/**
 * Storage Service Layer
 * Wraps all localStorage operations with validation, error handling, and debug logging
 * INVARIANT: This is the ONLY module that should directly access localStorage
 */

import { FEATURES } from '../config.js';

/**
 * Debug logger for storage operations
 */
function debugLog(operation, key, value) {
    if (FEATURES.DEBUG_STORAGE) {
        console.log(`[Storage] ${operation}:`, key, value !== undefined ? value : '');
    }
}

/**
 * Get JSON data from localStorage with fallback
 * @param {string} key - Storage key
 * @param {*} fallback - Fallback value if key doesn't exist or parse fails
 * @returns {*} Parsed JSON or fallback
 */
export function getJSON(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null || raw === undefined) {
            debugLog('GET-JSON-MISS', key, fallback);
            return fallback;
        }
        const parsed = JSON.parse(raw);
        debugLog('GET-JSON-HIT', key, parsed);
        return parsed;
    } catch (error) {
        console.error(`[Storage] Failed to parse JSON for key "${key}":`, error);
        debugLog('GET-JSON-ERROR', key, fallback);
        return fallback;
    }
}

/**
 * Set JSON data to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to stringify and store
 * @returns {boolean} Success status
 */
export function setJSON(key, value) {
    try {
        const stringified = JSON.stringify(value);
        localStorage.setItem(key, stringified);
        debugLog('SET-JSON', key, value);
        return true;
    } catch (error) {
        console.error(`[Storage] Failed to set JSON for key "${key}":`, error);
        return false;
    }
}

/**
 * Get text data from localStorage
 * @param {string} key - Storage key
 * @param {string} fallback - Fallback value
 * @returns {string} Text value or fallback
 */
export function getText(key, fallback = '') {
    try {
        const value = localStorage.getItem(key);
        if (value === null || value === undefined) {
            debugLog('GET-TEXT-MISS', key, fallback);
            return fallback;
        }
        debugLog('GET-TEXT-HIT', key, value);
        return value;
    } catch (error) {
        console.error(`[Storage] Failed to get text for key "${key}":`, error);
        return fallback;
    }
}

/**
 * Set text data to localStorage
 * @param {string} key - Storage key
 * @param {string} value - Text value
 * @returns {boolean} Success status
 */
export function setText(key, value) {
    try {
        localStorage.setItem(key, String(value));
        debugLog('SET-TEXT', key, value);
        return true;
    } catch (error) {
        console.error(`[Storage] Failed to set text for key "${key}":`, error);
        return false;
    }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function remove(key) {
    try {
        localStorage.removeItem(key);
        debugLog('REMOVE', key);
        return true;
    } catch (error) {
        console.error(`[Storage] Failed to remove key "${key}":`, error);
        return false;
    }
}

/**
 * Check if key exists in localStorage
 * @param {string} key - Storage key
 * @returns {boolean} True if key exists
 */
export function has(key) {
    try {
        return localStorage.getItem(key) !== null;
    } catch (error) {
        console.error(`[Storage] Failed to check key "${key}":`, error);
        return false;
    }
}

/**
 * Get number value from localStorage
 * @param {string} key - Storage key
 * @param {number} fallback - Fallback value
 * @returns {number} Number value or fallback
 */
export function getNumber(key, fallback = 0) {
    try {
        const value = localStorage.getItem(key);
        if (value === null || value === undefined) {
            return fallback;
        }
        const num = Number(value);
        return isNaN(num) ? fallback : num;
    } catch (error) {
        console.error(`[Storage] Failed to get number for key "${key}":`, error);
        return fallback;
    }
}

/**
 * Set number value to localStorage
 * @param {string} key - Storage key
 * @param {number} value - Number value
 * @returns {boolean} Success status
 */
export function setNumber(key, value) {
    return setText(key, String(value));
}

// Export all functions as default object for easier imports
export default {
    getJSON,
    setJSON,
    getText,
    setText,
    remove,
    has,
    getNumber,
    setNumber,
};
