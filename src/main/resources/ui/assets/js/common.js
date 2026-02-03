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
// COMPONENT LOADER
// =============================================================================

/**
 * Cache for loaded components to avoid multiple fetches
 */
const componentCache = {};

/**
 * Extracts component filename from a path.
 * @param {string} componentPath - Path like '../components/admin_sidebar.html'
 * @returns {string} - Filename like 'admin_sidebar.html'
 */
function getComponentFilename(componentPath) {
    const parts = componentPath.split('/');
    return parts[parts.length - 1];
}

/**
 * Loads an HTML component into a target element.
 * Uses JavaBridge to load components from resources.
 * @param {string} componentPath - Relative path to the component HTML file
 * @param {string|Element} targetElement - Target element or its ID
 * @param {Function} [callback] - Optional callback after component is loaded
 * @returns {Promise<void>}
 */
async function loadComponent(componentPath, targetElement, callback) {
    try {
        const target = typeof targetElement === 'string' 
            ? document.getElementById(targetElement) 
            : targetElement;
        
        if (!target) {
            console.error(`Target element not found: ${targetElement}`);
            return;
        }

        // Check cache first
        let html = componentCache[componentPath];
        
        if (!html) {
            // Wait for JavaBridge to be available
            await waitForBridge();
            
            // Extract just the filename from the path
            const filename = getComponentFilename(componentPath);
            
            // Use JavaBridge to load component
            const result = window.javaBridge.loadComponent(filename);
            const parsed = JSON.parse(result);
            
            if (!parsed.success) {
                throw new Error(parsed.message);
            }
            
            html = parsed.data;
            componentCache[componentPath] = html;
        }

        target.innerHTML = html;
        
        if (callback && typeof callback === 'function') {
            callback(target);
        }

        // Dispatch event for component-specific initialization
        document.dispatchEvent(new CustomEvent('componentLoaded', { 
            detail: { path: componentPath, target } 
        }));

    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

/**
 * Loads multiple components in parallel.
 * @param {Array<{path: string, target: string|Element, callback?: Function}>} components
 * @returns {Promise<void>}
 */
async function loadComponents(components) {
    await Promise.all(
        components.map(({ path, target, callback }) => 
            loadComponent(path, target, callback)
        )
    );
}

/**
 * Initializes sidebar navigation with active state management.
 * @param {string} activePage - The data-page value of the active link
 * @param {Function} [onNavigate] - Optional callback when a nav item is clicked
 */
function initSidebarNavigation(activePage, onNavigate) {
    const links = document.querySelectorAll('.sidebar-link');
    
    links.forEach(link => {
        const page = link.getAttribute('data-page');
        
        // Set active state
        if (page === activePage) {
            setLinkActive(link, true);
        } else {
            setLinkActive(link, false);
        }
        
        // Add click handler for navigation
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active states
            links.forEach(l => setLinkActive(l, false));
            setLinkActive(link, true);
            
            // Call navigation callback if provided
            if (onNavigate && typeof onNavigate === 'function') {
                onNavigate(page);
            }
        });
    });
}

/**
 * Sets the active/inactive state for a sidebar link.
 * @param {Element} link - The link element
 * @param {boolean} isActive - Whether the link should be active
 */
function setLinkActive(link, isActive) {
    if (isActive) {
        link.classList.add('bg-sidebar-active-bg', 'text-sidebar-active-text', 'font-bold');
        link.classList.remove('hover:bg-slate-50', 'dark:hover:bg-gray-800', 'text-slate-500', 
            'hover:text-sidebar-active-text', 'dark:text-gray-400', 'dark:hover:text-white');
    } else {
        link.classList.remove('bg-sidebar-active-bg', 'text-sidebar-active-text', 'font-bold');
        link.classList.add('hover:bg-slate-50', 'dark:hover:bg-gray-800', 'text-slate-500', 
            'hover:text-sidebar-active-text', 'dark:text-gray-400', 'dark:hover:text-white');
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
