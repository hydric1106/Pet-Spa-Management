/**
 * PetSpa Desktop Application - Login Page JavaScript
 */

// =============================================================================
// LOGIN HANDLER
// =============================================================================

/**
 * Show error message to user
 * @param {string} message - The error message to display
 */
function showError(message) {
    // Remove existing error if any
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm';
    errorDiv.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    // Insert before the form
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(errorDiv, form);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * Show loading state on button
 * @param {boolean} isLoading - Whether to show loading state
 */
function setLoading(isLoading) {
    const button = document.querySelector('button[type="submit"]');
    if (button) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `
                <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Logging in...</span>
            `;
        } else {
            button.disabled = false;
            button.innerHTML = '<span>Login</span>';
        }
    }
}

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
    if (typeof javaBridge !== 'undefined') {
        setLoading(true);
        
        try {
            // Call the login method and get JSON response
            const responseJson = javaBridge.login(email, password);
            const response = JSON.parse(responseJson);
            
            if (response.success && response.data) {
                const user = response.data;
                console.log('Login successful:', user.fullName, 'Role:', user.role);
                
                // Navigate based on role
                if (user.role === 'ADMIN') {
                    javaBridge.navigateTo('admin/dashboard.html');
                } else if (user.role === 'STAFF') {
                    javaBridge.navigateTo('staff/dashboard.html');
                } else {
                    showError('Unknown user role');
                    setLoading(false);
                }
            } else {
                showError(response.message || 'Invalid email or password');
                setLoading(false);
            }
        } catch (e) {
            console.error('Login error:', e);
            showError('Login failed. Please try again.');
            setLoading(false);
        }
    } else {
        console.error('JavaBridge not available');
        showError('Application bridge not available. Please restart the app.');
    }
}

/**
 * Called when JavaBridge is ready
 */
function onBridgeReady() {
    console.log('JavaBridge is ready');
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
