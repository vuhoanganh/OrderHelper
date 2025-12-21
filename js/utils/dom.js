/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

/**
 * Create element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {Array|string} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);

    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'textContent') {
            el.textContent = value;
        } else if (key.startsWith('data-')) {
            el.setAttribute(key, value);
        } else {
            el[key] = value;
        }
    });

    // Append children
    if (typeof children === 'string') {
        el.textContent = children;
    } else if (Array.isArray(children)) {
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        });
    }

    return el;
}

/**
 * Create DocumentFragment from array of elements
 * @param {Array<HTMLElement>} elements - Array of elements
 * @returns {DocumentFragment} Fragment containing all elements
 */
export function createFragment(elements) {
    const fragment = document.createDocumentFragment();
    elements.forEach(el => {
        if (el instanceof Node) {
            fragment.appendChild(el);
        }
    });
    return fragment;
}

/**
 * Clear all children from element
 * @param {HTMLElement} element - Element to clear
 */
export function clearChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Query selector with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} root - Root element (default: document)
 * @returns {HTMLElement|null} Found element or null
 */
export function $(selector, root = document) {
    try {
        return root.querySelector(selector);
    } catch (error) {
        console.error(`[DOM] Failed to query selector "${selector}":`, error);
        return null;
    }
}

/**
 * Query selector all with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} root - Root element (default: document)
 * @returns {NodeList} Found elements
 */
export function $$(selector, root = document) {
    try {
        return root.querySelectorAll(selector);
    } catch (error) {
        console.error(`[DOM] Failed to query selector all "${selector}":`, error);
        return [];
    }
}

/**
 * Get element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Found element or null
 */
export function byId(id) {
    try {
        return document.getElementById(id);
    } catch (error) {
        console.error(`[DOM] Failed to get element by ID "${id}":`, error);
        return null;
    }
}

/**
 * Add event listener with delegation support
 * @param {HTMLElement|string} target - Target element or selector
 * @param {string} event - Event name
 * @param {string|Function} selectorOrHandler - Selector for delegation or handler
 * @param {Function} handler - Handler function (if using delegation)
 */
export function on(target, event, selectorOrHandler, handler) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;

    if (typeof selectorOrHandler === 'function') {
        // Direct handler
        element.addEventListener(event, selectorOrHandler);
    } else {
        // Event delegation
        element.addEventListener(event, (e) => {
            const delegateTarget = e.target.closest(selectorOrHandler);
            if (delegateTarget) {
                handler.call(delegateTarget, e);
            }
        });
    }
}

// Export all as default
export default {
    createElement,
    createFragment,
    clearChildren,
    $,
    $$,
    byId,
    on,
};
