/**
 * PetSpa Admin - Staff Workshifts/Schedules Management
 * Handles calendar view and shift assignments
 */

let currentUser = null;
let schedules = [];
let staffList = [];
let shiftTypes = [];
let componentsInitialized = false;

// Current calendar state
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initWorkshiftsPage();
});

document.addEventListener('bridgeReady', () => {
    initWorkshiftsPage();
});

async function initWorkshiftsPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;
    
    componentsInitialized = true;
    
    try {
        // Load sidebar and header components
        await loadComponents([
            { 
                path: '../components/admin_sidebar.html', 
                target: 'sidebar',
                callback: () => initSidebarNavigation('workshifts', handleNavigation)
            },
            { 
                path: '../components/admin_header.html', 
                target: 'header'
            }
        ]);
        
        // Set page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'Staff Workshifts';
        }
        
        // Initialize page
        await initializePage();
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing workshifts page:', error);
    }
}

async function initializePage() {
    try {
        await waitForBridge();
        
        // Get current user
        const userResult = await callBridge('getCurrentUser');
        if (userResult.success) {
            currentUser = userResult.data;
            updateUserDisplay();
        } else {
            window.javaBridge.navigateTo('index.html');
            return;
        }
        
        // Load initial data
        await loadStaffList();
        await loadShiftTypes();
        
        // Render calendar
        renderCalendar();
        await loadSchedules();
        
    } catch (error) {
        console.error('Page initialization error:', error);
    }
}

function updateUserDisplay() {
    const userNameEl = document.getElementById('currentUserName');
    if (userNameEl && currentUser) {
        userNameEl.textContent = currentUser.fullName;
    }
}

// =============================================================================
// NAVIGATION
// =============================================================================

function handleNavigation(page) {
    const pageRoutes = {
        'dashboard': 'dashboard.html',
        'bookings': 'bookings.html',
        'pets': 'pets.html',
        'services': 'services.html',
        'clients': 'clients.html',
        'staff': 'staff.html',
        'workshifts': 'workshifts.html'
    };
    
    const route = pageRoutes[page];
    if (route && window.javaBridge) {
        window.javaBridge.navigateTo(`admin/${route}`);
    }
}

// =============================================================================
// DATA LOADING
// =============================================================================

async function loadStaffList() {
    try {
        const result = await callBridge('getAllUsers');
        if (result.success && result.data) {
            // Filter only active staff members
            staffList = result.data.filter(u => u.role === 'STAFF' && u.isActive !== false);
            populateStaffSelect();
        }
    } catch (error) {
        console.error('Error loading staff list:', error);
    }
}

async function loadShiftTypes() {
    try {
        const result = await callBridge('getAllShiftTypes');
        if (result.success && result.data) {
            shiftTypes = result.data;
            populateShiftTypeSelect();
        }
    } catch (error) {
        console.error('Error loading shift types:', error);
        // Fallback default shift types
        shiftTypes = [
            { id: 1, name: 'Morning', startTime: '08:00', endTime: '12:00' },
            { id: 2, name: 'Afternoon', startTime: '13:00', endTime: '17:00' },
            { id: 3, name: 'Full Day', startTime: '08:00', endTime: '17:00' }
        ];
        populateShiftTypeSelect();
    }
}

async function loadSchedules() {
    try {
        // Load schedules for current month
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        
        // For now, we'll load all staff schedules
        // You may need to add a bridge method for date range filtering
        schedules = [];
        
        for (const staff of staffList) {
            const result = await callBridge('getStaffSchedule', staff.id);
            if (result.success && result.data) {
                result.data.forEach(schedule => {
                    schedules.push({
                        ...schedule,
                        staffName: staff.fullName
                    });
                });
            }
        }
        
        renderSchedulesOnCalendar();
        
    } catch (error) {
        console.error('Error loading schedules:', error);
    }
}

function populateStaffSelect() {
    const select = document.getElementById('staffSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select staff member...</option>';
    staffList.forEach(staff => {
        const option = document.createElement('option');
        option.value = staff.id;
        option.textContent = staff.fullName;
        select.appendChild(option);
    });
}

function populateShiftTypeSelect() {
    const select = document.getElementById('shiftType');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select shift type...</option>';
    shiftTypes.forEach(shift => {
        const option = document.createElement('option');
        option.value = shift.id;
        option.textContent = `${shift.name} (${shift.startTime} - ${shift.endTime})`;
        select.appendChild(option);
    });
}

// =============================================================================
// CALENDAR RENDERING
// =============================================================================

function renderCalendar() {
    updateMonthDisplay();
    
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
    
    // Previous month's trailing days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        grid.appendChild(createDayCell(day, true, false));
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && today.getDate() === day;
        grid.appendChild(createDayCell(day, false, isToday));
    }
    
    // Next month's leading days
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
        grid.appendChild(createDayCell(i, true, false));
    }
}

function createDayCell(day, isOtherMonth, isToday) {
    const cell = document.createElement('div');
    cell.className = `calendar-day p-2 ${isOtherMonth ? 'bg-slate-50/50 dark:bg-gray-900/50' : ''} ${isToday ? 'bg-primary/5' : ''}`;
    cell.dataset.day = day;
    cell.dataset.otherMonth = isOtherMonth;
    
    const daySpan = document.createElement('span');
    daySpan.className = `text-xs font-bold ${isOtherMonth ? 'text-slate-300 dark:text-gray-600' : isToday ? 'text-primary' : 'text-slate-400'}`;
    daySpan.textContent = day;
    
    cell.appendChild(daySpan);
    
    // Container for shifts
    const shiftsContainer = document.createElement('div');
    shiftsContainer.className = 'mt-1 space-y-1 shifts-container';
    shiftsContainer.dataset.day = day;
    cell.appendChild(shiftsContainer);
    
    return cell;
}

