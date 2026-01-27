/**
 * PetSpa Desktop Application - Staff Dashboard JavaScript
 */

// =============================================================================
// GLOBAL STATE
// =============================================================================

let currentUser = null;
let currentPage = 'my-tasks';

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeDashboard();
    setupNavigation();
    setupLogout();
    setupDateSelector();
});

/**
 * Initializes the staff dashboard.
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
        
        // Load initial data
        await loadMyTasks();
        
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

// =============================================================================
// TASKS
// =============================================================================

/**
 * Sets up the date selector.
 */
function setupDateSelector() {
    const dateInput = document.getElementById('taskDate');
    if (dateInput) {
        dateInput.value = getTodayISO();
        dateInput.addEventListener('change', loadMyTasks);
    }
}

/**
 * Loads tasks (bookings) for the current staff member.
 */
async function loadMyTasks() {
    const dateInput = document.getElementById('taskDate');
    const date = dateInput ? dateInput.value : getTodayISO();
    
    try {
        const result = await callBridge('getBookingsByStaff', currentUser.id, date);
        
        const tasksListEl = document.getElementById('tasksList');
        if (!tasksListEl) return;
        
        if (!result.success || !result.data || result.data.length === 0) {
            tasksListEl.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>No tasks assigned for this day</p>
                </div>
            `;
            return;
        }
        
        const html = result.data.map(booking => `
            <div class="task-card ${booking.status.toLowerCase()}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0 0 8px 0;">
                            ${formatTime(booking.bookingTime)} - ${booking.petName}
                        </h4>
                        <p style="margin: 0; color: var(--text-muted);">
                            Owner: ${booking.customerName}<br>
                            Phone: ${booking.customerPhone}
                        </p>
                    </div>
                    <span class="badge badge-${booking.status.toLowerCase()}">${booking.status}</span>
                </div>
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--border-color);">
                    <strong>Services:</strong>
                    <ul style="margin: 5px 0 0 20px; padding: 0;">
                        ${booking.services.map(s => `<li>${s.serviceName} - ${formatCurrency(s.price)}</li>`).join('')}
                    </ul>
                </div>
                ${booking.status === 'CONFIRMED' ? `
                    <div style="margin-top: 15px;">
                        <button class="btn btn-success" onclick="updateBookingStatus(${booking.id}, 'IN_PROGRESS')">
                            Start Service
                        </button>
                    </div>
                ` : ''}
                ${booking.status === 'IN_PROGRESS' ? `
                    <div style="margin-top: 15px;">
                        <button class="btn btn-primary" onclick="updateBookingStatus(${booking.id}, 'COMPLETED')">
                            Mark Complete
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        tasksListEl.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

/**
 * Updates the status of a booking.
 * @param {number} bookingId - Booking ID
 * @param {string} status - New status
 */
async function updateBookingStatus(bookingId, status) {
    try {
        const result = await callBridge('updateBookingStatus', bookingId, status);
        
        if (result.success) {
            // Reload tasks to show updated status
            await loadMyTasks();
        } else {
            alert('Failed to update booking: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating booking status:', error);
    }
}

// =============================================================================
// SCHEDULE
// =============================================================================

/**
 * Loads the staff's weekly schedule.
 */
async function loadMySchedule() {
    try {
        const result = await callBridge('getStaffSchedule', currentUser.id);
        
        if (!result.success || !result.data) {
            return;
        }
        
        // Clear all day displays
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            const el = document.getElementById(day + '-shifts');
            if (el) el.innerHTML = '<span class="no-shift">No shift</span>';
        });
        
        // Group schedules by day
        const schedulesByDay = {};
        result.data.forEach(schedule => {
            const dayIndex = schedule.dayOfWeek;
            if (!schedulesByDay[dayIndex]) {
                schedulesByDay[dayIndex] = [];
            }
            schedulesByDay[dayIndex].push(schedule);
        });
        
        // Update each day
        Object.entries(schedulesByDay).forEach(([dayIndex, shifts]) => {
            const dayName = days[parseInt(dayIndex) - 1];
            const el = document.getElementById(dayName + '-shifts');
            if (el) {
                el.innerHTML = shifts.map(shift => `
                    <div class="shift-item">
                        ${shift.shiftName}<br>
                        <small>${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}</small>
                    </div>
                `).join('');
            }
        });
        
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
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
        'my-tasks': 'My Tasks',
        'my-schedule': 'My Schedule'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName] || 'My Tasks';
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const pageId = pageName === 'my-tasks' ? 'myTasksPage' : 'mySchedulePage';
    const pageEl = document.getElementById(pageId);
    if (pageEl) {
        pageEl.style.display = 'block';
        
        // Load page-specific data
        if (pageName === 'my-tasks') {
            loadMyTasks();
        } else if (pageName === 'my-schedule') {
            loadMySchedule();
        }
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
window.updateBookingStatus = updateBookingStatus;

console.log('Staff Dashboard JS loaded');
