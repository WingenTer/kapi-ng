const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');


// CONFIGURATION
const PORT_PATH = "/dev/serial/by-id/usb-Arduino__www.arduino.cc__0042_85430353531351405022-if00";
const BAUD_RATE = 9600;
const WEB_PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const WEB_USERS_FILE = path.join(__dirname, 'web_users.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR);
}

function log(message, type = 'INFO') {
    const now = new Date();
    const timestamp = now.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
    
    // Format: YYYY-MM-DD
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }); 
    const dayDir = path.join(LOGS_DIR, dateStr);

    if (!fs.existsSync(dayDir)) {
        fs.mkdirSync(dayDir, { recursive: true });
    }

    const logEntry = `[${timestamp}] [${type}] ${message}`;

    if (type === 'ERROR') {
        console.error(logEntry);
    } else {
        console.log(logEntry);
    }

    // Determine target log file name based on type
    let logFilename = 'other.log';
    const typeUpper = type.toUpperCase();

    if (['DOOR', 'STATS', 'RFID', 'KART'].includes(typeUpper)) {
        logFilename = 'girisler.log';
    } else if (['WEB', 'AUTH', 'API'].includes(typeUpper)) {
        logFilename = 'web.log';
    } else if (['SYNC', 'CONFIG', 'UPDATE', 'SYSTEM'].includes(typeUpper)) {
        logFilename = 'guncelleme.log';
    }

    const typeLogFile = path.join(dayDir, logFilename);
    const allLogFile = path.join(dayDir, `all.log`);

    fs.appendFileSync(typeLogFile, logEntry + '\n');
    fs.appendFileSync(allLogFile, logEntry + '\n');
}

// Load Config (for action password)
let config = {
    actionPasswordHash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
    touchThreshold: 10000
};

if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

// Load Web Users
let webUsers = [];
if (fs.existsSync(WEB_USERS_FILE)) {
    webUsers = JSON.parse(fs.readFileSync(WEB_USERS_FILE, 'utf8'));
} else {
    // Default admin:admin
    webUsers = [{
        username: "admin",
        passwordHash: crypto.createHash('sha256').update('admin').digest('hex'),
        role: "admin"
    }];
    fs.writeFileSync(WEB_USERS_FILE, JSON.stringify(webUsers, null, 4));
}

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

