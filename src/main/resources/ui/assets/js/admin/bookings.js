/**
 * PetSpa Admin - Bookings Calendar
 * Handles the monthly calendar view and booking management
 */

let currentUser = null;
let bookings = [];
let componentsInitialized = false;

// Current calendar state
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initBookingsPage();
});

document.addEventListener('bridgeReady', () => {
    initBookingsPage();
});

async function initBookingsPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;

    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/admin_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('bookings', handleNavigation)
            },
            {
                path: '../components/admin_header.html',
                target: 'header'
            }
        ]);

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Manage Bookings';

        await initializePage();
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing bookings page:', error);
    }
}

async function initializePage() {
    try {
        await waitForBridge();

        const userResult = await callBridge('getCurrentUser');
        if (userResult.success) {
            currentUser = userResult.data;
            updateUserDisplay();
        } else {
            window.javaBridge.navigateTo('index.html');
            return;
        }

        renderCalendar();
        await loadBookings();

    } catch (error) {
        console.error('Error initializing page:', error);
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
// CALENDAR RENDERING
// =============================================================================

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    // Blank cells before first day
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day p-2 bg-slate-50/50 dark:bg-gray-900/20';
        grid.appendChild(blank);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
        grid.appendChild(createDayCell(day, isToday));
    }

    // Fill remaining cells so grid has complete rows
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remaining; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day p-2 bg-slate-50/50 dark:bg-gray-900/20';
        grid.appendChild(blank);
    }

    updateMonthDisplay();
}

function createDayCell(day, isToday) {
    const cell = document.createElement('div');
    cell.className = isToday
        ? 'calendar-day p-2 bg-primary/5 hover:bg-primary/10 transition-colors'
        : 'calendar-day p-2 hover:bg-slate-50 dark:hover:bg-gray-800/10 transition-colors';
    cell.dataset.day = day;

    const dateStr = getDateString(currentYear, currentMonth, day);
    cell.dataset.date = dateStr;

    const dayLabel = document.createElement('span');
    dayLabel.className = isToday
        ? 'text-sm font-bold text-primary mb-2 block'
        : 'text-sm font-medium text-text-muted mb-2 block';
    dayLabel.textContent = day;
    cell.appendChild(dayLabel);

    const bookingsContainer = document.createElement('div');
    bookingsContainer.className = 'space-y-1';
    bookingsContainer.id = `day-${dateStr}`;
    cell.appendChild(bookingsContainer);

    return cell;
}

function updateMonthDisplay() {
    const el = document.getElementById('currentMonth');
    if (!el) return;
    el.textContent = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
}

function getDateString(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

// =============================================================================
// BOOKING DATA
// =============================================================================

async function loadBookings() {
    try {
        const result = await callBridge('getAllBookings');
        if (result.success && result.data) {
            bookings = result.data;
            renderBookingsOnCalendar();
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

function renderBookingsOnCalendar() {
    // Clear existing booking blocks
    document.querySelectorAll('[id^="day-"]').forEach(el => (el.innerHTML = ''));

    bookings.forEach(booking => {
        const dateStr = booking.bookingDate || booking.date;
        if (!dateStr) return;

        const container = document.getElementById(`day-${dateStr}`);
        if (container) {
            container.appendChild(createBookingBlock(booking));
        }
    });
}

function createBookingBlock(booking) {
    const block = document.createElement('div');
    block.className =
        'px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary-content ' +
        'text-[11px] font-semibold truncate hover:bg-primary/20 transition-all cursor-pointer';

    const petName = booking.petName || booking.pet?.name || '—';
    const serviceName = booking.serviceName || booking.service?.name || '—';
    block.textContent = `${petName} • ${serviceName}`;

    block.addEventListener('click', () => navigateToBookingDetail(booking.id));
    return block;
}

function navigateToBookingDetail(bookingId) {
    sessionStorage.setItem('selectedBookingId', bookingId);
    window.javaBridge.navigateTo('admin/booking_details.html');
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
        loadBookings();
    });

    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
        loadBookings();
    });

    document.getElementById('todayBtn')?.addEventListener('click', () => {
        const now = new Date();
        currentYear = now.getFullYear();
        currentMonth = now.getMonth();
        renderCalendar();
        loadBookings();
    });

    document.getElementById('newBookingBtn')?.addEventListener('click', () => {
        // Navigate to new booking form when implemented
        console.log('New booking clicked');
    });

    setupLogout();
}

// =============================================================================
// USER DISPLAY / LOGOUT
// =============================================================================

function updateUserDisplay() {
    const nameEl = document.getElementById('currentUserName');
    if (nameEl && currentUser) {
        nameEl.textContent = currentUser.fullName || currentUser.username || '—';
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await callBridge('logout');
            window.javaBridge.navigateTo('index.html');
        });
    }
}
