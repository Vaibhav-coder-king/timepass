# COGNIVA: AI-Based Cognitive Gaming & Memory Assistance Platform

[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-success.svg)](https://vitejs.dev/)
[![React 19](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38bdf8.svg)](https://tailwindcss.com/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-yellow.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An offline-first, culturally grounded Progressive Web Application (PWA) designed to provide cognitive stimulation, memory assistance, daily routine structuring, and non-diagnostic neurological observation for elderly individuals with mild cognitive impairment (MCI) and dementia across **North-East India (NER)** and globally.

---

## 🌟 What's New in the Latest Version

- **🌐 20-Language Complete i18n & Voice AI**: Integrated 13 Indian regional languages (Assamese, Bengali, Hindi, Punjabi, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Odia, Urdu, English) and 7 international languages (Spanish, French, German, Portuguese, Arabic, Chinese Simplified, Japanese), with instant switching without page reload, automatic Right-to-Left (RTL) text direction for Urdu and Arabic, and localized calendar dates via standard BCP-47 tags.
- **🎙️ MIRA AI Multilingual Companion**: Powered by Google Gemini (1.5 / 2.0 / 2.5 / 3.8 Flash) with a complete deterministic 13-intent offline dementia care engine supporting all 20 languages. Features male (`MIRO`) and female (`MIRA`) voice switching, dementia speech speed control (0.8x gentle, 0.95x normal, 1.1x brisk), and valid BCP-47 speech recognition (STT) and voice synthesis (TTS) across all languages.
- **🎨 Professional 3-Option Color System (Light, Dark, System)**: Centralized design tokens across all views, WCAG AA contrast compliance, zero-theme flash, automatic OS `prefers-color-scheme` synchronization, deep jewel-tone cards in dark mode for maximum contrast and readability, and a compact, centered toggle switch.
- **📱 Fully Responsive UI (320px to Ultrawide)**: Fluid typography (`clamp()`), safe-area-inset padding (`var(--safe-bottom)`), persistent navigation, and guaranteed visibility of all action buttons (e.g. Back-to-Home) without overlapping bottom navigation bars.
- **📊 Unified Family & Caregiver Analytics**: Multi-game telemetry dashboards displaying longitudinal graphs (scores, completion rate, accuracy, response latencies) for **all active games** in the centralized game registry, with duplicate and non-existent game entries cleanly eliminated.
- **👤 Editable Patient Profile in Settings**: User-editable patient display name and caregiver contact information with real-time validation, persistence, and instant synchronization across daily greetings, MIRA voice interactions, and game scorecards.

---

## 🧠 Core Features & Architecture

### 1. Culturally Grounded Cognitive Modules
Accessible from the **Game Hub (`/games`)**:
1. **Memory Match (`/games/memory-match`)**: Visual and episodic memory recall using culturally familiar NER symbols (Kaziranga rhino, Hornbill, Assam tea gardens, traditional gamusa, orchids, elephants).
2. **Daily Sequence (`/games/daily-sequence`)**: Executive planning and procedural memory ordering familiar morning, mealtime, and evening routine activities without drag-and-drop complexity.
3. **Vernacular Audio Stroop (`/games/audio-stroop`)**: Selective attention, auditory processing, and cognitive inhibition with spoken audio prompts in Assamese, Hindi, and English.
4. **Today's World / Reality Anchor (`/games/reality-anchor`)**: Orientation awareness grounded in real-world date, season, weather, and location with supportive reassurance.
5. **Acoustic Recognition (`/games/acoustic-recognition`)**: Auditory recall powered by Web Audio API procedural sound synthesis (temple bell, rainfall, flute melody, birdsong).
6. **Passive Tremor Telemetry (`/games/tremor-telemetry`)**: 5-second controlled steady-hold gesture computing root-mean-square (RMS) acceleration via the `DeviceMotionEvent` API for motor stability monitoring.
7. **Canvas Clock Draw (`/games/clock-draw`)**: High-DPI canvas visuospatial clock drawing test with stroke-level telemetry and touch optimization.
8. **Pattern Association (`/games/pattern-match`)**: Visual reasoning celebrating Assamese Muga silk weaves, Kopou phool, and Bihu motifs.

### 2. MIRA AI Voice & Memory Companion
- **Online Inference**: Connects to Google Gemini API (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-3.8-flash`) with custom clinical dementia and NER cultural memory prompts.
- **Offline Knowledge Engine**: Multi-intent deterministic engine providing warm, calming, reality-grounding responses across 13 dementia care intents in all 20 languages when disconnected or operating without an API key.
- **Voice Customization**: Choice of Female (`MIRA`) or Male (`MIRO`) persona with elderly-friendly pitch and speed modulation.
- **BCP-47 STT & TTS**: Clean voice synthesis and recognition using localized BCP-47 locales (e.g. `as-IN`, `bn-IN`, `hi-IN`, `pa-IN`, `ta-IN`, `ar-SA`, `zh-CN`, `ja-JP`).

### 3. Patient Assistance Suite
- **My Day (`/my-day`)**: Daily routine tracker with Morning, Afternoon, and Evening slots, custom activity creation, and automated midnight resets.
- **Reminders (`/reminders`)**: Medicine and doctor appointment manager with time sorting, active/mute toggles, scheduled browser notifications, and audio chimes.
- **Memories (`/memories`)**: Private offline family photo and voice album stored strictly within local sandbox storage.
- **Government Hub (`/govt-hub`)**: Verified directory of official Indian elder-care schemes (Ayushman Bharat PM-JAY 70+, NPHCE, Tele-MANAS 14416, Elder Line 14567, Rashtriya Vayoshri Yojana, Atal Amrit Abhiyan).
- **Offline Clinical Triage (`/triage`)**: Rule-based decision-tree chatbot offering immediate guidance for delirium, confusion, falls, medication queries, and caregiver burnout.

### 4. 7-Role Server-Enforced RBAC Portal (`/caregiver`, `/dashboard`)
Server-enforced role-based access control backed by Flask, SQLite, and JWTs:
- **Patient**: Zero-password, device-as-identity pass-through for friction-free access.
- **Family**: Real-time adherence summaries, activity logs, and performance trends across all games.
- **ASHA Workers**: Field-visit patient caseload monitoring and offline synchronization queues.
- **Doctors / Neurologists**: 5-Axis Neuro Radar charts, longitudinal response latency curves, and tremor tracking.
- **Hospitals**: Institutional patient counts and clinician roster management.
- **NGOs**: De-identified cohort analytics and regional coverage reporting.
- **Admins**: User provisioning, database migration health, and immutable audit logs.

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
| **PWA & Offline** | [Vite PWA](https://vite-pwa-org.netlify.app/) + [Workbox](https://developer.chrome.com/docs/workbox/) Service Worker |
| **Voice & Audio** | Web Speech API (STT & TTS) + Web Audio API (procedural audio synthesis) |
| **AI Companion** | [Google Gemini API](https://ai.google.dev/) + Custom 20-Language Deterministic Engine |
| **Backend API** | [Python 3.10+](https://www.python.org/) + [Flask](https://flask.palletsprojects.com/) + Flask-CORS + PyJWT |
| **Database** | SQLite3 with WAL mode and RBAC schema migrations |
| **Linter & Quality** | [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) |

---

## 📂 Project Structure

```
.
├── backend/
│   ├── app.py                     # Flask API server & RBAC route handlers
│   ├── adaptive_difficulty.py     # Elo-inspired cognitive game difficulty engine
│   ├── api.py                     # API blueprint & core endpoints
│   ├── database.py                # SQLite connection pool & query helpers
│   ├── migrate_rbac.py            # RBAC database migration & seed script
│   ├── cogniva.db                 # SQLite database file
│   ├── test_rbac.py               # RBAC unit test suite
│   └── test_backend.py            # Adaptive difficulty & metrics unit tests
├── src/
│   ├── components/
│   │   ├── accessibility/         # Contrast, font size, & motion toggles
│   │   ├── layout/                # AppShell, PatientLayout, SafeAreaContainer
│   │   ├── mira/                  # MiraAvatarOrb, MiraPanel, MiraFloatingButton
│   │   ├── navigation/            # Role-based navigation bars
│   │   └── patient/               # ActionCardGrid, GreetingHeader, PatientBottomNav
│   ├── context/
│   │   ├── AccessibilityContext.tsx # User settings, themes, and font size state
│   │   ├── AuthContext.tsx        # RBAC credentials and token management
│   │   ├── LanguageContext.tsx    # Reactive 20-language i18n provider
│   │   ├── MiraContext.tsx        # MIRA speech synthesis & session management
│   │   └── translations.ts        # Central 20-language dictionary & BCP-47 metadata
│   ├── games/                     # Cognitive games implementations
│   │   ├── MemoryMatch.tsx        # Card matching with NER symbols
│   │   ├── DailySequence.tsx      # Daily routine sequencing game
│   │   ├── AudioStroop.tsx        # Multilingual Audio Stroop test
│   │   ├── RealityAnchor.tsx      # Temporal & seasonal reality orientation
│   │   ├── AcousticRecognition.tsx # Web Audio procedural sound recall
│   │   ├── PassiveTremorTelemetry.tsx # DeviceMotionEvent motor tremor test
│   │   ├── CanvasClockDraw.tsx    # Visuospatial clock drawing test
│   │   └── PatternAssociation.tsx # Cultural pattern matching
│   ├── hooks/
│   │   ├── useLanguage.ts         # Hook for translations & text direction
│   │   ├── useMiraVoiceState.ts   # STT state machine with valid BCP-47 locales
│   │   ├── useSpeechRecognition.ts # Web Speech API recognition wrapper
│   │   └── useTimeOfDayGreeting.ts # Time-aware patient greeting helper
│   ├── screens/
│   │   ├── PatientHomeScreen.tsx  # Central patient portal
│   │   ├── GameHub.tsx            # Brain games catalog with dark-mode contrast
│   │   ├── CaregiverDashboard.tsx # Comprehensive multi-role analytics portal
│   │   ├── MyDayScreen.tsx        # Routine scheduler with midnight reset
│   │   ├── RemindersScreen.tsx    # Medicines & appointments management
│   │   ├── MemoriesScreen.tsx     # Private offline photo & audio memories
│   │   ├── SettingsScreen.tsx     # Themes, editable patient name, & language setup
│   │   ├── GovtHub.tsx            # Indian elder-care government schemes directory
│   │   └── TriageChatbot.tsx      # Deterministic clinical triage chatbot
│   ├── services/
│   │   ├── geminiService.ts       # Gemini API client, 20-language offline engine & TTS
│   │   ├── reminderNotificationService.ts # Web Notification & audio chime manager
│   │   └── syncService.ts         # Offline-first game telemetry synchronization
│   ├── types/
│   │   └── types.ts               # Universal TypeScript interfaces & types
│   ├── App.tsx                    # Route declarations with lazy code-splitting
│   ├── main.tsx                   # React root entry point
│   └── index.css                  # Tailwind v4 styles, theme tokens, & touch resets
├── docs/                          # Comprehensive technical documentation suite
├── public/                        # Static assets, PWA icons, & audio samples
├── package.json                   # Dependencies, scripts, and build definitions
├── vite.config.ts                 # Vite 8 + Tailwind v4 + VitePWA configuration
└── README.md                      # Project overview & documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
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
pip install flask flask-cors pyjwt

# 4. Initialize and seed the SQLite database with RBAC roles and sample data
python migrate_rbac.py

# 5. Start the Flask server
python app.py
# Backend API running at: http://127.0.0.1:5000
```

### 4. Running Both Frontend and Backend Concurrently
```powershell
# From the project root:
npm run dev
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

## 🌍 Supported Languages (20 Total)

COGNIVA includes comprehensive translations, native scripts, RTL direction support, localized calendar date displays, and tailored MIRA voice models for:

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
- [Accessibility (WCAG 2.1 AA) Conformance](./docs/ACCESSIBILITY.md)
- [Government Schemes Directory](./docs/GOVERNMENT_SCHEMES.md)
- [Testing & Quality Assurance Guide](./docs/TESTING_GUIDE.md)
- [Production Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Known Limitations & Product Roadmap](./docs/KNOWN_LIMITATIONS_AND_ROADMAP.md)
- [ADR-001: Offline-First Architecture & RBAC](./docs/DECISIONS/ADR-001_OFFLINE_FIRST_AND_RBAC.md)

---

## ⚖️ Clinical Disclaimer

COGNIVA is designed for cognitive engagement, behavioral stimulation, daily routine reinforcement, and observational monitoring. It is **not a certified diagnostic medical device**. The scores, analytics, radar charts, and sensor measurements generated by COGNIVA are intended solely for cognitive stimulation and informational caregiving assistance; they do not constitute medical advice or a formal diagnosis of Alzheimer's disease, dementia, or any neurological condition. Always consult qualified healthcare professionals for clinical diagnosis and medical care plans.
