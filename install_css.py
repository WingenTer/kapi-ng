import os

css_content = """@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Space+Mono&display=swap');

:root {
    --bg-base: #0f172a;
    --bg-panel: #1e293b;
    --bg-input: #334155;
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --border: #334155;
    --radius-lg: 16px;
    --radius-md: 12px;
    --radius-sm: 8px;
    --sidebar-w: 260px;
    --transition: all 0.2s ease;
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
body { background: var(--bg-base); color: var(--text-main); height: 100vh; overflow: hidden; }

/* Login */
.login-overlay { position: fixed; inset: 0; background: var(--bg-base); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.login-card { background: var(--bg-panel); padding: 2.5rem; border-radius: var(--radius-lg); width: 100%; max-width: 400px; text-align: center; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.login-icon { width: 64px; height: 64px; background: rgba(99, 102, 241, 0.1); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem auto; }
.login-card h2 { margin-bottom: 0.5rem; font-size: 1.5rem; }
.login-card p { color: var(--text-muted); margin-bottom: 2rem; }
.input-group { position: relative; margin-bottom: 1rem; }
.input-group i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
.input-group input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: var(--radius-md); background: var(--bg-input); border: 1px solid transparent; color: white; transition: var(--transition); }
.input-group input:focus { border-color: var(--primary); outline: none; }
.login-options { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; color: var(--text-muted); font-size: 0.9rem; }
.checkbox-container { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.error-text { color: var(--danger); font-size: 0.9rem; margin-top: 1rem; min-height: 20px; }

/* Layout */
.app-container { display: flex; height: 100vh; }
.sidebar { width: var(--sidebar-w); background: var(--bg-panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
.sidebar-header { padding: 1.5rem; font-size: 1.25rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 0.75rem; }
.sidebar-nav { flex: 1; padding: 0 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.nav-item { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: transparent; border: none; color: var(--text-muted); border-radius: var(--radius-md); cursor: pointer; text-align: left; font-size: 0.95rem; transition: var(--transition); font-weight: 500; }
.nav-item:hover, .nav-item.active { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
.sidebar-footer { padding: 1.5rem; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.user-info { display: flex; align-items: center; gap: 0.75rem; }
.user-avatar { width: 36px; height: 36px; background: var(--primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; }
.user-details span { display: block; font-weight: 600; font-size: 0.9rem; }
.user-details small { color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; }
.btn-logout { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; }
.btn-logout:hover { color: var(--danger); }

.content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.top-bar { height: 70px; border-bottom: 1px solid var(--border); padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; }
.top-bar-left { display: flex; align-items: center; gap: 1rem; }
.page-title h2 { font-size: 1.25rem; font-weight: 600; text-transform: capitalize; }
.top-bar-actions { display: flex; align-items: center; gap: 1rem; }
.status-indicator { display: flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 0.4rem 0.75rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 600; }
.status-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; box-shadow: 0 0 8px var(--success); }
.btn-icon { background: none; border: none; color: var(--text-muted); font-size: 1.1rem; padding: 0.5rem; cursor: pointer; border-radius: var(--radius-md); transition: var(--transition); }
.btn-icon:hover { background: var(--bg-input); color: var(--text-main); }
.btn-icon-sm { background: var(--bg-input); border: 1px solid var(--border); color: var(--text-main); width: 36px; height: 36px; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.mobile-only { display: none; }

.scroll-content { flex: 1; overflow-y: auto; padding: 2rem; }
.tab-content { display: none; animation: fadeIn 0.3s ease; }
.tab-content.active { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* Dashboard & Cards */
.grid-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
.card { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; }
.card-header { margin-bottom: 1.5rem; }
.card-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; color: var(--text-main); font-weight: 600; }
.alert-card { grid-column: 1 / -1; display: flex; align-items: center; gap: 1.5rem; background: rgba(99, 102, 241, 0.05); border-color: var(--primary); }
.alert-icon { width: 48px; height: 48px; background: var(--primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.alert-body { flex: 1; }
.alert-body h4 { color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem; }
.alert-body p { font-size: 1.5rem; font-weight: 700; font-family: 'Space Mono', monospace; color: var(--primary); }

/* Buttons */
.btn-primary { background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; transition: var(--transition); }
.btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }
.btn-success { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-md); outline: none; padding: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: var(--transition); }
.btn-success:hover { background: var(--success); color: white; }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-md); outline: none; padding: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: var(--transition); }
.btn-danger:hover { background: var(--danger); color: white; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; }
.btn-action { background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; margin-left: auto; }
.btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-main); padding: 0.75rem 1.5rem; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }
.btn-ghost:hover { background: rgba(255,255,255,0.05); }

/* Door Config */
.door-visual { font-size: 3.5rem; text-align: center; margin: 2rem 0; color: var(--text-muted); transition: var(--transition); }
.door-visual.open { color: var(--success); filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.4)); transform: scale(1.05); }
.control-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.hold-mode-section { background: var(--bg-base); padding: 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--bg-input); }
.hold-text strong { display: block; font-size: 0.95rem; margin-bottom: 0.2rem; }
.hold-text p { font-size: 0.8rem; color: var(--text-muted); }

/* Toggle Switch */
.ios-switch { position: relative; width: 44px; height: 24px; display: inline-block; }
.ios-switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border); transition: .3s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
input:checked + .slider { background-color: var(--primary); }
input:checked + .slider:before { transform: translateX(20px); }

/* Gauges */
.gauge-container { height: 8px; background: var(--bg-base); border-radius: 4px; overflow: hidden; position: relative; margin-bottom: 1rem; border: 1px inset rgba(0,0,0,0.5); }
.gauge-bar { height: 100%; background: linear-gradient(90deg, var(--primary), #a855f7); width: 0%; transition: width 0.2s ease; }
.gauge-marker { position: absolute; top: 0; bottom: 0; width: 2px; background: white; transition: left 0.3s ease; box-shadow: 0 0 5px white; }
.sensor-values { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.sensor-val-item { flex: 1; background: var(--bg-base); border: 1px solid var(--bg-input); padding: 0.75rem; border-radius: var(--radius-md); text-align: center; }
.sensor-val-item small { display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600; }
.sensor-val-item span { font-size: 1.25rem; font-weight: 700; font-family: 'Space Mono', monospace; color: var(--primary); }
.threshold-control label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem; }
.threshold-control input[type="range"] { width: 100%; margin-bottom: 1.5rem; accent-color: var(--primary); }

/* Stats & Leaderboard */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.stat-item { background: var(--bg-base); border: 1px solid var(--bg-input); padding: 1.25rem 1rem; border-radius: var(--radius-md); text-align: center; display: flex; flex-direction: column; justify-content: center; }
.stat-value { display: block; font-size: 1.75rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem; }
.stat-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
.leaderboard-section { border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 0.5rem; }
.leaderboard-header { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
.leaderboard-list { display: flex; flex-direction: column; gap: 0.5rem; }
.leaderboard-item { display: flex; align-items: center; gap: 1rem; background: var(--bg-base); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid transparent; transition: var(--transition); }
.leaderboard-item:hover { border-color: var(--border); }
.lb-rank { width: 28px; height: 28px; background: var(--bg-input); display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
.lb-rank.rank-1 { background: rgba(245, 158, 11, 0.15); color: var(--warning); box-shadow: 0 0 10px rgba(245, 158, 11, 0.2); }
.lb-rank.rank-2 { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
.lb-rank.rank-3 { background: rgba(217, 119, 6, 0.15); color: #d97706; }
.lb-name { flex: 1; font-weight: 500; font-size: 0.95rem; }
.lb-count { font-family: 'Space Mono', monospace; font-size: 0.85rem; color: var(--primary); padding: 0.2rem 0.6rem; background: rgba(99, 102, 241, 0.1); border-radius: 6px; font-weight: 700; }

/* Tables */
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.section-header h3 { font-size: 1.25rem; font-weight: 600; }
.table-card { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { padding: 1.25rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.2); font-weight: 600; letter-spacing: 0.5px; }
td { padding: 1.25rem; font-size: 0.95rem; border-bottom: 1px solid var(--border); }
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(255,255,255,0.02); }
.text-right { text-align: right; }

/* Logs */
.log-controls { display: flex; gap: 0.75rem; align-items: center; }
.form-control { background: var(--bg-input); border: 1px solid var(--border); color: var(--text-main); padding: 0.6rem 1rem; border-radius: var(--radius-md); font-size: 0.9rem; transition: var(--transition); outline: none; }
.form-control:focus { border-color: var(--primary); }
.form-control::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.6; cursor: pointer; }
.log-container { background: #000; border: 1px solid var(--border); border-radius: var(--radius-lg); height: calc(100vh - 220px); display: flex; flex-direction: column; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
.log-viewer { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.35rem; font-family: 'Space Mono', monospace; font-size: 0.85rem; line-height: 1.6; }
.log-line { padding: 0.35rem 0.75rem; border-radius: 6px; word-break: break-all; transition: background 0.2s; border-left: 3px solid transparent; }
.log-line:hover { background: rgba(255,255,255,0.05); }
.log-line.error { color: #fca5a5; border-left-color: var(--danger); background: rgba(239, 68, 68, 0.05); }
.log-line.warn { color: #fcd34d; border-left-color: var(--warning); }
.log-line.info { color: #93c5fd; border-left-color: var(--primary); }
.log-line.success, .log-line.door { color: #6ee7b7; border-left-color: var(--success); }
.log-line.kart { color: #fde047; border-left-color: #fde047; }

/* Modals */
.modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; }
.modal.active { display: flex; animation: fadeInModal 0.2s ease; }
@keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
.modal-content { background: var(--bg-panel); border: 1px solid var(--border); width: 100%; max-width: 480px; border-radius: var(--radius-lg); padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
.modal-header h3 { font-size: 1.25rem; font-weight: 600; }
.close-modal { background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; transition: var(--transition); }
.close-modal:hover { background: var(--bg-input); color: var(--text-main); }
.modal-body p { color: var(--text-muted); margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 500; }
.form-group input, .form-group select { width: 100%; background: var(--bg-base); border: 1px solid var(--border); padding: 0.8rem 1rem; border-radius: var(--radius-md); color: white; transition: var(--transition); font-size: 0.95rem; }
.form-group input:focus, .form-group select:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
.schedule-section label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 500; }
.schedule-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
.schedule-item { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-base); padding: 0.5rem; border-radius: var(--radius-md); border: 1px solid var(--border); }
.modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg-input); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--border); }

/* Responsive */
@media (max-width: 1024px) {
    .sidebar { position: fixed; transform: translateX(-100%); z-index: 1000; bottom: 0; top: 0; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 10px 0 30px rgba(0,0,0,0.5); }
    .sidebar.active { transform: translateX(0); }
    .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 999; animation: fadeInModal 0.2s ease; }
    .sidebar-overlay.active { display: block; }
    .mobile-only { display: block; }
}
@media (max-width: 640px) {
    .grid-layout { grid-template-columns: 1fr; }
    .top-bar { padding: 0 1.25rem; }
    .scroll-content { padding: 1.25rem; }
    .log-controls { flex-direction: column; width: 100%; align-items: stretch; }
    .card { padding: 1.25rem; }
    .stats-grid { grid-template-columns: 1fr; }
}
"""

with open('public/style.css', 'w') as f:
    f.write(css_content)
print("CSS successfully overwritten.")
