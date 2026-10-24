# COGNIVA: AI-Based Cognitive Gaming & Memory Assistance Platform

[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-success.svg)](https://vitejs.dev/)
[![React 19](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38bdf8.svg)](https://tailwindcss.com/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-yellow.svg)](https://www.python.org/)

An offline-capable, culturally grounded Progressive Web Application (PWA) for cognitive activities, memory assistance, daily routines, and caregiver support. COGNIVA is intended for older adults, including people living with mild cognitive impairment (MCI) or dementia, with cultural references to **North-East India (NER)**.

---

## Current Features

- **6 cognitive games** are available in the Game Hub.
- **Patient tools:** My Day routines, reminders, a memories screen, settings, a government-program directory, and a rule-based triage assistant.
- **MIRA companion:** Optional Google Gemini requests when an API key is configured, with a predefined local response engine as a fallback. Voice input and speech output use browser speech APIs; language and voice availability depends on the browser and device.
- **20 language choices:** The language selector and translation dictionary include 20 locales. Translation coverage varies by screen; missing strings fall back to English. Urdu and Arabic set right-to-left text direction.
- **Accessibility preferences:** Text size, contrast, light/dark/system theme, reduced motion, sound, and MIRA voice settings.
- **Offline support:** The PWA caches application assets. Game sessions are stored locally and queued for synchronization with the backend; Gemini requests and server synchronization require a network connection.
- **Caregiver dashboard:** Role-gated access to game-session analytics and synchronization status. Available data depends on recorded sessions and backend availability.

## Games

There are **6 games** available from the Game Hub (`/games`):

1. **Memory Match** (`/games/memory-match`): Find matching cards with familiar symbols.
2. **Daily Sequence** (`/games/daily-sequence`): Put familiar daily activities in order.
3. **Listen & Tap** (`/games/audio-stroop`): Listen to a spoken color word and select the matching color.
4. **Today's World** (`/games/reality-anchor`): Respond to gentle questions about the current day and surroundings.
5. **Sounds Around** (`/games/acoustic-recognition`): Identify familiar sounds generated with the Web Audio API.
6. **Steady Hand** (`/games/tremor-telemetry`): A short device-motion activity that records movement stability when supported by the device.
These activities are for engagement and observation, not medical diagnosis.

## Other Application Areas

- **MIRA:** Configure an optional Gemini API key and model in Settings. Without a usable API response, MIRA uses predefined local responses. Speech recognition and synthesis rely on browser support and available device voices.
- **Daily support:** My Day (`/my-day`), Reminders (`/reminders`), Memories (`/memories`), and Settings (`/settings`).
- **Government programs:** A directory is available at `/govt-hub`.
- **Triage:** A rule-based decision tree is available at `/triage`; it is not a substitute for medical advice.
- **Caregiver dashboard:** `/caregiver` and `/dashboard` provide role-gated access to available session analytics and sync information.
- **Local storage and synchronization:** Game sessions are retained in browser storage and submitted to the Flask backend when a connection is available.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/) |
| **Build & Bundler** | [Vite 8](https://vitejs.dev/) with Rollup code-splitting & manual vendor chunking |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) with native `@tailwindcss/vite` plugin |
| **Animations** | [Framer Motion 13](https://www.framer.com/motion/) |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/) |
| **Data Visualization** | [Recharts 3](https://recharts.org/) |
| **PWA & Offline** | [Vite PWA](https://vite-pwa-org.netlify.app/) + [Workbox](https://developer.chrome.com/docs/workbox/) asset caching |
| **Voice & Audio** | Browser speech APIs + Web Audio API for generated game sounds |
| **AI Companion** | Optional [Google Gemini API](https://ai.google.dev/) integration with predefined local responses |
| **Backend API** | [Python 3.10+](https://www.python.org/) + [Flask](https://flask.palletsprojects.com/) + Flask-CORS |
| **Database** | SQLite |
| **Linter & Quality** | [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) |

---

## 📂 Project Structure

```
.
├── backend/
│   ├── app.py
│   ├── adaptive_difficulty.py
│   ├── api.py
│   ├── database.py
│   ├── migrate_rbac.py
│   ├── test_backend.py
│   └── test_rbac.py
├── api/
│   └── index.py
├── src/
│   ├── components/                # accessibility, layout, MIRA, patient, shared
│   ├── context/                   # accessibility, auth, language, MIRA, translations
│   ├── games/                     # Game modules
│   ├── hooks/
│   ├── screens/                   # patient, caregiver, settings, triage
│   ├── services/                  # Gemini, reminders, synchronization
│   ├── data/                       # Triage decision tree
│   ├── types/                      # Shared TypeScript types
│   ├── utils/
│   ├── App.tsx                    # Application routes
│   └── main.tsx                   # React entry point
├── docs/                          # Technical documentation
├── public/                        # Static assets and PWA icons
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Vite, Tailwind, and PWA configuration
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: a version supported by Vite 8
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher

### 2. Frontend Installation & Startup
```powershell
# 1. Clone the repository and navigate into the project directory
cd "AI-Based-Cognitive-Gaming-and-Memory-Assistance-Platform-for-Elderly-Dementia-Patients-in-NER"

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev:frontend
# App accessible at: http://localhost:5173
```

### 3. Backend Setup
```powershell
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a Python virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate # On macOS/Linux

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Initialize the SQLite database and RBAC schema
python migrate_rbac.py

# 5. Start the Flask server
python app.py
# Backend API running at: http://127.0.0.1:5000
```

### 4. Running Both Frontend and Backend Concurrently
```powershell
# From the project root (starts the frontend and backend):
npm run dev:vite
```

---

## 🧪 Verification & Testing

```powershell
# 1. Run TypeScript compilation check
npx tsc --noEmit

# 2. Run Oxlint code quality verification
npm run lint

# 3. Run production build (verifies chunks and PWA service worker)
npm run build

# 4. Run backend RBAC permission test suite
python -m unittest backend/test_rbac.py

# 5. Run backend adaptive difficulty algorithm tests
python backend/test_backend.py
```

---

## 🌍 Language Options

The language selector offers the following 20 locales. Translation coverage varies across screens; missing translation strings fall back to English. Urdu and Arabic use right-to-left text direction. Speech output depends on the voices available in the user's browser or operating system.

| Language | Script / Native Name | Region / Locale | Text Direction |
|---|---|---|---|
| **English** | English | Universal (`en-IN`) | LTR |
| **Hindi** | हिन्दी | National (`hi-IN`) | LTR |
| **Assamese** | অসমীয়া | Assam / NER (`as-IN`) | LTR |
| **Bengali** | বাংলা | Tripura / Barak / WB (`bn-IN`) | LTR |
| **Punjabi** | ਪੰਜਾਬੀ (Gurmukhi) | Punjab / National (`pa-IN`) | LTR |
| **Tamil** | தமிழ் | Tamil Nadu (`ta-IN`) | LTR |
| **Telugu** | తెలుగు | Andhra Pradesh & Telangana (`te-IN`) | LTR |
| **Marathi** | मराठी | Maharashtra (`mr-IN`) | LTR |
| **Gujarati** | ગુજરાતી | Gujarat (`gu-IN`) | LTR |
| **Kannada** | ಕನ್ನಡ | Karnataka (`kn-IN`) | LTR |
| **Malayalam** | മലയാളം | Kerala (`ml-IN`) | LTR |
| **Odia** | ଓଡ଼ିଆ | Odisha (`or-IN`) | LTR |
| **Urdu** | اردو (Nastaliq) | Universal (`ur-IN`) | **RTL** |
| **Spanish** | Español | International (`es-ES`) | LTR |
| **French** | Français | International (`fr-FR`) | LTR |
| **German** | Deutsch | International (`de-DE`) | LTR |
| **Portuguese** | Português | International (`pt-PT`) | LTR |
| **Arabic** | العربية | International (`ar-SA`) | **RTL** |
| **Chinese (Simplified)**| 简体中文 | International (`zh-CN`) | LTR |
| **Japanese** | 日本語 | International (`ja-JP`) | LTR |

---

## 📚 Technical Documentation

In-depth technical architecture and specifications are maintained in the [`docs/`](./docs) directory:
- [System Architecture](./docs/ARCHITECTURE.md)
- [API Specification](./docs/API_SPECIFICATION.md)
- [Database Schema & Migrations](./docs/DATABASE_SCHEMA.md)
- [Role & Permission Matrix](./docs/ROLE_AND_PERMISSION_MATRIX.md)
- [Cognitive Game Metrics & Scoring](./docs/GAME_METRICS.md)
- [Offline-First & Data Sync Architecture](./docs/OFFLINE_AND_SYNC.md)
- [Security & Privacy Guide](./docs/SECURITY_AND_PRIVACY.md)
- [Accessibility documentation](./docs/ACCESSIBILITY.md)
- [Government Schemes Directory](./docs/GOVERNMENT_SCHEMES.md)
- [Testing & Quality Assurance Guide](./docs/TESTING_GUIDE.md)
- [Production Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Known Limitations & Product Roadmap](./docs/KNOWN_LIMITATIONS_AND_ROADMAP.md)
- [ADR-001: Offline-First Architecture & RBAC](./docs/DECISIONS/ADR-001_OFFLINE_FIRST_AND_RBAC.md)

---

## ⚖️ Clinical Disclaimer

COGNIVA is designed for cognitive activities, routine support, and informational caregiving. It is **not a diagnostic medical device**. Game results, dashboard analytics, and device-motion readings do not constitute medical advice or a diagnosis of Alzheimer's disease, dementia, or any other condition. Consult qualified healthcare professionals for diagnosis and care decisions.
