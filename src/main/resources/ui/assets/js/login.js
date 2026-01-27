/**
 * PetSpa Desktop Application - Login Page JavaScript
 */

// =============================================================================
// LOGIN HANDLER
// =============================================================================

/**
 * Handle login form submission
 * @param {Event} event - The form submit event
 */
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate input
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    // Call Java bridge login method
    if (typeof javaApp !== 'undefined') {
        javaApp.login(email, password);
    } else {
        console.error('JavaBridge not available');
        showError('Application bridge not available. Please restart the app.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Auto-focus on email field
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.focus();
    }
});

console.log('Login JS loaded');
