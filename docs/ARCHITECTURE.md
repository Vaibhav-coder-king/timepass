# COGNIVA System Architecture

**AI-Based Cognitive Gaming & Memory Assistance Platform for Elderly Dementia Patients in North-East India (NER)**

---

## 1. Executive Summary

COGNIVA is an offline-first Progressive Web Application (PWA) designed specifically for elderly individuals living with early-stage cognitive impairment, mild cognitive impairment (MCI), or dementia in the North-Eastern Region (NER) of India. 

The system operates under extreme infrastructure constraints:
- Intermittent or absent cellular connectivity
- Low-spec Android smartphones (Android Go, 2GB–3GB RAM)
- Low digital literacy and regional linguistic diversity (Assamese, Bengali, Bodo, Hindi, English)
- Stigmatized cognitive conditions requiring strict pseudonymous data models

```
+-------------------------------------------------------------------------+
|                              COGNIVA CLIENT                             |
|                                                                         |
|  +--------------------+  +--------------------+  +--------------------+ |
|  |     Patient UI     |  |   ASHA Field UI    |  |  Caregiver Portal  | |
|  | (Zero-PW / Device) |  | (Offline Caseload) |  | (Radar / Telemetry)| |
|  +---------+----------+  +---------+----------+  +---------+----------+ |
|            |                       |                       |            |
|  +---------v-----------------------v-----------------------v----------+ |
|  |                     AppShell (Layout & Navigation)                  | |
|  +---------------------------------+----------------------------------+ |
|                                    |                                    |
|  +---------------------------------v----------------------------------+ |
|  |                      8 Cognitive Game Modules                      | |
|  | (Clock Draw, Audio Stroop, Reality Anchor, Tremor, Patterns, etc.) | |
|  +---------------------------------+----------------------------------+ |
|                                    |                                    |
|  +---------------------------------v----------------------------------+ |
|  |             Storage Layer (localStorage + IndexedDB Schema)         | |
|  |        Unsynced Session Queue (UUID, client_created_at, state)     | |
|  +---------------------------------+----------------------------------+ |
|                                    |                                    |
|  +---------------------------------v----------------------------------+ |
|  |              Service Worker (Workbox PWA Runtime Cache)             | |
|  |      Cached Shell & Assets | Denylist: /api/* (No False Sync)      | |
|  +---------------------------------+----------------------------------+ |
+------------------------------------|------------------------------------+
                                     |
                          [HTTP/S POST /api/sync]
                           (When Online with Ack)
                                     |
+------------------------------------v------------------------------------+
|                         COGNIVA BACKEND (Python)                        |
|                                                                         |
|  +--------------------------------------------------------------------+ |
|  |                    Flask 3.x Application (app.py)                  | |
|  +---------------------------------+----------------------------------+ |
|                                    |                                    |
|  +---------------------------------v----------------------------------+ |
|  |            RBAC Middleware (JWT + Device-as-Identity)              | |
|  |   Roles: Patient, Family, ASHA, Doctor, Hospital, NGO, Admin       | |
|  +---------------------------------+----------------------------------+ |
|                                    |                                    |
|  +---------------------------------v----------------------------------+ |
|  |                 SQLite Database (cogniva.db / WAL Mode)            | |
|  |     Tables: game_sessions (17 cols), users, audit_logs             | |
|  +--------------------------------------------------------------------+ |
+-------------------------------------------------------------------------+
```

---

## 2. Frontend Architecture

### 2.1 Tech Stack
- **Framework**: React 18 with TypeScript 5
- **Build Tool**: Vite 6 with custom manual chunk splitting
- **Styling**: Tailwind CSS v4 + semantic CSS custom properties for WCAG AA conformance
- **Motion**: Framer Motion for gentle, accessible animations
- **Visualizations**: Recharts for 5-axis cognitive radar charts and time-series trends
- **Offline / PWA**: `vite-plugin-pwa` with Workbox Service Worker
- **Audio & Speech**: Web Audio API for synthetic audio stimuli; SpeechSynthesis for vernacular speech prompts

### 2.2 Offline-First Design Principles
1. **Zero-Network Barrier**: The entire patient experience (8 games, daily routines, reminders, local memory album, offline triage chatbot) operates without an active internet connection.
2. **Deterministic Fallbacks**: If external APIs (such as Gemini AI for MIRA) are inaccessible, rule-based clinical triage and deterministic offline responses take over seamlessly.
3. **True Sync State**: The UI never reports "Synced" unless the backend server has explicitly received and acknowledged the specific batch of sessions.

---

## 3. Backend Architecture

### 3.1 Tech Stack
- **Server**: Python Flask with CORS support
- **Authentication**: HMAC-SHA256 JWT tokens with role claims + header-based pseudonymous device tokens (`X-Device-ID`)
- **Database**: SQLite3 configured with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`), foreign keys enabled, and a 5-second busy timeout.
- **Dynamic Schema Migration**: Automatic database upgrades on startup with column introspection (`PRAGMA table_info`).

### 3.2 Time Complexity Guarantees
- `/api/login`: $\mathcal{O}(1)$ index lookup
- `/api/sync`: $\mathcal{O}(N)$ where $N$ is the batch size, wrapped in a single database transaction
- `/api/analytics`: $\mathcal{O}(K \log K)$ with SQL indexed filtering where $K$ is regional session count
- `/api/schemes`: $\mathcal{O}(1)$ memory-cached retrieval

---

## 4. Multi-Role RBAC Model

The system implements 7 distinct roles:
1. **Patient**: Zero-password device pass-through, full offline gaming and memory aids.
2. **Family / Caregiver**: Progress tracking, adherence monitoring, reminder configuration.
3. **ASHA (Accredited Social Health Activist)**: Regional caseload, offline field screening, sync status monitoring.
4. **Doctor / Neurologist**: 5-Axis Neurocognitive radar charts, longitudinal performance, observational flags (strictly non-diagnostic).
5. **Hospital / Clinic**: Aggregate clinical statistics, practitioner management.
6. **NGO / Research**: De-identified cohort analytics, regional coverage metrics.
7. **System Admin**: Audit log review, system health, user credential administration.

---

## 5. Security and Data Privacy

1. **Pseudonymous Identity**: Patient devices generate a persistent random UUID (`crypto.randomUUID()`). No Aadhaar numbers, phone numbers, or patient names are stored in game session logs.
2. **Local Data Isolation**: Memories (personal family photos and voice notes) are retained strictly in client browser storage and are never transmitted to the central cloud.
3. **Audit Trails**: All privileged queries by doctors, NGOs, or admins are permanently recorded in `audit_logs`.
