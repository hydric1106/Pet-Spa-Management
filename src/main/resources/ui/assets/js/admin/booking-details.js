/**
 * PetSpa Admin - Booking Details
 * Loads and manages a single booking's details view
 */

let currentUser = null;
let currentBooking = null;
let servicesList = [];
let staffList = [];
let componentsInitialized = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initBookingDetailsPage();
});

document.addEventListener('bridgeReady', () => {
    initBookingDetailsPage();
});

async function initBookingDetailsPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;

    componentsInitialized = true;

    try {
        // Load sidebar only — this page has a custom header (not admin_header component)
        await loadComponents([
            {
                path: '../components/admin_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('bookings', handleNavigation)
            }
        ]);

        await initializePage();
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing booking details page:', error);
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

        // Load dropdowns in parallel with booking data
        await Promise.all([
            loadBookingDetails(),
            loadServices(),
            loadStaffList()
        ]);

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
// DATA LOADING
// =============================================================================

async function loadBookingDetails() {
    const bookingId = sessionStorage.getItem('selectedBookingId');
    if (!bookingId) {
        window.javaBridge.navigateTo('admin/bookings.html');
        return;
    }

    try {
        const result = await callBridge('getBookingById', Number(bookingId));
        if (result.success && result.data) {
            currentBooking = result.data;
            populateForm(currentBooking);
        } else {
            console.error('Failed to load booking:', result.message);
            window.javaBridge.navigateTo('admin/bookings.html');
        }
    } catch (error) {
        console.error('Error loading booking details:', error);
    }
}

async function loadServices() {
    try {
        const result = await callBridge('getAllServices');
        if (result.success && result.data) {
            servicesList = result.data;
            populateServiceSelect();
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

async function loadStaffList() {
    try {
        const result = await callBridge('getAllUsers');
        if (result.success && result.data) {
            staffList = result.data.filter(u => u.role === 'STAFF' && u.isActive !== false);
            populateStaffSelect();
        }
    } catch (error) {
        console.error('Error loading staff list:', error);
    }
}

// =============================================================================
// POPULATE FORM
// =============================================================================

function populateForm(booking) {
    // Booking ID badge
    const badge = document.getElementById('bookingIdBadge');
    if (badge) badge.textContent = `#BK-${String(booking.id).padStart(4, '0')}`;

    // Pet info
    const petName = document.getElementById('petName');
    if (petName) petName.textContent = booking.petName || '—';

    const petBreed = document.getElementById('petBreed');
    if (petBreed) petBreed.textContent = booking.petSpecies || '—';

    const petOwner = document.getElementById('petOwner');
    if (petOwner) petOwner.textContent = booking.customerName ? `Owner: ${booking.customerName}` : '—';

    // Date & time
    const dateTimeEl = document.getElementById('bookingDateTime');
    if (dateTimeEl) {
        dateTimeEl.value = formatBookingDateTime(booking.bookingDate, booking.bookingTime);
    }

    // Status
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect && booking.status) {
        statusSelect.value = booking.status;
    }

    // Special instructions (not stored in current DTO — leave blank)
    const notes = document.getElementById('specialInstructions');
    if (notes) notes.value = '';

    // Health notes (not stored in current DTO — show default)
    const healthText = document.getElementById('healthNotesText');
    if (healthText) healthText.textContent = 'No health notes on file.';

    // Estimated duration from first service
    const durationEl = document.getElementById('estimatedDuration');
    if (durationEl) {
        const firstService = booking.services && booking.services[0];
        durationEl.value = firstService?.durationMinutes
            ? `${firstService.durationMinutes} minutes`
            : '—';
    }

    // Total price
    const priceEl = document.getElementById('totalPrice');
    if (priceEl) {
        priceEl.value = booking.totalPrice != null
            ? `$${Number(booking.totalPrice).toFixed(2)}`
            : '—';
    }

    // Pre-select service and staff after dropdowns are populated
    preselectDropdowns(booking);
}

function populateServiceSelect() {
    const select = document.getElementById('serviceSelect');
    if (!select) return;

    // Keep the placeholder option, remove others
    select.innerHTML = '<option value="">Select service...</option>';
    servicesList.forEach(service => {
        const opt = document.createElement('option');
        opt.value = service.id;
        opt.textContent = service.name;
        select.appendChild(opt);
    });

    // Re-apply selection if booking is already loaded
    if (currentBooking) preselectDropdowns(currentBooking);
}

function populateStaffSelect() {
    const select = document.getElementById('staffSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Select staff...</option>';
    staffList.forEach(staff => {
        const opt = document.createElement('option');
        opt.value = staff.id;
        opt.textContent = staff.fullName || staff.username;
        select.appendChild(opt);
    });

    if (currentBooking) preselectDropdowns(currentBooking);
}

function preselectDropdowns(booking) {
    // Pre-select service (use first service in booking.services)
    const serviceSelect = document.getElementById('serviceSelect');
    if (serviceSelect && booking.services && booking.services.length > 0) {
        const firstServiceId = String(booking.services[0].serviceId);
        if ([...serviceSelect.options].some(o => o.value === firstServiceId)) {
            serviceSelect.value = firstServiceId;
        }
    }

    // Pre-select staff
    const staffSelect = document.getElementById('staffSelect');
    if (staffSelect && booking.staffId) {
        const staffId = String(booking.staffId);
        if ([...staffSelect.options].some(o => o.value === staffId)) {
            staffSelect.value = staffId;
        }
    }
}

// =============================================================================
// ACTIONS
// =============================================================================

async function handleUpdateBooking() {
    if (!currentBooking) return;

    const statusSelect = document.getElementById('statusSelect');
    const newStatus = statusSelect?.value;
    if (!newStatus) return;

    try {
        const result = await callBridge('updateBookingStatus', currentBooking.id, newStatus);
        if (result.success) {
            currentBooking = result.data;
            alert('Booking updated successfully.');
        } else {
            alert('Failed to update booking: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating booking:', error);
    }
}

async function handleCancelBooking() {
    if (!currentBooking) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
        const result = await callBridge('cancelBooking', currentBooking.id, '');
        if (result.success) {
            alert('Booking cancelled.');
            window.javaBridge.navigateTo('admin/bookings.html');
        } else {
            alert('Failed to cancel booking: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
    }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.javaBridge.navigateTo('admin/bookings.html');
    });

    document.getElementById('updateBookingBtn')?.addEventListener('click', handleUpdateBooking);
    document.getElementById('cancelBookingBtn')?.addEventListener('click', handleCancelBooking);
}

// =============================================================================
// USER DISPLAY
// =============================================================================

function updateUserDisplay() {
    const nameEl = document.getElementById('currentUserName');
    if (nameEl && currentUser) {
        nameEl.textContent = currentUser.fullName || currentUser.username || '—';
    }
}

// =============================================================================
// HELPERS
// =============================================================================

function formatBookingDateTime(date, time) {
    if (!date) return '—';
    try {
        // date is "YYYY-MM-DD", time is "HH:MM:SS" or "HH:MM"
        const d = new Date(date + 'T' + (time || '00:00'));
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ', ' + d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return `${date}${time ? ' ' + time : ''}`;
    }
}
