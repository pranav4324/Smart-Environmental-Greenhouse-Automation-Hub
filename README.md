# Smart Environmental & Greenhouse Automation Hub

> IoT Automation Platform • React Web Dashboard • Node.js REST API • Simulation & Hardware Mode

---

## 🌿 Overview

The **Smart Environmental & Greenhouse Automation Hub** is an end-to-end IoT platform for precision agriculture and automated environmental control. It runs an automated rule engine to trigger actuator relays, visualizes real-time and historical telemetry on a modern web dashboard, and provides a context-aware AI diagnostic assistant.

---

## ✨ Features

- **Dual Operating Modes**: Simulation (hardware-free) and Physical Hardware (ESP32 via MQTT/HTTP).
- **8 Sensor Measurements**: Temperature, Humidity, Soil Moisture, Light, CO₂, Air Quality, Rain, and Motion.
- **Actuator & Relay Control**: Water Pump, Cooling Fan, LED Grow Lights, Ventilation Louvers, Security Buzzer.
- **Greenhouse AI Assistant**: Context-aware diagnostics with local heuristic fallback engine.
- **Real-time Telemetry Charts**: Historical trend analysis with recharts.
- **Automation Rules Engine**: Configurable sensor threshold triggers for automated actuator control.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Node.js, Express, TypeScript.
- **Cloud/Database**: Firebase Admin SDK with local in-memory store fallback.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Installation

Open PowerShell and navigate to the project folder:
```powershell
cd "d:\Smat Home"
npm install
```

### 3. Run the Application

Open **two separate PowerShell windows**:

**Terminal 1 – Backend API Server (Port 5000):**
```powershell
cd "d:\Smat Home"
npm run server
```

**Terminal 2 – Web Dashboard (Port 3000):**
```powershell
cd "d:\Smat Home"
npm run dev
```

Then open your browser at: **http://localhost:3000**

### 4. Verify & Test
```bash
# TypeScript type check
npm run typecheck

# Run all unit tests (29 tests)
npm run test
```

---

## 📂 Project Structure

```
Smat Home/
├── src/
│   ├── components/
│   │   ├── ai/           # AI Assistant Chat component
│   │   ├── dashboard/    # Sensor cards, charts, device panel
│   │   └── layout/       # Navbar, Sidebar, Footer
│   ├── pages/            # Dashboard, Sensors, Automation, Devices, Alerts, Analytics, AI, Settings
│   ├── services/         # API service layer
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Constants and formatters
├── server/
│   ├── index.ts          # Express REST API server
│   ├── ai.ts             # AI diagnostic heuristic engine
│   ├── automation.ts     # Rule engine for actuator control
│   ├── simulation.ts     # Simulation scenario service
│   └── firebase.ts       # Firebase / in-memory data store
├── tests/                # Vitest unit test suite (29 tests)
├── package.json
└── vite.config.ts
```

---

## 🌐 Navigation Pages

| Page | Description |
| --- | --- |
| **Dashboard** | Live sensor overview, device controls, and alerts |
| **Sensors** | Individual sensor readings and threshold status |
| **Automation Rules** | Configure rule thresholds and toggle automation |
| **Device Controls** | Manual actuator relay on/off control |
| **Alerts Log** | View and acknowledge system alert history |
| **Analytics & Trends** | Historical telemetry trend charts |
| **AI Assistant** | Ask natural language questions about greenhouse status |
| **Settings** | MQTT broker and Firebase configuration |