function updateMonthDisplay() {
    const monthDisplay = document.getElementById('currentMonth');
    if (!monthDisplay) return;
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

function renderSchedulesOnCalendar() {
    // Clear existing shifts
    document.querySelectorAll('.shifts-container').forEach(container => {
        container.innerHTML = '';
    });
    
    // Group schedules by date
    schedules.forEach(schedule => {
        if (!schedule.workDate) return;
        
        const scheduleDate = new Date(schedule.workDate);
        if (scheduleDate.getFullYear() !== currentYear || scheduleDate.getMonth() !== currentMonth) {
            return;
        }
        
        const day = scheduleDate.getDate();
        const containers = document.querySelectorAll(`.shifts-container[data-day="${day}"]`);
        
        containers.forEach(container => {
            if (container.closest('.calendar-day').dataset.otherMonth === 'true') return;
            
            const shiftBadge = createShiftBadge(schedule);
            container.appendChild(shiftBadge);
        });
    });
}

function createShiftBadge(schedule) {
    const badge = document.createElement('div');
    
    // Determine color based on shift type
    let colorClass = 'bg-blue-500'; // Default morning
    if (schedule.shiftTypeName) {
        const shiftName = schedule.shiftTypeName.toLowerCase();
        if (shiftName.includes('afternoon')) {
            colorClass = 'bg-orange-500';
        } else if (shiftName.includes('full')) {
            colorClass = 'bg-green-500';
        }
    }
    
    badge.className = `${colorClass} text-white text-[10px] px-2 py-1 rounded font-semibold truncate cursor-pointer hover:opacity-80 transition-opacity`;
    badge.textContent = schedule.staffName || 'Staff';
    badge.title = `${schedule.staffName} - ${schedule.shiftTypeName || 'Shift'}`;
    
    return badge;
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Month navigation
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
        loadSchedules();
    });
    
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
        loadSchedules();
    });
    
    document.getElementById('todayBtn')?.addEventListener('click', () => {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth();
        renderCalendar();
        loadSchedules();
    });
    
    // Modal controls
    document.getElementById('assignShiftBtn')?.addEventListener('click', openShiftModal);
    document.getElementById('closeModalBtn')?.addEventListener('click', closeShiftModal);
    document.getElementById('cancelShiftBtn')?.addEventListener('click', closeShiftModal);
    document.getElementById('saveShiftBtn')?.addEventListener('click', saveShift);
    
    // Close modal on backdrop click
    document.getElementById('shiftModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'shiftModal') {
            closeShiftModal();
        }
    });
    
    // View toggle (placeholder for future implementation)
    document.getElementById('monthlyViewBtn')?.addEventListener('click', () => {
        document.getElementById('monthlyViewBtn').className = 'px-4 py-1.5 text-sm font-medium bg-white dark:bg-gray-700 shadow-sm rounded-lg text-text-main dark:text-white';
        document.getElementById('listViewBtn').className = 'px-4 py-1.5 text-sm font-medium text-text-muted hover:text-text-main dark:hover:text-white';
    });
    
    document.getElementById('listViewBtn')?.addEventListener('click', () => {
        document.getElementById('listViewBtn').className = 'px-4 py-1.5 text-sm font-medium bg-white dark:bg-gray-700 shadow-sm rounded-lg text-text-main dark:text-white';
        document.getElementById('monthlyViewBtn').className = 'px-4 py-1.5 text-sm font-medium text-text-muted hover:text-text-main dark:hover:text-white';
        // TODO: Switch to list view
    });
    
    // Setup logout
    setupLogout();
}

// =============================================================================
// MODAL & SHIFT OPERATIONS
// =============================================================================

function openShiftModal() {
    const modal = document.getElementById('shiftModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Set default date to today
        const dateInput = document.getElementById('shiftDate');
        if (dateInput) {
            dateInput.value = getTodayISO();
        }
    }
}

function closeShiftModal() {
    const modal = document.getElementById('shiftModal');
    if (modal) {
        modal.classList.add('hidden');
        // Reset form
        document.getElementById('shiftForm')?.reset();
    }
}

async function saveShift() {
    const staffId = document.getElementById('staffSelect')?.value;
    const shiftDate = document.getElementById('shiftDate')?.value;
    const shiftTypeId = document.getElementById('shiftType')?.value;
    
    if (!staffId || !shiftDate || !shiftTypeId) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const scheduleData = {
            staffId: parseInt(staffId),
            shiftTypeId: parseInt(shiftTypeId),
            workDate: shiftDate
        };
        
        const result = await callBridge('assignShift', JSON.stringify(scheduleData));
        
        if (result.success) {
            closeShiftModal();
            await loadSchedules();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving shift:', error);
        alert('Error saving shift assignment');
    }
}

// =============================================================================
// LOGOUT
// =============================================================================

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await callBridge('logout');
                window.javaBridge.navigateTo('index.html');
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
}

console.log('Workshifts Admin JS loaded');
