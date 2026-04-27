# Kapi-NG AI Coding Instructions

This project is a hardware-integrated door control system using Arduino and a Node.js server.

## Architecture & Integration
- **Server:** Node.js (`server.js`) handles the Web UI, API, user management, and serial communication.
- **Hardware:** Arduino (`src/main.cpp`) controls the RFID reader, capacitive touch, and door relay.
- **Communication:** Node.js communicates with Arduino via `SerialPort` (9600 baud) using a line-based text protocol.
- **Persistence:** Data is stored in JSON files: `users.json` (RFID users), `web_users.json`, and `config.json`.

## Logging System
The system uses a daily rotation and category-based logging strategy located in the `/logs` directory.
- Logs are organized by date: `/logs/YYYY-MM-DD/`.
- **Log Types:**
  - `girisler.log`: RFID access, card events, and door events (`DOOR`, `STATS`, `RFID`, `KART`).
  - `web.log`: Web interface logins, API access, client connections (`WEB`, `AUTH`, `API`).
  - `guncelleme.log`: System updates, Arduino syncs, configuration changes (`SYNC`, `CONFIG`, `UPDATE`, `SYSTEM`).
  - `all.log`: Aggregated logs for all activities.
  - `other.log`: Any other info or uncategorized events.

## Features & UI
- **Log Viewer:** A "System Logs" tab in the Web UI allows real-time viewing of the latest 100 log entries, with filtering by category (Access, Web, Updates).
- **RFID Debouncing:** RFID scans are debounced on the server (2s window) to prevent duplicate counts from single card reads.

## Critical Workflows
- **Serial Port:** Ensure the `PORT_PATH` in `server.js` matches the connected Arduino.
- **Syncing:** Changes to users or configuration often require calling `syncToArduino()`.
- **Security:** Critical operations like adding/deleting users require an `actionPassword` (hashed in `config.json`).

## Patterns & Conventions
- Use the `log(message, type)` function in `server.js` for all events.
- Prefer `path.join(__dirname, ...)` for file paths to ensure cross-environment compatibility.
- Arduino protocol: Commands are simple strings ended with `\n` (e.g., `kapi`, `close`, `HOLD_ON`).
