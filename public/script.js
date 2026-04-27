// Elements
const loginScreen = document.getElementById('login-screen');
const mainContent = document.getElementById('main-content');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const currentPageTitle = document.getElementById('current-page-title');
const displayUsername = document.getElementById('display-username');
const displayRole = document.getElementById('display-role');
const userInitials = document.getElementById('user-initials');

// RFID & Web User Lists
const rfidUsersList = document.getElementById('users-list');
const webUsersList = document.getElementById('web-users-list');
const touchGauge = document.getElementById('touch-gauge');
const thresholdMarker = document.getElementById('threshold-marker');
const currentTouchVal = document.getElementById('current-touch-val');
const displayThresholdVal = document.getElementById('display-threshold-val');
const thresholdSlider = document.getElementById('threshold-slider');
const saveThresholdBtn = document.getElementById('save-threshold-btn');

// Logs
const logTypeFilter = document.getElementById('log-type-filter');
const logDateFilter = document.getElementById('log-date-filter');
const refreshLogsBtn = document.getElementById('refresh-logs-btn');
const logViewer = document.getElementById('log-viewer');

// Socket.io
let socket = null;
let currentThreshold = 10000;


// Auth State
let currentUser = null;

// --- AUTH LOGIC ---
async function checkAuth() {
    try {
        const response = await fetch('/api/auth-check');
        const data = await response.json();
        if (data.loggedIn) {
            setupUserSession(data.user);
        } else {
            showLogin();
        }
    } catch (error) {
        showLogin();
    }
}

function setupUserSession(user) {
    currentUser = user;
    loginScreen.style.display = 'none';
    mainContent.style.display = 'flex';

    // Update Profile UI
    displayUsername.textContent = user.username;
    displayRole.textContent = user.role === 'admin' ? 'Administrator' : 'Regular User';
    userInitials.textContent = user.username.substring(0, 2).toUpperCase();

    if (user.role === 'admin') {
        document.body.classList.add('is-admin');
        fetchRfidUsers();
        fetchWebUsers();
    } else {
        document.body.classList.remove('is-admin');
        switchTab('dashboard'); // Force dashboard for non-admins
    }

    fetchDoorStatus();
    initSocket();
}

function initSocket() {
    if (socket) return;
    socket = io();

    socket.on('touchValue', (data) => {
        const value = data.value;
        currentTouchVal.textContent = value;
        const percentage = Math.min((value / 30000) * 100, 100);
        touchGauge.style.width = percentage + '%';

        // Visual alert color
        if (value > currentThreshold) {
            touchGauge.style.background = 'linear-gradient(90deg, #3fb950, #238636)';
        } else {
            touchGauge.style.background = 'linear-gradient(90deg, var(--primary), #a855f7)';
        }
    });

    socket.on('config', (data) => {
        updateThresholdUI(data.touchThreshold);
    });
}

function updateThresholdUI(value) {
    currentThreshold = value;
    displayThresholdVal.textContent = value;
    thresholdSlider.value = value;
    const percentage = Math.min((value / 30000) * 100, 100);
    thresholdMarker.style.left = percentage + '%';
}

thresholdSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    displayThresholdVal.textContent = value;
    const percentage = (value / 30000) * 100;
    thresholdMarker.style.left = percentage + '%';
});

saveThresholdBtn.addEventListener('click', async () => {
    const value = thresholdSlider.value;
    try {
        const response = await fetch('/api/config/threshold', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threshold: value })
        });
        if (response.ok) {
            alert('Threshold saved successfully');
        } else {
            alert('Failed to save threshold');
        }
    } catch (error) {
        alert('Error saving threshold');
    }
});


function showLogin() {
    loginScreen.style.display = 'flex';
    mainContent.style.display = 'none';
    currentUser = null;
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember').checked;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, remember })
        });
        const data = await response.json();
        if (response.ok) {
            setupUserSession(data.user);
        } else {
            loginError.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        loginError.textContent = 'Server connection error';
    }
});

logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    showLogin();
});

// --- TAB NAVIGATION ---
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

