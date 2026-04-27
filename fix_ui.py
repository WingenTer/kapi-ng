import os

safe_css = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
    --bg: #0f172a;
    --surface: #1e293b;
    --border: #334155;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --primary: #3b82f6;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
body { background-color: var(--bg); color: var(--text); overflow: hidden; }

/* Admin Visibility */
body:not(.is-admin) .admin-only { display: none !important; }

/* Login Screen */
#login-screen {
    position: fixed; inset: 0; background: var(--bg);
    display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.login-card {
    background: var(--surface); padding: 2rem; border-radius: 8px;
    width: 100%; max-width: 400px; border: 1px solid var(--border);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center;
}
.login-card h2 { margin-bottom: 0.5rem; }
.login-card p { color: var(--text-muted); margin-bottom: 1.5rem; }
.input-group { margin-bottom: 1rem; position: relative; }
.input-group input {
    width: 100%; padding: 0.75rem 1rem; border-radius: 4px;
    background: var(--bg); border: 1px solid var(--border); color: var(--text);
}
.login-options { display: flex; gap: 0.5rem; margin-bottom: 1rem; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.875rem; }
.btn-primary {
    background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem;
    border-radius: 4px; cursor: pointer; width: 100%; font-weight: 600;
}
.error-text { color: var(--danger); margin-top: 1rem; font-size: 0.875rem; min-height: 20px; }

/* Main Layout */
#main-content { height: 100vh; width: 100%; } /* flex will be set by JS */
.sidebar { width: 250px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
.sidebar-header { padding: 1.5rem; font-weight: 700; font-size: 1.25rem; border-bottom: 1px solid var(--border); }
.sidebar-nav { padding: 1rem; flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
.nav-item {
    background: transparent; border: none; color: var(--text-muted); padding: 0.75rem 1rem;
    border-radius: 4px; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
}
.nav-item:hover, .nav-item.active { background: rgba(59, 130, 246, 0.1); color: var(--primary); }
.sidebar-footer { padding: 1rem; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.user-info { display: flex; align-items: center; gap: 0.5rem; }
.user-avatar { width: 32px; height: 32px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.btn-logout { background: none; border: none; color: var(--text-muted); cursor: pointer; }

/* Content Area */
.content-area { flex: 1; display: flex; flex-direction: column; background: var(--bg); overflow: hidden; }
.top-bar { height: 64px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem; background: var(--surface); }
.status-indicator { display: flex; align-items: center; gap: 0.5rem; color: var(--success); font-size: 0.875rem; }
.status-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; }
.scroll-content { flex: 1; overflow-y: auto; padding: 1.5rem; }

/* Tabs */
.tab-content { display: none; }
.tab-content.active { display: block; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }

/* Dashboard Grid */
.grid-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; }
.card-header { margin-bottom: 1rem; font-weight: 600; }
.door-visual { text-align: center; font-size: 3rem; margin: 1.5rem 0; color: var(--text-muted); }
.door-visual.open { color: var(--success); }
.control-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.btn-success { background: var(--success); color: white; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; font-weight: 600; }
.btn-danger { background: var(--danger); color: white; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; font-weight: 600; }
.hold-mode-section { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg); border-radius: 4px; }

/* Switch */
.ios-switch { position: relative; display: inline-block; width: 40px; height: 20px; }
.ios-switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background-color: var(--border); border-radius: 20px; transition: 0.4s; }
.slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; border-radius: 50%; transition: 0.4s; }
input:checked + .slider { background-color: var(--primary); }
input:checked + .slider:before { transform: translateX(20px); }

/* Modals */
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 10000; padding: 1rem; }
.modal.active { display: flex; }
.modal-content { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; width: 100%; max-width: 500px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.close-modal { background: none; border: none; color: var(--text); font-size: 1.25rem; cursor: pointer; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; color: var(--text-muted); font-size: 0.875rem; }
.form-group input, .form-group select { width: 100%; padding: 0.75rem; border-radius: 4px; background: var(--bg); border: 1px solid var(--border); color: var(--text); }
.modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text); padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }

/* Tables */
.table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th, td { padding: 1rem; border-bottom: 1px solid var(--border); }
th { background: rgba(0,0,0,0.2); font-size: 0.875rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
tr:last-child td { border-bottom: none; }

/* Logs */
.log-controls { display: flex; gap: 0.5rem; }
.form-control { background: var(--surface); border: 1px solid var(--border); padding: 0.5rem; border-radius: 4px; color: var(--text); }
.log-container { background: #000; border-radius: 8px; border: 1px solid var(--border); height: 60vh; display: flex; flex-direction: column; overflow: hidden; }
.log-viewer { flex: 1; overflow-y: auto; padding: 1rem; font-family: monospace; font-size: 0.875rem; display: flex; flex-direction: column; gap: 0.25rem; }
.log-line { padding: 0.25rem 0.5rem; border-radius: 4px; word-break: break-all; }
.log-line:hover { background: rgba(255,255,255,0.1); }
.log-line.error { color: #fca5a5; }
.log-line.warn { color: #fcd34d; }
.log-line.info { color: #93c5fd; }
.log-line.success, .log-line.door { color: #6ee7b7; }
.log-line.kart { color: #fde047; }

/* Utilities */
.btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; font-weight: normal; }
.text-right { text-align: right; }
.mobile-only { display: none; }

@media (max-width: 768px) {
    .sidebar { display: none; } /* Simplified mobile for now */
    .grid-layout { grid-template-columns: 1fr; }
    .log-controls { flex-direction: column; }
}
"""

with open('/home/aaalrt/kapi-ng/public/style.css', 'w') as f:
    f.write(safe_css)

print("CSS updated successfully to safe standard version.")
