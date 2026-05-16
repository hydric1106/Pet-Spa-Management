let currentUser = null;
let currentPage = 'dashboard';
let componentsInitialized = false;
let revenueRange = 'week';
let revenueChartInitialized = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
});

// Also initialize when bridge is ready (in case it fires after DOMContentLoaded)
document.addEventListener('bridgeReady', () => {
    initAdminDashboard();
});

async function initAdminDashboard() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;
    
    componentsInitialized = true;
    
    try {
        // Load sidebar and header components
        await loadComponents([
            { 
                path: '../components/admin_sidebar.html', 
                target: 'sidebar',
                callback: () => initSidebarNavigation('dashboard', handleNavigation)
            },
            { 
                path: '../components/admin_header.html', 
                target: 'header'
            }
        ]);
        
        // Initialize dashboard after components are loaded
        await initializeDashboard();
        setupLogout();
        
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
    }
}

/**
 * Handles sidebar navigation clicks.
 * @param {string} page - The page to navigate to
 */
function handleNavigation(page) {
    const pageRoutes = {
        'dashboard': 'dashboard.html',
        'bookings': 'bookings.html',
        'pets': 'pets.html',
        'services': 'services.html',
        'sales': 'store.html',
        'stock': 'stock.html',
        'billing-history': 'billing_history.html',
        'clients': 'clients.html',
        'staff': 'staff.html',
        'workshifts': 'workshifts.html'
    };
    
    const route = pageRoutes[page];
    if (route && window.javaBridge) {
        window.javaBridge.navigateTo(`admin/${route}`);
    }
}

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
        initRevenueChart();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
    }
}

function updateUserDisplay() {
    const userNameEl = document.getElementById('currentUserName');
    if (userNameEl && currentUser) {
        userNameEl.textContent = currentUser.fullName;
    }

    const welcomeNameEl = document.getElementById('welcomeUserName');
    if (welcomeNameEl && currentUser) {
        welcomeNameEl.textContent = currentUser.fullName;
    }
}

async function loadDashboardData() {
    try {
        // Load today's bookings
        const today = getTodayISO();
        const bookingsResult = await callBridge('getBookingsByDate', today);
        
        if (bookingsResult.success) {
            const todayBookingsEl = document.getElementById('todayBookings');
            if (todayBookingsEl) {
                todayBookingsEl.textContent = bookingsResult.data ? bookingsResult.data.length : 0;
            }
            
            // Update schedule display
            updateTodaySchedule(bookingsResult.data || []);
        }
        
        // Load customers count
        const customersResult = await callBridge('getAllCustomers');
        if (customersResult.success) {
            const totalCustomersEl = document.getElementById('totalCustomers');
            if (totalCustomersEl) {
                totalCustomersEl.textContent = customersResult.data ? customersResult.data.length : 0;
            }
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
            const activeStaffEl = document.getElementById('activeStaff');
            if (activeStaffEl) {
                activeStaffEl.textContent = staff.length;
            }
        }

        // Load retail + combined revenue summary
        const revenueResult = await callBridge('getTodayRevenueSummary');
        if (revenueResult.success && revenueResult.data) {
            const summary = revenueResult.data;

            const combinedRevenueEl = document.getElementById('combinedRevenueToday');
            if (combinedRevenueEl) {
                combinedRevenueEl.textContent = formatCurrency(summary.combinedRevenue || 0);
            }
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function initRevenueChart() {
    if (revenueChartInitialized) return;

    const rangeButtons = document.querySelectorAll('[data-revenue-range]');
    if (!rangeButtons.length) return;

    revenueChartInitialized = true;

    rangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const rangeKey = button.dataset.revenueRange || 'week';
            setRevenueRange(rangeKey);
        });
    });

    setRevenueRange(revenueRange);
}

async function setRevenueRange(rangeKey) {
    revenueRange = rangeKey || 'week';
    updateRevenueRangeButtons(revenueRange);
    await loadRevenueChart(revenueRange);
}

function updateRevenueRangeButtons(activeRange) {
    const rangeButtons = document.querySelectorAll('[data-revenue-range]');
    const activeClasses = ['bg-white', 'dark:bg-surface-dark', 'text-text-main', 'dark:text-white', 'shadow-sm'];
    const inactiveClasses = ['text-text-muted', 'dark:text-gray-300'];

    rangeButtons.forEach(button => {
        const isActive = button.dataset.revenueRange === activeRange;
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');

        activeClasses.forEach(className => button.classList.toggle(className, isActive));
        inactiveClasses.forEach(className => button.classList.toggle(className, !isActive));
    });
}

async function loadRevenueChart(rangeKey) {
    try {
        const result = await callBridge('getRevenueSeries', rangeKey);
        if (result.success) {
            renderRevenueChart(result.data || []);
        } else {
            renderRevenueChart([]);
        }
    } catch (error) {
        console.error('Error loading revenue chart:', error);
        renderRevenueChart([]);
    }
}

