# COGNIVA: AI-Based Cognitive Gaming & Memory Assistance Platform

[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-success.svg)](https://vitejs.dev/)
[![React 18](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-yellow.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An offline-first, culturally grounded Progressive Web Application (PWA) designed to provide cognitive gaming, memory assistance, routine tracking, and non-diagnostic neurological observation for elderly individuals with mild cognitive impairment (MCI) and dementia across **North-East India (NER)**.

---

## 🌟 Key Features

### 🧠 8 Culturally Grounded Cognitive Modules
1. **Memory Match (`/games/memory-match`)**: Short-term visual & episodic recall using familiar NER symbols (One-horned Rhino, Hornbill, Tea garden).
2. **Daily Sequence (`/games/daily-sequence`)**: Executive planning and procedural memory ordering everyday routines without drag-and-drop.
3. **Canvas Clock Draw (`/games/clock-draw`)**: High-DPI canvas visuospatial clock drawing with stroke telemetry, undo/clear controls, and touch optimization.
4. **Vernacular Audio Stroop (`/games/audio-stroop`)**: Selective attention and cognitive inhibition with spoken audio prompts in Assamese, Hindi, and English.
5. **Reality Anchor (`/games/reality-anchor`)**: Orientation awareness grounded in real-world date, time, and season with gentle escape options.
6. **Acoustic Recognition (`/games/acoustic-recognition`)**: Auditory recall with Web Audio API procedural sound synthesis (temple bell, rainfall, flute, birdsong).
7. **Passive Tremor Telemetry (`/games/tremor-telemetry`)**: 5-second controlled steady-hold gesture computing RMS acceleration via the `DeviceMotionEvent` API.
8. **Pattern Association (`/games/pattern-match`)**: Culturally rich pattern matching celebrating Assamese Muga silk weaves, Kopou phool, and Bihu motifs.

### 🛡️ 7-Role Server-Enforced RBAC
- **Patient**: Zero-password, device-as-identity pass-through for friction-free access.
- **Family**: Adherence summaries, activity logs, and reminder setup.
- **ASHA Workers**: Field-visit patient caseload monitoring and offline sync queues.
- **Doctors / Neurologists**: 5-Axis Neuro Radar charts, longitudinal response latency curves, and observational tremor tracking.
- **Hospitals**: Institutional patient counts and clinician roster management.
- **NGOs**: De-identified cohort analytics and regional coverage reporting.
- **Admins**: User provisioning, database migration health, and immutable audit logs.

### 📱 Patient Assistance Suite
- **My Day (`/my-day`)**: Daily routine tracker with Morning, Afternoon, and Evening slots, custom activity creation, and automated midnight resets.
- **Reminders (`/reminders`)**: Medicine and doctor appointment manager with time sorting, active toggles, and "Done today" tracking.
- **Memories (`/memories`)**: Private offline family photo and voice album stored strictly within local sandbox storage.
- **Government Hub (`/govt-hub`)**: Verified directory of official Indian elder-care schemes (Ayushman Bharat PM-JAY 70+, NPHCE, Tele-MANAS 14416, Elder Line 14567, RVY, Atal Amrit Abhiyan).
- **MIRA Assistant & Offline Triage (`/triage`)**: Multilingual AI companion with deterministic offline clinical triage fallback.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ and npm
- Python 3.10+

### 2. Frontend Setup
```powershell
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
# Accessible at http://localhost:5173
```

### 3. Backend Setup
```powershell
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install Python requirements
pip install flask flask-cors pyjwt

# Seed test database (15 sessions across Assam, Meghalaya, Nagaland)
python migrate_rbac.py

# Launch Flask API server
python app.py
# Running at http://127.0.0.1:5000
```

---

## 🧪 Testing

```powershell
# Run backend RBAC test suite (All 7 pass)
cd backend
python test_rbac.py

# Run adaptive difficulty tests (All 8 pass)
python test_backend.py

# Run production frontend build & TypeScript verification
cd ..
npm run build
```

---

## 📚 Documentation

Comprehensive system documentation is located in the [`docs/`](./docs) directory:
- [System Architecture](./docs/ARCHITECTURE.md)
- [API Specification](./docs/API_SPECIFICATION.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Role & Permission Matrix](./docs/ROLE_AND_PERMISSION_MATRIX.md)
- [Cognitive Game Metrics](./docs/GAME_METRICS.md)
- [Offline-First & Sync Architecture](./docs/OFFLINE_AND_SYNC.md)
- [Security & Privacy Guide](./docs/SECURITY_AND_PRIVACY.md)
- [Accessibility (a11y) Conformance](./docs/ACCESSIBILITY.md)
- [Government Schemes Directory](./docs/GOVERNMENT_SCHEMES.md)
- [Testing Guide](./docs/TESTING_GUIDE.md)
- [Production Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Known Limitations & Roadmap](./docs/KNOWN_LIMITATIONS_AND_ROADMAP.md)
- [ADR-001: Offline-First & RBAC](./docs/DECISIONS/ADR-001_OFFLINE_FIRST_AND_RBAC.md)

---

## ⚖️ Clinical Disclaimer

COGNIVA is designed for cognitive engagement, behavioral stimulation, and assisted routine management. It is **not a certified diagnostic medical device**. The scores, radar charts, and sensor measurements generated by COGNIVA do not constitute medical advice or a diagnosis of Alzheimer's disease, dementia, or any neurological condition.