function switchTab(targetId) {
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.target === targetId);
    });
    tabContents.forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${targetId}`);
    });

    const titles = {
        dashboard: 'Dashboard',
        cards: 'RFID Card Management',
        accounts: 'Web Access Accounts'
    };
    currentPageTitle.textContent = titles[targetId] || 'Dashboard';

    // Close sidebar on mobile after selection
    if (window.innerWidth <= 1024) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
}

mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const target = item.getAttribute('data-target');
        switchTab(target);
        if (target === 'logs') fetchLogs();
    });
});

if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', fetchLogs);
}

if (logTypeFilter) {
    logTypeFilter.addEventListener('change', fetchLogs);
}

if (logDateFilter) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    logDateFilter.value = today;
    logDateFilter.addEventListener('change', fetchLogs);
}

// --- RFID USER MANAGEMENT ---
async function fetchRfidUsers() {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        renderRfidUsers(users);
        document.getElementById('stat-users').textContent = users.length;
    } catch (error) {
        console.error('Error fetching RFID users:', error);
    }
}

function renderRfidUsers(users) {
    rfidUsersList.innerHTML = '';
    
    // Sort by count descending (Leaderboard style)
    const sortedUsers = [...users].sort((a, b) => (b.count || 0) - (a.count || 0));

    // Update Dashboard Leaderboard
    const dashboardLeaderboard = document.getElementById('dashboard-leaderboard');
    if (dashboardLeaderboard) {
        dashboardLeaderboard.innerHTML = '';
        sortedUsers.slice(0, 5).forEach((user, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="lb-rank rank-${index + 1}">${index + 1}</div>
                <div class="lb-name">${user.name}</div>
                <div class="lb-count">${user.count || 0}</div>
            `;
            dashboardLeaderboard.appendChild(item);
        });
    }

    sortedUsers.forEach(user => {
        const tr = document.createElement('tr');
        const isEnabled = user.enabled !== false;
        const hasSchedule = user.schedule && user.schedule.length > 0;

        tr.innerHTML = `
            <td>
                <strong>${user.name}</strong>
                ${hasSchedule ? `
                    <div class="schedule-badge" title="Has active schedule">
                        <i class="fas fa-clock"></i> Scheduled
                    </div>
                ` : ''}
            </td>
            <td><code>${user.id}</code></td>
            <td><span class="usage-badge">${user.count || 0}</span></td>
            <td>
                <label class="ios-switch small">
                    <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleRfidUser('${user.id}')">
                    <span class="slider"></span>
                </label>
            </td>
            <td class="text-right">
                <button class="btn-logout" onclick="openScheduleModal('${user.id}', '${user.name}')" title="Manage Schedule" style="margin-right: 0.5rem; color: var(--warning);">
                    <i class="fas fa-calendar-days"></i>
                </button>
                <button class="btn-logout" onclick="deleteRfidUser('${user.id}')" title="Delete">
                    <i class="fas fa-trash-can"></i>
                </button>
            </td>
        `;
        rfidUsersList.appendChild(tr);
    });
}

// --- SCHEDULE LOGIC ---
const scheduleModal = document.getElementById('schedule-modal');
const addScheduleList = document.getElementById('add-schedule-list');
const modalScheduleList = document.getElementById('modal-schedule-list');
let currentScheduleUserId = null;

function createScheduleSlot(container, start = "12:00", end = "16:00") {
    const slot = document.createElement('div');
    slot.className = 'schedule-slot';
    slot.innerHTML = `
        <input type="time" class="slot-start" value="${start}">
        <span>to</span>
        <input type="time" class="slot-end" value="${end}">
        <button type="button" class="btn-remove-slot"><i class="fas fa-times"></i></button>
    `;
    slot.querySelector('.btn-remove-slot').onclick = () => slot.remove();
    container.appendChild(slot);
}

document.getElementById('add-slot-btn').onclick = () => createScheduleSlot(addScheduleList);
document.getElementById('modal-add-slot-btn').onclick = () => createScheduleSlot(modalScheduleList);

