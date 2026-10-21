# 🧠 COGNIVA — Cognitive Gaming & Memory Assistance Platform

> **A HealthTech application for elderly patients with memory decline and dementia in North East India (NER).**  
> Designed as a friendly, calming digital companion with voice support, regional North-East cultural themes, offline-first clinical sync, and comprehensive caregiver insights.

---

## 🚀 Merged Single HTTP Service Architecture

The frontend (React PWA) and backend (Flask API + SQLite + MIRA AI) are now merged into a **single unified HTTP service** running on port **5000**:

```bash
npm start
# or for live watch & rebuild:
npm run dev
```

- **Unified URL**: `http://localhost:5000`
- **Mobile LAN Access**: `http://<your-lan-ip>:5000`
- **Frontend SPA**: React Router handles all views (`/`, `/games`, `/caregiver`, `/settings`, `/my-day`, `/reminders`) directly through client routing.
- **Backend API**: All REST endpoints are served on the same origin (`/api/sync`, `/api/analytics`, `/api/login`, `/api/mira/chat`, `/api/health`).
- **Zero CORS Issues**: Because both the UI assets and API routes originate from the exact same port (`5000`), no cross-origin configurations or external reverse proxies are required.

---

## 📋 Quick Setup & Installation

### 1. Prerequisites
- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **Python** 3.10+ ([python.org](https://www.python.org))

### 2. Install Dependencies
```bash
# Install frontend packages (including concurrently & Vite PWA)
npm install

# Install backend Python dependencies
pip install -r backend/requirements.txt
```

### 3. Configure Environment (`.env`)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
```env
# Optional Gemini API Key for MIRA AI conversational assistant
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# API base path (defaults to /api which proxies to Flask on port 5000)
VITE_API_URL=/api
```
*(Note: Gemini API key can also be entered directly from the in-app **Settings & Setup** page without restarting).*

### 4. Run Development Server
```bash
npm run dev
```
*(On Windows, you can also simply double-click `start.bat`).*

---

## 🌟 Key Platform Features & Upgrades

### 1. 🤖 MIRA AI — Multilingual Voice & Companion Engine
- **Voice Gender Switching**: Switch between **Female (MIRA)** and **Male (MIRO)** voice anytime from the top header of MIRA's panel or through Settings. The app intelligently selects native browser speech voices and modulates pitch/inflection for warmth.
- **True Multilingual Responses**: MIRA provides culturally-grounded static offline and online responses in:
  - 🇬🇧 **English**
  - 🇮🇳 **অসমীয়া (Assamese)**
  - 🇮🇳 **हिंदी (Hindi)**
  - 🇮🇳 **বাংলা (Bengali)**
- **Intent Detection**: Recognizes 13 distinct elder care intents (Game guidance, Routine, Medicine reminders, Tea/Refreshment, Family reassurance, Time/Date, Doctor alerts, Anxiety calming) without requiring an active internet connection.

### 2. ⚙️ Accessible Controls & Compact Toggles
- Decreased toggle size (`w-11 h-6` with `w-4 h-4` thumb) across the entire application for cleaner layout while retaining elderly-accessible click/touch targets.
- **Old Settings Restored**: The gear button (`⚙️`) on the Patient Home Screen directly opens the accessible slide-in drawer (Text Size, High Contrast, Smooth Motion, Sound On/Off, Voice Gender selection, and Language selector).
- Direct link inside the drawer allows navigation to advanced AI & caregiver configuration.

### 3. 📊 Care Insights — Date, Time & Trend Graphs
- **Live Monitoring Session**: Displays the active calendar date (e.g., *Wednesday, 21 October 2026*) and live clock time.
- **Date & Time Tracking on Graphs**: Every game session point on the Recharts graph displays both the session date and time in tooltips and X-axis labels (e.g. `21 Oct 16:10`).
- **Four Telemetry Graphs**:
  - Memory Match Response Duration (Seconds)
  - Memory Match Accuracy & Error Count (Moving Average)
  - Daily Sequence Task Duration (Seconds)
  - Daily Sequence Step Errors
- **Reference Baseline Preview**: When first running the app before games are recorded, a baseline reference curve is available so caregivers can explore the visual telemetry immediately.

### 4. 📱 Android & Mobile PWA Compatibility
- **Full PWA Compliance**: Registered Service Worker (`workbox`), installable web manifest (`manifest.webmanifest`), `viewport-fit=cover`, and maskable Android icon sets (192x192 & 512x512).
- **Network Mobile Access**: Vite `server.host: true` allows any smartphone on the same Wi-Fi network to open `http://<YOUR_PC_IP>:5173` and click **"Add to Home screen"** or **"Install App"** to run as a full-screen native Android app.
- **Zero CORS / Unified Proxy**: Frontend services use relative `/api` paths routed through Vite's dev proxy, preventing cross-origin errors on mobile devices.

### 5. 🗄️ Offline-First SQLite Database (MongoDB Ready)
- Game telemetry is recorded locally in `localStorage` and automatically syncs to SQLite via `/api/sync` when connectivity is established.
- Database operates in WAL (Write-Ahead Logging) mode for concurrency and zero thread-blocking.

---

## 🛠️ Project Structure

```
├── backend/
│   ├── app.py                 # Flask API (/api/sync, /api/analytics, /api/mira/chat)
│   └── requirements.txt       # Python dependencies (flask, flask-cors)
├── public/
│   ├── pwa-192x192.png        # Android PWA icon
│   ├── pwa-512x512.png        # High-res PWA icon
│   └── pwa-maskable-*.png     # Android adaptive icon layers
├── src/
│   ├── components/
│   │   ├── accessibility/     # AccessibilityPanel, ContrastToggle, ReducedMotionToggle
│   │   ├── mira/              # MiraPanel (Voice switcher, localized quick prompts)
│   │   └── patient/           # PatientHomeScreen, ActionCardGrid, GreetingHeader
│   ├── context/
│   │   ├── AccessibilityContext.tsx # Global text size, contrast, voice gender, sound
│   │   ├── AuthContext.tsx          # Caregiver role authentication
│   │   ├── LanguageContext.tsx      # Multi-language translation engine
│   │   └── MiraContext.tsx          # MIRA voice synthesis and conversation state
│   ├── games/
│   │   ├── MemoryMatch.tsx          # Cultural Memory Matching game
│   │   └── DailySequence.tsx        # Daily living activity sequencer
│   ├── screens/
│   │   ├── CaregiverDashboard.tsx   # Trend graphs with dates, times & analytics
│   │   ├── SettingsScreen.tsx       # Advanced AI configuration & PWA installation
│   │   └── TriageChatbot.tsx        # Offline clinical assessment
│   └── services/
│       ├── geminiService.ts         # Multilingual MIRA intent engine & Gemini API
│       └── syncService.ts           # Offline sync and analytics fetching
├── package.json               # Concurrently dev script & dependencies
└── vite.config.ts             # Vite server host, PWA manifest, API proxy
```

---

## 🧪 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Launch Flask backend and Vite frontend concurrently |
| `npm run dev:frontend` | Launch only Vite frontend (`port 5173`) |
| `npm run dev:backend` | Launch only Flask backend (`port 5000`) |
| `npm run build` | Compile TypeScript and build production PWA (`dist/`) |
| `npm run preview` | Preview production build locally |
