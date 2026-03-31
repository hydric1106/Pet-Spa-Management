/**
 * PetSpa Admin - Staff Workshifts/Schedules Management
 * Handles calendar view and shift assignments
 */

let currentUser = null;
let schedules = [];
let staffList = [];
let shiftTypes = [];
let componentsInitialized = false;
let selectedSchedule = null;

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
        const scheduleRequests = staffList
            .map(staff => ({
                staff,
                staffId: parseEntityId(staff.id)
            }))
            .filter(item => item.staffId)
            .map(async ({ staff, staffId }) => {
                const result = await callBridge('getStaffSchedule', String(staffId));
                if (!result.success || !Array.isArray(result.data)) {
                    console.warn(`Failed to load schedule for staff ${staffId}:`, result.message || 'Unknown error');
                    return [];
                }

                return result.data.map(schedule => ({
                    ...schedule,
                    id: parseEntityId(schedule.id),
                    staffId: parseEntityId(schedule.staffId) || staffId,
                    scheduleDate: normalizeScheduleDate(schedule.scheduleDate),
                    dayOfWeek: Number(schedule.dayOfWeek),
                    staffName: schedule.staffName || staff.fullName
                }));
            });

        const scheduleGroups = await Promise.all(scheduleRequests);
        schedules = scheduleGroups
            .flat()
            .filter(schedule => schedule.id && !!schedule.scheduleDate);

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

    if (schedules.length === 0) return;

    // Iterate days in the current month and match schedules by exact scheduleDate
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = getDateString(currentYear, currentMonth, day);
        const matching = schedules.filter(s => s.scheduleDate === dateKey);
        if (matching.length === 0) continue;

        const containers = document.querySelectorAll(`.shifts-container[data-day="${day}"]`);
        containers.forEach(container => {
            if (container.closest('.calendar-day')?.dataset.otherMonth === 'true') return;
            matching.forEach(schedule => container.appendChild(createShiftBadge(schedule)));
        });
    }
}

function createShiftBadge(schedule) {
    const badge = document.createElement('div');

    // Determine color based on shift type
    let colorClass = 'bg-blue-500'; // Default (morning)
    if (schedule.shiftName) {
        const name = schedule.shiftName.toLowerCase();
        if (name.includes('afternoon')) {
            colorClass = 'bg-orange-500';
        } else if (name.includes('full')) {
            colorClass = 'bg-green-500';
        }
    }

    badge.className = `${colorClass} text-white text-[10px] px-2 py-1 rounded font-semibold truncate cursor-pointer hover:opacity-80 transition-opacity`;
    badge.textContent = schedule.staffName || 'Staff';
    badge.title = `${schedule.staffName || ''} — ${schedule.shiftName || 'Shift'}`;
    badge.addEventListener('click', () => openShiftDetailModal(schedule));

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

    // Shift detail modal controls
    document.getElementById('closeDetailModalBtn')?.addEventListener('click', closeShiftDetailModal);
    document.getElementById('cancelDetailBtn')?.addEventListener('click', closeShiftDetailModal);
    document.getElementById('saveDetailBtn')?.addEventListener('click', saveShiftDetail);
    document.getElementById('deleteShiftBtn')?.addEventListener('click', deleteShiftDetail);
    
    // Close modal on backdrop click
    document.getElementById('shiftModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'shiftModal') {
            closeShiftModal();
        }
    });

    document.getElementById('shiftDetailModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'shiftDetailModal') {
            closeShiftDetailModal();
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
            scheduleDate: shiftDate
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

function openShiftDetailModal(schedule) {
    if (!schedule) {
        return;
    }

    const scheduleId = parseEntityId(schedule.id);
    if (!scheduleId) {
        alert('Unable to open shift details: invalid schedule ID.');
        return;
    }

    selectedSchedule = { ...schedule, id: scheduleId };

    const modal = document.getElementById('shiftDetailModal');
    if (!modal) {
        return;
    }

    const staffInput = document.getElementById('detailStaffName');
    const dayInput = document.getElementById('detailDayName');
    const shiftTypeSelect = document.getElementById('detailShiftType');

    if (staffInput) {
        staffInput.value = selectedSchedule.staffName || '—';
    }

    if (dayInput) {
        dayInput.value = formatScheduleDateForDisplay(selectedSchedule.scheduleDate);
    }

    if (shiftTypeSelect) {
        shiftTypeSelect.innerHTML = '<option value="">Select shift type...</option>';
        shiftTypes.forEach(shift => {
            const option = document.createElement('option');
            option.value = shift.id;
            option.textContent = `${shift.name} (${shift.startTime} - ${shift.endTime})`;
            if (Number(shift.id) === Number(selectedSchedule.shiftTypeId)) {
                option.selected = true;
            }
            shiftTypeSelect.appendChild(option);
        });
    }

    modal.classList.remove('hidden');
}

function closeShiftDetailModal() {
    const modal = document.getElementById('shiftDetailModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    selectedSchedule = null;
}

async function saveShiftDetail() {
    if (!selectedSchedule) {
        return;
    }

    const selectedShiftTypeId = parseEntityId(document.getElementById('detailShiftType')?.value);
    if (!selectedShiftTypeId) {
        alert('Please select a valid shift type.');
        return;
    }

    if (Number(selectedShiftTypeId) === Number(selectedSchedule.shiftTypeId)) {
        closeShiftDetailModal();
        return;
    }

    try {
        const newSchedulePayload = {
            staffId: Number(selectedSchedule.staffId),
            shiftTypeId: Number(selectedShiftTypeId),
            scheduleDate: selectedSchedule.scheduleDate
        };

        const createResult = await callBridge('assignShift', JSON.stringify(newSchedulePayload));
        if (!createResult.success) {
            alert('Error: ' + (createResult.message || 'Failed to update shift.'));
            return;
        }

        const removeResult = await callBridge('removeSchedule', String(selectedSchedule.id));
        if (!removeResult.success) {
            alert('Shift update partially succeeded. New shift created, but old shift removal failed: ' + (removeResult.message || 'Unknown error'));
        }

        closeShiftDetailModal();
        await loadSchedules();
    } catch (error) {
        console.error('Error updating shift detail:', error);
        alert('Error updating shift detail.');
    }
}

async function deleteShiftDetail() {
    if (!selectedSchedule) {
        return;
    }

    if (!confirm('Are you sure you want to remove this shift assignment?')) {
        return;
    }

    try {
        const removeResult = await callBridge('removeSchedule', String(selectedSchedule.id));
        if (!removeResult.success) {
            alert('Error: ' + (removeResult.message || 'Failed to remove shift.'));
            return;
        }

        closeShiftDetailModal();
        await loadSchedules();
    } catch (error) {
        console.error('Error removing shift:', error);
        alert('Error removing shift assignment.');
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

function getDayOfWeekLabel(dayOfWeek) {
    const labels = {
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
        7: 'Sunday'
    };
    return labels[Number(dayOfWeek)] || 'Unknown';
}

function getDateString(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

function normalizeScheduleDate(value) {
    if (!value) return null;
    if (typeof value === 'string') {
        return value.slice(0, 10);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
}

function formatScheduleDateForDisplay(value) {
    const normalized = normalizeScheduleDate(value);
    if (!normalized) return '—';

    const date = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(date.getTime())) return normalized;

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function parseEntityId(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

console.log('Workshifts Admin JS loaded');
