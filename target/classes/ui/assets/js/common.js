/**
 * PetSpa Desktop Application - Common JavaScript Utilities
 * 
 * This file contains shared utilities used across all pages.
 * The javaBridge object is injected by Java when the page loads.
 */

// =============================================================================
// BRIDGE READY HANDLER
// =============================================================================

/**
 * Called by Java when the JavaBridge is successfully injected.
 */
function onBridgeReady() {
    console.log('JavaBridge is ready!');
    // Dispatch custom event for page-specific handlers
    document.dispatchEvent(new CustomEvent('bridgeReady'));
}

/**
 * Waits for the JavaBridge to be ready.
 * @returns {Promise<void>}
 */
function waitForBridge() {
    return new Promise((resolve) => {
        if (window.javaBridge) {
            resolve();
        } else {
            document.addEventListener('bridgeReady', () => resolve(), { once: true });
        }
    });
}

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Calls a JavaBridge method and parses the JSON response.
 * @param {Function} bridgeMethod - The method to call on javaBridge
 * @param {...any} args - Arguments to pass to the method
 * @returns {Promise<{success: boolean, message: string, data: any}>}
 */
async function callBridge(methodName, ...args) {
    try {
        await waitForBridge();
        
        const result = window.javaBridge[methodName](...args);
        const parsed = JSON.parse(result);
        
        if (!parsed.success) {
            console.error(`Bridge call failed: ${parsed.message}`);
        }
        
        return parsed;
    } catch (error) {
        console.error(`Error calling ${methodName}:`, error);
        return {
            success: false,
            message: error.message || 'Unknown error occurred',
            data: null
        };
    }
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Shows an element by setting display to block or the specified value.
 * @param {string|Element} element - Element or element ID
 * @param {string} displayType - Display type (default: 'block')
 */
function showElement(element, displayType = 'block') {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) el.style.display = displayType;
}

/**
 * Hides an element by setting display to none.
 * @param {string|Element} element - Element or element ID
 */
function hideElement(element) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) el.style.display = 'none';
}

/**
 * Shows an error message.
 * @param {string} message - Error message to display
 * @param {string} elementId - ID of the error element (default: 'errorMessage')
 */
function showError(message, elementId = 'errorMessage') {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        showElement(errorEl);
    }
}

/**
 * Hides the error message.
 * @param {string} elementId - ID of the error element (default: 'errorMessage')
 */
function hideError(elementId = 'errorMessage') {
    hideElement(elementId);
}

/**
 * Sets loading state on a button.
 * @param {string|Element} button - Button element or ID
 * @param {boolean} isLoading - Loading state
 */
function setButtonLoading(button, isLoading) {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn) return;
    
    const textEl = btn.querySelector('.btn-text');
    const loadingEl = btn.querySelector('.btn-loading');
    
    btn.disabled = isLoading;
    
    if (textEl) textEl.style.display = isLoading ? 'none' : 'inline';
    if (loadingEl) loadingEl.style.display = isLoading ? 'inline' : 'none';
}

// =============================================================================
// DATE & TIME HELPERS
// =============================================================================

/**
 * Formats a date string for display.
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Formats a time string for display.
 * @param {string} timeStr - Time string (HH:mm:ss or HH:mm)
 * @returns {string} Formatted time
 */
function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Gets today's date in ISO format (YYYY-MM-DD).
 * @returns {string}
 */
function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Gets the current date formatted for display.
 * @returns {string}
 */
function getCurrentDateDisplay() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// =============================================================================
// CURRENCY HELPERS
// =============================================================================

/**
 * Formats a number as Vietnamese Dong currency.
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// =============================================================================
// STORAGE HELPERS (Session Storage for current session)
// =============================================================================

/**
 * Stores data in session storage.
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
function setSessionData(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to store session data:', e);
    }
}

/**
 * Retrieves data from session storage.
 * @param {string} key - Storage key
 * @returns {any} Stored value or null
 */
function getSessionData(key) {
    try {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to retrieve session data:', e);
        return null;
    }
}

/**
 * Removes data from session storage.
 * @param {string} key - Storage key
 */
function removeSessionData(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (e) {
        console.error('Failed to remove session data:', e);
    }
}

// =============================================================================
// MODAL HELPERS
// =============================================================================

/**
 * Opens a modal with the specified title and content.
 * @param {string} title - Modal title
 * @param {string} content - Modal body HTML content
 */
function openModal(title, content) {
    const modalContainer = document.getElementById('modalContainer');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (modalContainer && modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        showElement(modalContainer, 'flex');
    }
}

/**
 * Closes the modal.
 */
function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        hideElement(modalContainer);
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Set current date on page load
document.addEventListener('DOMContentLoaded', () => {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = getCurrentDateDisplay();
    }
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Log for debugging
console.log('Common JS loaded');
