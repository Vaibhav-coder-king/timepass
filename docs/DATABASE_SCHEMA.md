# COGNIVA Database Schema

**Engine**: SQLite 3 with Write-Ahead Logging (WAL)  
**Database File**: `backend/cogniva.db`  

---

## 1. Engine Configuration & Pragmas

On backend initialization, `app.py` executes:
```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;
```

---

## 2. Table Definitions

### 2.1 `game_sessions` (Core Telemetry Store)

Tracks every completed or abandoned cognitive session. Supports schema migration from v1 (8 columns) to v2 (17 columns).

| Column Name | SQLite Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | NO | AUTOINCREMENT | Legacy primary key |
| `game` | TEXT | NO | - | Module identifier (`MEMORY_MATCH`, `CLOCK_DRAW`, etc.) |
| `time_taken_sec` | REAL | NO | - | Session active completion duration |
| `error_count` | INTEGER | NO | - | Number of incorrect attempts / undos |
| `difficulty` | TEXT | YES | 'MEDIUM' | Difficulty tier (`EASY`, `MEDIUM`, `HARD`) |
| `level` | INTEGER | YES | 1 | Adaptive difficulty engine rank |
| `timestamp` | DATETIME | YES | CURRENT_TIMESTAMP | Server receipt timestamp |
| `device_id` | TEXT | YES | 'unknown' | Pseudonymous client hardware UUID |
| `region` | TEXT | YES | 'Assam' | NER administrative territory |
| `session_id` | TEXT | YES | - | Client-generated v4 UUID |
| `patient_id` | TEXT | YES | - | Persistent patient hardware/enrolment ID |
| `module_version` | TEXT | YES | '1.0.0' | Semantic version of game frontend code |
| `started_at` | TEXT | YES | - | Client ISO timestamp when game started |
| `ended_at` | TEXT | YES | - | Client ISO timestamp when game ended |
| `duration_sec` | INTEGER | YES | 0 | Recorded total duration |
| `completed` | INTEGER | YES | 1 | 1 = Completed, 0 = Early exit / abandoned |
| `metrics_json` | TEXT | YES | '{}' | Domain-specific telemetry payload (JSON) |
| `schema_version` | INTEGER | YES | 2 | Contract schema version |

#### Indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON game_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device ON game_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_game ON game_sessions(game);
CREATE INDEX IF NOT EXISTS idx_sessions_region ON game_sessions(region);
```

---

### 2.2 `users` (Staff & Institutional RBAC)

| Column Name | SQLite Type | Nullable | Description |
|---|---|---|---|
| `id` | INTEGER | NO | Primary key (AUTOINCREMENT) |
| `username` | TEXT | NO | Unique login handle |
| `password_hash`| TEXT | NO | PBKDF2 / SHA256 hashed credential |
| `role` | TEXT | NO | One of `Patient, Family, ASHA, Doctor, Hospital, NGO, Admin` |
| `region` | TEXT | YES | Operating state (e.g. `Assam`, `Meghalaya`, `Nagaland`) |
| `display_name` | TEXT | YES | Clinical or field title |

---

### 2.3 `audit_logs` (Security & Privacy Compliance)

| Column Name | SQLite Type | Nullable | Description |
|---|---|---|---|
| `id` | INTEGER | NO | Primary key (AUTOINCREMENT) |
| `timestamp` | DATETIME | NO | UTC event timestamp |
| `user_id` | INTEGER | YES | Acting staff member ID |
| `action` | TEXT | NO | Action executed (e.g. `ANALYTICS_QUERY`, `SYNC_INGEST`) |
| `resource` | TEXT | YES | Target entity (e.g. `patient_alpha`) |
| `ip_address` | TEXT | YES | Client IP address |
| `status` | TEXT | NO | `SUCCESS` or `DENIED` |

---

## 3. Dynamic Migration Strategy

When `app.py` boots, it invokes `run_migrations()`:
1. Performs `PRAGMA table_info(game_sessions)` to introspect existing columns.
2. Checks for missing v2 columns (`session_id`, `patient_id`, `module_version`, `metrics_json`, etc.).
3. Executes safe `ALTER TABLE game_sessions ADD COLUMN ...` statements without dropping tables or losing historic patient sessions.
