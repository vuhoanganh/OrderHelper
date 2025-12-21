/**
 * OrderHelper Application Bootstrap
 * Entry point for the modular application
 * 
 * IMPORTANT: This is a gradual migration approach
 * The app will continue to work with existing inline code while we progressively
 * move functionality to modules
 */

import { BUILD_TAG } from './config.js';
import storage from './utils/storage.js';
import dom from './utils/dom.js';
import vipBalanceCore from './core/vipBalance.js';

// Expose to window for gradual migration
// Inline functions can access via window.vipBalanceCore
window.vipBalanceCore = vipBalanceCore;

console.log(`[App] OrderHelper Pro - Build: ${BUILD_TAG}`);
console.log('[App] Modular bootstrap initialized');

/**
 * Initialize application
 */
function initApp() {
    console.log('[App] Starting application initialization...');

    // Verify storage service is working
    try {
        const testKey = '__app_test__';
        storage.setText(testKey, 'ok');
        const test = storage.getText(testKey);
        storage.remove(testKey);
        if (test !== 'ok') {
            throw new Error('Storage service verification failed');
        }
        console.log('[App] ✓ Storage service verified');
    } catch (error) {
        console.error('[App] ✗ Storage service verification failed:', error);
    }

    // Initialize event bindings (will be populated in next steps)
    initEventBindings();

    console.log('[App] ✓ Application initialized');
}

/**
 * Initialize event bindings
 * This will replace inline onclick handlers progressively
 */
function initEventBindings() {
    console.log('[App] Setting up event bindings...');

    // Example: Tab switching (will implement in next step)
    // dom.on(document, 'click', '[data-action="switch-tab"]', handleTabSwitch);

    // More bindings will be added here as we migrate from inline handlers
}

/**
 * Handle tab switching
 * @param {Event} event - Click event
 */
function handleTabSwitch(event) {
    // Implementation will be added when migrating switchTab function
    console.log('[App] Tab switch:', event);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for potential use in console/debugging
export { initApp };
