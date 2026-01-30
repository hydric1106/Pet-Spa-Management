/**
 * PetSpa Desktop Application - Index/Home Page JavaScript
 */

// =============================================================================
// INDEX PAGE LOGIC
// =============================================================================

/**
 * Navigate to login page
 */
function navigateToLogin() {
    if (typeof javaBridge !== 'undefined') {
        javaBridge.navigateTo('login.html');
    } else {
        window.location.href = 'login.html';
    }
}

/**
 * Navigate to register page
 */
function navigateToRegister() {
    if (typeof javaBridge !== 'undefined') {
        javaBridge.navigateTo('register.html');
    } else {
        window.location.href = 'register.html';
    }
}

/**
 * Called when JavaBridge is ready
 */
function onBridgeReady() {
    console.log('JavaBridge is ready on index page');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Index page loaded');
    
    // Any initialization logic for the home page can go here
});

console.log('Index JS loaded');