function renderRevenueChart(points) {
    const svg = document.getElementById('revenueChartSvg');
    const line = document.getElementById('revenueChartLine');
    const area = document.getElementById('revenueChartArea');
    const xAxis = document.getElementById('revenueChartXAxis');
    const dots = document.getElementById('revenueChartDots');
    const valueLabels = document.getElementById('revenueChartValueLabels');
    const grid = document.getElementById('revenueChartGrid');
    const emptyState = document.getElementById('revenueChartEmpty');
    const totalEl = document.getElementById('revenueChartTotal');

    if (!svg || !line || !area || !xAxis || !dots || !grid || !valueLabels) return;

    const safePoints = Array.isArray(points) ? points : [];
    if (safePoints.length === 0) {
        line.setAttribute('d', '');
        area.setAttribute('d', '');
        xAxis.innerHTML = '';
        dots.innerHTML = '';
        valueLabels.innerHTML = '';
        grid.innerHTML = '';
        if (totalEl) totalEl.textContent = '--';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const normalizedPoints = safePoints.map(point => ({
        label: String(point.label || ''),
        value: Number(point.combinedRevenue || 0),
        startDate: point.startDate || '',
        endDate: point.endDate || ''
    }));

    const total = normalizedPoints.reduce((sum, point) => sum + point.value, 0);
    if (totalEl) totalEl.textContent = formatCurrency(total);

    const bounds = svg.getBoundingClientRect();
    const width = Math.max(Math.round(bounds.width), 1);
    const height = Math.max(Math.round(bounds.height), 1);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const padding = {
        top: 36,
        right: 24,
        bottom: 36,
        left: 24
    };

    const maxValue = Math.max(...normalizedPoints.map(point => point.value), 1);
    const availableWidth = width - padding.left - padding.right;
    const availableHeight = height - padding.top - padding.bottom;
    const xStep = normalizedPoints.length > 1 ? availableWidth / (normalizedPoints.length - 1) : 0;

    const chartPoints = normalizedPoints.map((point, index) => {
        const x = padding.left + (xStep * index);
        const ratio = point.value / maxValue;
        const y = padding.top + ((1 - ratio) * availableHeight);
        return {
            ...point,
            x,
            y
        };
    });

    const linePath = chartPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

    const areaPath = [
        `M ${chartPoints[0].x} ${height - padding.bottom}`,
        ...chartPoints.map(point => `L ${point.x} ${point.y}`),
        `L ${chartPoints[chartPoints.length - 1].x} ${height - padding.bottom}`,
        'Z'
    ].join(' ');

    line.setAttribute('d', linePath);
    area.setAttribute('d', areaPath);

    grid.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const gridLines = 4;
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (availableHeight * i / gridLines);
        const gridLine = document.createElementNS(svgNS, 'line');
        gridLine.setAttribute('x1', padding.left);
        gridLine.setAttribute('x2', width - padding.right);
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('stroke', gridColor);
        gridLine.setAttribute('stroke-width', '1');
        gridLine.setAttribute('stroke-dasharray', '4 6');
        grid.appendChild(gridLine);
    }

    dots.innerHTML = '';
    valueLabels.innerHTML = '';
    xAxis.innerHTML = '';
    const valueLabelColor = isDark ? '#cbd5e1' : '#475569';
    const axisLabelColor = isDark ? '#94a3b8' : '#64748b';
    chartPoints.forEach(point => {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', '#ffffff');
        circle.setAttribute('stroke', '#13daec');
        circle.setAttribute('stroke-width', '2');

        const title = document.createElementNS(svgNS, 'title');
        title.textContent = `${point.label}: ${formatCurrency(point.value)}`;
        circle.appendChild(title);

        dots.appendChild(circle);

        const labelText = formatCompactCurrency(point.value);
        if (labelText) {
            const text = document.createElementNS(svgNS, 'text');
            const labelY = Math.max(point.y - 10, 12);
            text.setAttribute('x', point.x);
            text.setAttribute('y', labelY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'text-after-edge');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', '600');
            text.setAttribute('fill', valueLabelColor);
            text.textContent = labelText;
            valueLabels.appendChild(text);
        }
    });

    normalizedPoints.forEach((point, index) => {
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', chartPoints[index].x);
        text.setAttribute('y', height - 8);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', axisLabelColor);
        if (point.startDate) {
            text.textContent = point.label;
            text.setAttribute('data-start', point.startDate);
            text.setAttribute('data-end', point.endDate || '');
        } else {
            text.textContent = point.label;
        }
        xAxis.appendChild(text);
    });
}

function formatCompactCurrency(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return '';
    const abs = Math.abs(value);
    let formatted;

    if (abs >= 1_000_000_000) {
        formatted = (value / 1_000_000_000).toFixed(1);
        formatted = `${trimTrailingZero(formatted)}b`;
    } else if (abs >= 1_000_000) {
        formatted = (value / 1_000_000).toFixed(1);
        formatted = `${trimTrailingZero(formatted)}m`;
    } else if (abs >= 1_000) {
        formatted = (value / 1_000).toFixed(1);
        formatted = `${trimTrailingZero(formatted)}k`;
    } else {
        formatted = Math.round(value).toString();
    }

    return formatted;
}

function trimTrailingZero(value) {
    return value.replace(/\.0$/, '');
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
            break;
        case 'customers':
            break;
        case 'pets':
            break;
        case 'services':
            break;
        case 'staff':
            break;
        case 'schedules':
            break;
    }
}

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

window.showPage = showPage;
window.closeModal = closeModal;

console.log('Admin Dashboard JS loaded');