app.use(express.json());
app.use(session({
    secret: 'kapi-ng-ultra-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Auth Middlewares
const requireAuth = (req, res, next) => {
    if (req.session.user) next();
    else res.status(401).json({ error: 'Unauthorized' });
};

const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') next();
    else res.status(403).json({ error: 'Forbidden: Admin access required' });
};

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Load RFID users
let rfidUsers = [];
try {
    if (fs.existsSync(USERS_FILE)) {
        rfidUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
} catch (err) {
    log('❌ Error loading RFID users: ' + err.message, 'ERROR');
}

let port;
let parser;

function initSerial() {
    log(`🚀 Attempting to open Serial Port: ${PORT_PATH}`);
    
    port = new SerialPort({ 
        path: PORT_PATH, 
        baudRate: BAUD_RATE,
        autoOpen: false 
    });

    parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.open((err) => {
        if (err) {
            log(`❌ Error opening port: ${err.message}`, 'ERROR');
            setTimeout(initSerial, 5000); // Retry after 5s
            return;
        }
    });

    port.on('open', () => {
        log('✅ Serial Port Opened');
        lastSyncedState = "";
        isStabilizing = true;
        
        // Wait 2 seconds for Arduino to stabilize before first sync
        // This ensures setup() is fully finished on Arduino
        setTimeout(() => {
            log('🚀 Performing initial full sync after stabilization...');
            isStabilizing = false;
            syncToArduino(true);
        }, 2000);
    });

    port.on('close', () => {
        log('⚠️ Serial Port Closed. Retrying in 5 seconds...', 'ERROR');
        lastSyncedState = ""; // Ensure we sync again when it reopens
        setTimeout(initSerial, 5000);
    });

    port.on('error', (err) => {
        log(`❌ Serial Port Error: ${err.message}`, 'ERROR');
    });

    parser.on('data', (data) => {
        if (!data.startsWith('TCH:')) {
            const logType = (data.includes('Access granted:') || data.includes('New card:')) ? 'KART' : 'INFO';
            log(`📥 Arduino: ${data}`, logType);
        }

        // Only handle REQ_USERS if we haven't just opened the port
        // to avoid race conditions with the 2-second initial sync
        if (data.includes('REQ_USERS')) {
            syncToArduino(); 
        }
        if (data.includes('New card:')) {
            const parts = data.split(':');
            if (parts.length > 1) lastScannedCard = parts[1].trim();
        }
        if (data.includes('Access granted:')) {
            const now = Date.now();
            if (lastScannedCard && (now - lastScanTime > DEBOUNCE_TIME)) {
                lastScanTime = now;
                const user = rfidUsers.find(u => u.id === lastScannedCard);
                if (user) {
                    user.count = (user.count || 0) + 1;
                    user.lastRead = now;
                    saveRfidUsers();
                    log(`📈 Usage incremented for ${user.name} (Total: ${user.count})`, 'KART');
                }
            }
        }
        if (data.startsWith('TCH:')) {
            const value = data.split(':')[1];
            io.emit('touchValue', { value: parseInt(value) });
        }
    });
}

// Helper to write to serial with error handling
function serialWrite(data) {
    if (port && port.isOpen) {
        port.write(data);
    } else {
        log(`📡 Cannot send data: Serial port is closed.`, 'ERROR');
    }
}

initSerial();

function saveRfidUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(rfidUsers, null, 4));
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
}

function saveWebUsers() {

    fs.writeFileSync(WEB_USERS_FILE, JSON.stringify(webUsers, null, 4));
}

function isUserAllowedNow(user) {
    if (user.enabled === false) return false;
    if (!user.schedule || user.schedule.length === 0) return true; // No schedule means always allowed

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return user.schedule.some(slot => {
        const [startH, startM] = slot.start.split(':').map(Number);
        const [endH, endM] = slot.end.split(':').map(Number);
        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;

        if (startTime <= endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Overnight slot (e.g., 22:00 - 02:00)
            return currentTime >= startTime || currentTime <= endTime;
        }
    });
}

let lastSyncedState = "";
let isStabilizing = false;

function syncToArduino(force = false) {
    const allowedUsers = rfidUsers.filter(isUserAllowedNow);
    const syncData = {
        users: allowedUsers.map(u => ({ id: u.id, name: u.name })),
        threshold: config.touchThreshold
    };
    const currentState = JSON.stringify(syncData);

    if (!force && currentState === lastSyncedState) {
        return;
    }
    
    // Only proceed if not in stabilization or if explicitly forced
    if (!force && isStabilizing) {
        return;
    }

    lastSyncedState = currentState;

    log('🔄 Syncing RFID list to Arduino...');
    serialWrite('CLR\n');
    
    allowedUsers.forEach((user, index) => {
        setTimeout(() => {
            const cmd = `USR:${user.id}:${user.name}\n`;
            serialWrite(cmd);
        }, (index + 1) * 150);
    });

    // Also sync threshold after all users are sent
    setTimeout(() => {
        serialWrite(`SET_TCH:${config.touchThreshold}\n`);
    }, (allowedUsers.length + 1) * 150);
}


// Periodic sync every minute to handle schedule changes
setInterval(syncToArduino, 60000);

// Global State
let lastScannedCard = null;
let lastScanTime = 0;
const DEBOUNCE_TIME = 2000; // 2 seconds

parser.on('data', (data) => {
    if (!data.startsWith('TCH:')) {
        log(`📥 Arduino: ${data}`);
    }

    if (data.includes('REQ_USERS')) syncToArduino();
    if (data.includes('New card:')) {
        const parts = data.split(':');
        if (parts.length > 1) lastScannedCard = parts[1].trim();
    }
    if (data.includes('Access granted:')) {
        const now = Date.now();
        if (lastScannedCard && (now - lastScanTime > DEBOUNCE_TIME)) {
            lastScanTime = now;
            const user = rfidUsers.find(u => u.id === lastScannedCard);
            if (user) {
                user.count = (user.count || 0) + 1;
                user.lastRead = Date.now();
                saveRfidUsers();
                log(`📈 Usage incremented for ${user.name} (Total: ${user.count})`, 'STATS');
            }
        }
    }
    if (data.startsWith('TCH:')) {
        const value = data.split(':')[1];
        io.emit('touchValue', { value: parseInt(value) });
    }
});

io.on('connection', (socket) => {
    log(`🔌 New client connected: ${socket.id}`);
    socket.emit('config', { touchThreshold: config.touchThreshold });
});


// --- AUTH ENDPOINTS ---
app.post('/api/login', (req, res) => {
    const { username, password, remember } = req.body;
    const user = webUsers.find(u => u.username === username && u.passwordHash === hashPassword(password));

    if (user) {
        req.session.user = { username: user.username, role: user.role };
        log(`🔑 User login: ${username}`, 'AUTH');

        if (remember) {
            // Set cookie to last for 30 days
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        } else {
            // Cookie expires when browser closes (session cookie)
            req.session.cookie.expires = false;
        }

        res.json({ success: true, user: req.session.user });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

app.post('/api/logout', (req, res) => {
    const username = req.session.user ? req.session.user.username : 'unknown';
    req.session.destroy();
    log(`🚪 User logout: ${username}`, 'AUTH');
    res.json({ success: true });
});

app.get('/api/auth-check', (req, res) => {
    res.json({ loggedIn: !!req.session.user, user: req.session.user || null });
});

// --- WEB USER MANAGEMENT (Admin Only) ---
app.get('/api/web-users', requireAdmin, (req, res) => {
    res.json(webUsers.map(u => ({ username: u.username, role: u.role })));
});

app.post('/api/web-users', requireAdmin, (req, res) => {
    const { username, password, role } = req.body;
    if (webUsers.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    webUsers.push({ username, passwordHash: hashPassword(password), role });
    saveWebUsers();
    res.status(201).json({ message: 'Web user created' });
});

app.delete('/api/web-users/:username', requireAdmin, (req, res) => {
    const { username } = req.params;
    if (username === 'admin') return res.status(400).json({ error: 'Cannot delete root admin' });
    webUsers = webUsers.filter(u => u.username !== username);
    saveWebUsers();
    res.json({ message: 'Web user deleted' });
});

// --- DOOR & RFID ENDPOINTS ---
app.get('/api/users', requireAuth, (req, res) => res.json(rfidUsers));
app.get('/api/last-card', requireAuth, (req, res) => res.json({ id: lastScannedCard }));
app.get('/api/status', requireAuth, (req, res) => res.json({ holdOpen }));

app.post('/api/sync', requireAdmin, (req, res) => {
    log('🔄 Sync triggered via API', 'SYNC');
    syncToArduino(true);
    res.json({ message: 'Sync triggered' });
});

app.get('/api/door/open', requireAuth, (req, res) => {
    serialWrite('kapi\n');
    log(`🚪 Door opened via WebUI by ${req.session.user.username}`, 'DOOR');
    res.json({ message: 'Door opening' });
});

app.get('/api/door/close', requireAuth, (req, res) => {
    serialWrite('close\n');
    log(`🚪 Door closed via WebUI by ${req.session.user.username}`, 'DOOR');
    res.json({ message: 'Door closing' });
});

app.get('/api/door/hold', requireAdmin, (req, res) => {
    const enabled = req.query.enabled === 'true';
    holdOpen = enabled;
    serialWrite((holdOpen ? 'HOLD_ON' : 'HOLD_OFF') + '\n');
    res.json({ holdOpen });
});

app.post('/api/users', requireAdmin, (req, res) => {
    const { id, name, actionPassword, schedule } = req.body;
    if (hashPassword(actionPassword) !== config.actionPasswordHash) {
        return res.status(403).json({ error: 'Invalid action password' });
    }
    if (rfidUsers.find(u => u.id === id)) return res.status(400).json({ error: 'Card ID exists' });
    rfidUsers.push({ id, name, enabled: true, schedule: schedule || [] });
    saveRfidUsers();
    syncToArduino();
    res.status(201).json({ message: 'User added' });
});

app.patch('/api/users/:id/schedule', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { schedule, actionPassword } = req.body;

    if (hashPassword(actionPassword) !== config.actionPasswordHash) {
        return res.status(403).json({ error: 'Invalid action password' });
    }

    const user = rfidUsers.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.schedule = schedule;
    saveRfidUsers();
    syncToArduino();
    res.json({ success: true, schedule: user.schedule });
});

app.patch('/api/users/:id/toggle', requireAdmin, (req, res) => {
    const { id } = req.params;
    const user = rfidUsers.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.enabled = !user.enabled;
    saveRfidUsers();
    syncToArduino();
    res.json({ success: true, enabled: user.enabled });
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { actionPassword } = req.query;
    if (hashPassword(actionPassword) !== config.actionPasswordHash) {
        return res.status(403).json({ error: 'Invalid action password' });
    }
    rfidUsers = rfidUsers.filter(u => u.id !== id);
    saveRfidUsers();
    syncToArduino();
    log(`🗑️ RFID User deleted: ${id}`, 'UPDATE');
    res.json({ message: 'User deleted' });
});

app.get('/api/logs', requireAuth, (req, res) => {
    const { type, date } = req.query;
    const targetDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const logType = type || 'all';
    
    // Mapping internal types to filenames
    const typeMap = {
        all: 'all.log',
        girisler: 'girisler.log',
        web: 'web.log',
        guncelleme: 'guncelleme.log',
        other: 'other.log'
    };

    const fileName = typeMap[logType] || 'all.log';
    const filePath = path.join(LOGS_DIR, targetDate, fileName);

    if (!fs.existsSync(filePath)) {
        return res.json({ logs: [] });
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);
        // Return last 500 lines in chronological order
        const lastLogs = lines.slice(-500);
        res.json({ logs: lastLogs });
    } catch (err) {
        res.status(500).json({ error: 'Loglar okunamadı' });
    }
});

app.get('/api/config', requireAuth, (req, res) => {
    res.json({ touchThreshold: config.touchThreshold });
});

app.post('/api/config/threshold', requireAdmin, (req, res) => {
    const { threshold } = req.body;
    config.touchThreshold = parseInt(threshold);
    saveConfig();
    syncToArduino();
    io.emit('config', { touchThreshold: config.touchThreshold });
    log(`⚙️ Touch threshold updated to ${threshold}`, 'CONFIG');
    res.json({ success: true, touchThreshold: config.touchThreshold });
});


app.use(express.static('public'));

server.listen(WEB_PORT, () => log(`🌐 Web Interface: http://localhost:${WEB_PORT}`));

