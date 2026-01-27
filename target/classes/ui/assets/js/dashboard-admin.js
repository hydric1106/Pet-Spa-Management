/**
 * PetSpa Desktop Application - Admin Dashboard JavaScript
 */

// =============================================================================
// GLOBAL STATE
// =============================================================================

let currentUser = null;
let currentPage = 'dashboard';

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeDashboard();
    setupNavigation();
    setupLogout();
});

/**
 * Initializes the admin dashboard.
 */
async function initializeDashboard() {
    try {
        await waitForBridge();
        
        // Get current user
        const userResult = await callBridge('getCurrentUser');
        if (userResult.success) {
            currentUser = userResult.data;
            updateUserDisplay();
        } else {
            // Not logged in, redirect to login
            window.javaBridge.navigateTo('index.html');
            return;
        }
        
        // Load dashboard data
        await loadDashboardData();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
    }
}

/**
 * Updates the user display in the sidebar.
 */
function updateUserDisplay() {
    const userNameEl = document.getElementById('currentUserName');
    if (userNameEl && currentUser) {
        userNameEl.textContent = currentUser.fullName;
    }
}

/**
 * Loads dashboard statistics and today's schedule.
 */
async function loadDashboardData() {
    try {
        // Load today's bookings
        const today = getTodayISO();
        const bookingsResult = await callBridge('getBookingsByDate', today);
        
        if (bookingsResult.success) {
            document.getElementById('todayBookings').textContent = 
                bookingsResult.data ? bookingsResult.data.length : 0;
            
            // Update schedule display
            updateTodaySchedule(bookingsResult.data || []);
        }
        
        // Load customers count
        const customersResult = await callBridge('getAllCustomers');
        if (customersResult.success) {
            document.getElementById('totalCustomers').textContent = 
                customersResult.data ? customersResult.data.length : 0;
        }
        
        // Load services
        const servicesResult = await callBridge('getAllServices');
        if (servicesResult.success) {
            // Could display services count if needed
        }
        
        // Load staff count
        const staffResult = await callBridge('getAllUsers');
        if (staffResult.success) {
            const staff = staffResult.data.filter(u => u.role === 'STAFF' && u.isActive);
            document.getElementById('activeStaff').textContent = staff.length;
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Updates today's schedule display.
 * @param {Array} bookings - List of bookings for today
 */
function updateTodaySchedule(bookings) {
    const scheduleEl = document.getElementById('todaySchedule');
    if (!scheduleEl) return;
    
    if (bookings.length === 0) {
        scheduleEl.innerHTML = '<p class="empty-state">No bookings for today</p>';
        return;
    }
    
    const html = bookings.map(booking => `
        <div class="task-card ${booking.status.toLowerCase()}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${formatTime(booking.bookingTime)}</strong> - 
                    ${booking.customerName} (${booking.petName})
                </div>
                <span class="badge badge-${booking.status.toLowerCase()}">${booking.status}</span>
            </div>
            <div style="margin-top: 8px; font-size: 13px; color: var(--text-muted);">
                Staff: ${booking.staffName || 'Not assigned'} | 
                Total: ${formatCurrency(booking.totalPrice)}
            </div>
        </div>
    `).join('');
    
    scheduleEl.innerHTML = html;
}

// =============================================================================
// NAVIGATION
// =============================================================================

/**
 * Sets up sidebar navigation.
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            showPage(page);
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

/**
 * Shows a specific page.
 * @param {string} pageName - Name of the page to show
 */
function showPage(pageName) {
    currentPage = pageName;
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'bookings': 'Bookings / POS',
        'customers': 'Customer CRM',
        'pets': 'Pet Management',
        'services': 'Service Management',
        'staff': 'Staff Management',
        'schedules': 'Schedule Management'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName] || 'Dashboard';
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const pageEl = document.getElementById(pageName + 'Page');
    if (pageEl) {
        pageEl.style.display = 'block';
        loadPageData(pageName);
    }
}

/**
 * Loads data for a specific page.
 * @param {string} pageName - Name of the page
 */
async function loadPageData(pageName) {
    switch (pageName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'bookings':
            // Load bookings data
            break;
        case 'customers':
            // Load customers data
            break;
        case 'pets':
            // Load pets data
            break;
        case 'services':
            // Load services data
            break;
        case 'staff':
            // Load staff data
            break;
        case 'schedules':
            // Load schedules data
            break;
    }
}

// =============================================================================
// LOGOUT
// =============================================================================

/**
 * Sets up the logout button.
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await callBridge('logout');
                removeSessionData('currentUser');
                window.javaBridge.navigateTo('index.html');
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
}

// =============================================================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// =============================================================================

window.showPage = showPage;
window.closeModal = closeModal;

console.log('Admin Dashboard JS loaded');