async function openScheduleModal(id, name) {
    currentScheduleUserId = id;
    document.getElementById('schedule-user-name').textContent = name;
    modalScheduleList.innerHTML = '';
    document.getElementById('schedule-action-password').value = '';

    const user = (await (await fetch('/api/users')).json()).find(u => u.id === id);
    if (user && user.schedule) {
        user.schedule.forEach(slot => createScheduleSlot(modalScheduleList, slot.start, slot.end));
    }

    scheduleModal.classList.add('active');
}

document.getElementById('save-schedule-btn').onclick = async () => {
    const slots = Array.from(modalScheduleList.querySelectorAll('.schedule-slot')).map(slot => ({
        start: slot.querySelector('.slot-start').value,
        end: slot.querySelector('.slot-end').value
    }));
    const actionPassword = document.getElementById('schedule-action-password').value;

    const response = await fetch(`/api/users/${currentScheduleUserId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: slots, actionPassword })
    });

    if (response.ok) {
        scheduleModal.classList.remove('active');
        fetchRfidUsers();
    } else {
        const data = await response.json();
        alert(data.error || 'Failed to save schedule');
    }
};

window.toggleRfidUser = async (id) => {
    try {
        const response = await fetch(`/api/users/${id}/toggle`, { method: 'PATCH' });
        if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'Failed to toggle access');
            fetchRfidUsers(); // Refresh to revert UI
        }
    } catch (error) {
        console.error('Error toggling RFID user:', error);
        fetchRfidUsers();
    }
};

// --- WEB USER MANAGEMENT ---
async function fetchWebUsers() {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
        const response = await fetch('/api/web-users');
        const users = await response.json();
        renderWebUsers(users);
    } catch (error) {
        console.error('Error fetching web users:', error);
    }
}

function renderWebUsers(users) {
    webUsersList.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${user.username}</strong></td>
            <td><span class="role-badge">${user.role}</span></td>
            <td class="text-right">
                ${user.username !== 'admin' ? `
                    <button class="btn-logout" onclick="deleteWebUser('${user.username}')" title="Delete">
                        <i class="fas fa-trash-can"></i>
                    </button>
                ` : ''}
            </td>
        `;
        webUsersList.appendChild(tr);
    });
}

// --- DOOR CONTROLS ---
const doorVisual = document.getElementById('door-visual-state');
const openDoorBtn = document.getElementById('open-door-btn');
const closeDoorBtn = document.getElementById('close-door-btn');
const holdOpenToggle = document.getElementById('hold-open-toggle');

function updateDoorUI(isOpen) {
    doorVisual.innerHTML = isOpen ? '<i class="fas fa-unlock"></i>' : '<i class="fas fa-lock"></i>';
    doorVisual.classList.toggle('open', isOpen);
}

openDoorBtn.addEventListener('click', async () => {
    await fetch('/api/door/open', { method: 'GET' });
    updateDoorUI(true);
});

closeDoorBtn.addEventListener('click', async () => {
    await fetch('/api/door/close', { method: 'GET' });
    updateDoorUI(false);
});

holdOpenToggle.addEventListener('change', async () => {
    const enabled = holdOpenToggle.checked;
    await fetch(`/api/door/hold?enabled=${enabled}`, {
        method: 'GET'
    });
});

async function fetchDoorStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        holdOpenToggle.checked = data.holdOpen;
        if (data.holdOpen) updateDoorUI(true);
    } catch (error) { }
}

// --- MODAL LOGIC ---
const modals = {
    add: document.getElementById('add-modal'),
    web: document.getElementById('web-user-modal'),
    schedule: document.getElementById('schedule-modal')
};

document.getElementById('open-add-modal').addEventListener('click', () => modals.add.classList.add('active'));
document.getElementById('open-web-user-modal').addEventListener('click', () => modals.web.classList.add('active'));

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        Object.values(modals).forEach(m => m.classList.remove('active'));
    });
});

