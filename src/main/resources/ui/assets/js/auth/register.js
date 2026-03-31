/**
 * PetSpa Desktop Application - Register Page JavaScript
 */

let isSubmitting = false;

/**
 * Handle register form submission.
 * @param {Event} event - The form submit event
 */
async function handleRegister(event) {
    event.preventDefault();
    if (isSubmitting) return;

    hideError();
    hideSuccess();

    const name = document.getElementById('name')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';

    if (!name || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    if (typeof javaBridge === 'undefined') {
        showError('Application bridge not available. Please restart the app.');
        return;
    }

    const payload = {
        fullName: name,
        email,
        password,
        phoneNumber: null,
        role: 'STAFF'
    };

    try {
        setSubmitLoading(true);
        isSubmitting = true;

        const responseJson = javaBridge.createUser(JSON.stringify(payload));
        const response = JSON.parse(responseJson);

        if (!response.success) {
            showError(response.message || 'Registration failed');
            return;
        }

        showSuccess('Registration successful. Redirecting to login...');
        setTimeout(() => {
            if (typeof javaBridge !== 'undefined') {
                javaBridge.navigateTo('login.html');
            } else {
                window.location.href = 'login.html';
            }
        }, 900);
    } catch (error) {
        console.error('Register error:', error);
        showError('Registration failed. Please try again.');
    } finally {
        setSubmitLoading(false);
        isSubmitting = false;
    }
}

/**
 * Sets submit button loading state.
 * @param {boolean} isLoading
 */
function setSubmitLoading(isLoading) {
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    if (!submitBtn) return;

    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
    } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
    }
}

/**
 * Show error message to user.
 * @param {string} message - Error message to display
 */
function showError(message) {
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
 * Show success message.
 * @param {string} message - Success message
 */
function showSuccess(message) {
    let successEl = document.getElementById('registerSuccess');
    if (!successEl) {
        successEl = document.createElement('div');
        successEl.id = 'registerSuccess';
        successEl.className = 'bg-emerald-100 border border-emerald-300 text-emerald-700 px-4 py-3 rounded-lg mb-4 text-sm';
        const form = document.getElementById('registerForm');
        if (form) {
            form.insertBefore(successEl, form.firstChild);
        }
    }
    successEl.textContent = message;
    successEl.style.display = 'block';
}

/**
 * Hide error message.
 */
function hideError() {
    const errorEl = document.getElementById('registerError');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

/**
 * Hide success message.
 */
function hideSuccess() {
    const successEl = document.getElementById('registerSuccess');
    if (successEl) {
        successEl.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const nameField = document.getElementById('name');
    if (nameField) {
        nameField.focus();
    }
});

console.log('Register JS loaded');
