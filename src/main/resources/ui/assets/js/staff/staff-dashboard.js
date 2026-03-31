let currentUser = null;
let isInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    initStaffDashboard();
});

document.addEventListener('bridgeReady', () => {
    initStaffDashboard();
});

async function initStaffDashboard() {
    if (isInitialized || !window.javaBridge) return;
    isInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/staff_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('dashboard', handleSidebarNavigation)
            },
            {
                path: '../components/admin_header.html',
                target: 'header'
            }
        ]);

        const userResult = await callBridge('getCurrentUser');
        if (!userResult.success || !userResult.data) {
            window.javaBridge.navigateTo('index.html');
            return;
        }

        currentUser = userResult.data;
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Staff Dashboard';

        const userNameEl = document.getElementById('currentUserName');
        if (userNameEl) {
            userNameEl.textContent = currentUser.fullName || currentUser.email || 'Staff';
        }

        setupLogout();
    } catch (error) {
        console.error('Failed to initialize staff dashboard:', error);
        isInitialized = false;
    }
}

function handleSidebarNavigation(page) {
    const routes = {
        dashboard: 'dashboard.html',
        'my-tasks': 'my_tasks.html',
        'my-schedule': 'my_schedule.html'
    };

    const route = routes[page];
    if (route) {
        window.javaBridge.navigateTo(`staff/${route}`);
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn || logoutBtn.dataset.bound === 'true') return;

    logoutBtn.dataset.bound = 'true';
    logoutBtn.addEventListener('click', async () => {
        await callBridge('logout');
        window.javaBridge.navigateTo('index.html');
    });
}

console.log('Staff dashboard static page initialized');