// --- FORM SUBMISSIONS ---
document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const slots = Array.from(addScheduleList.querySelectorAll('.schedule-slot')).map(slot => ({
        start: slot.querySelector('.slot-start').value,
        end: slot.querySelector('.slot-end').value
    }));

    const payload = {
        name: document.getElementById('user-name').value,
        id: document.getElementById('user-id').value,
        actionPassword: document.getElementById('action-password').value,
        schedule: slots
    };
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (response.ok) {
        modals.add.classList.remove('active');
        addScheduleList.innerHTML = '';
        fetchRfidUsers();
    } else {
        const data = await response.json();
        alert(data.error);
    }
});

document.getElementById('add-web-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        username: document.getElementById('web-username').value,
        password: document.getElementById('web-password').value,
        role: document.getElementById('web-role').value
    };
    const response = await fetch('/api/web-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (response.ok) {
        modals.web.classList.remove('active');
        fetchWebUsers();
    } else {
        const data = await response.json();
        alert(data.error);
    }
});

// --- DELETE ACTIONS ---
window.deleteRfidUser = async (id) => {
    const actionPassword = prompt('Enter action password:');
    if (!actionPassword) return;
    await fetch(`/api/users/${id}?actionPassword=${encodeURIComponent(actionPassword)}`, { method: 'DELETE' });
    fetchRfidUsers();
};

window.deleteWebUser = async (username) => {
    if (!confirm(`Delete web account ${username}?`)) return;
    await fetch(`/api/web-users/${username}`, { method: 'DELETE' });
    fetchWebUsers();
};

// --- LAST CARD POLLING ---
async function checkLastCard() {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
        const response = await fetch('/api/last-card');
        const data = await response.json();
        const container = document.getElementById('last-card-container');
        const idSpan = document.getElementById('last-card-id');

        if (data.id) {
            idSpan.textContent = data.id;
            container.style.display = 'flex';
        }
    } catch (error) { }
}

document.getElementById('quick-add-btn').addEventListener('click', () => {
    const id = document.getElementById('last-card-id').textContent;
    document.getElementById('user-id').value = id;
    modals.add.classList.add('active');
    document.getElementById('user-name').focus();
});

// --- POLLING ---
setInterval(() => {
    if (currentUser && currentUser.role === 'admin') {
        fetchRfidUsers();
        checkLastCard();
    }
}, 5000);

// Initial load
checkAuth();

// --- LOGS ---
async function fetchLogs() {
    if (!logViewer) return;
    
    const type = logTypeFilter.value;
    const date = logDateFilter ? logDateFilter.value : '';
    try {
        const response = await fetch(`/api/logs?type=${type}&date=${date}`);
        const data = await response.json();
        
        if (data.logs) {
            logViewer.innerHTML = '';
            data.logs.forEach(line => {
                const div = document.createElement('div');
                div.className = 'log-line';
                
                // Add color classes based on content
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes('[error]') || lowerLine.includes('❌')) div.classList.add('error');
                else if (lowerLine.includes('[warn]') || lowerLine.includes('⚠️')) div.classList.add('warn');
                else if (lowerLine.includes('[info]') || lowerLine.includes('🌐')) div.classList.add('info');
                else if (lowerLine.includes('✅') || lowerLine.includes('🚪')) div.classList.add('success');
                
                // Specific types for KART and DOOR
                if (lowerLine.includes('[kart]')) div.classList.add('kart');
                if (lowerLine.includes('[door]')) div.classList.add('door');

                div.textContent = line;
                logViewer.appendChild(div);
            });
            
            if (data.logs.length === 0) {
                logViewer.innerHTML = '<div class="log-line info">No logs found for this period.</div>';
            }
            
            // Auto-scroll to the bottom of the log viewer to see the newest items
            logViewer.scrollTop = logViewer.scrollHeight;
        }
    } catch (error) {
        console.error('Logs fetch error:', error);
    }
}

function switchTab(tabId) {
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.target === tabId);
    });
    tabContents.forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${tabId}`);
    });

    const titles = {
        dashboard: 'Dashboard',
        cards: 'RFID Card Management',
        accounts: 'Web Access Accounts'
    };
    currentPageTitle.textContent = titles[tabId] || 'Dashboard';

    // Close sidebar on mobile after selection
    if (window.innerWidth <= 1024) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
}
