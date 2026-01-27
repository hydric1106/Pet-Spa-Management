/**
 * PetSpa Desktop Application - Register Page JavaScript
 */

// =============================================================================
// REGISTER HANDLER
// =============================================================================

/**
 * Handle register form submission
 * @param {Event} event - The form submit event
 */
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate input
    if (!name || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Call Java bridge register method
    if (typeof javaApp !== 'undefined') {
        javaApp.register(name, email, password);
    } else {
        console.error('JavaBridge not available');
        showError('Application bridge not available. Please restart the app.');
    }
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    // Check if error element exists, if not create one
    let errorEl = document.getElementById('registerError');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'registerError';
        errorEl.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm';
        const form = document.getElementById('registerForm');
        if (form) {
            form.insertBefore(errorEl, form.firstChild);
        }
    }
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError() {
    const errorEl = document.getElementById('registerError');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Auto-focus on name field
    const nameField = document.getElementById('name');
    if (nameField) {
        nameField.focus();
    }
});

console.log('Register JS loaded');
