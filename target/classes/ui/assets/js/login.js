/**
 * PetSpa Desktop Application - Login Page JavaScript
 */

// =============================================================================
// LOGIN HANDLER
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validate input
        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }
        
        // Set loading state
        setButtonLoading(loginBtn, true);
        hideError();
        
        try {
            // Wait for bridge to be ready
            await waitForBridge();
            
            // Call login method on JavaBridge
            const result = await callBridge('login', email, password);
            
            if (result.success) {
                const user = result.data;
                
                // Store user info in session
                setSessionData('currentUser', user);
                
                // Navigate to appropriate dashboard based on role
                if (user.role === 'ADMIN') {
                    window.javaBridge.navigateTo('dashboard-admin.html');
                } else if (user.role === 'STAFF') {
                    window.javaBridge.navigateTo('dashboard-staff.html');
                }
            } else {
                showError(result.message || 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred during login. Please try again.');
        } finally {
            setButtonLoading(loginBtn, false);
        }
    });
    
    // Auto-focus on email field
    document.getElementById('email').focus();
});

console.log('Login JS loaded');
