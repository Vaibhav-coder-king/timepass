# COGNIVA Security, Privacy & Compliance Architecture

---

## 1. Compliance Stance: India DPDP Act 2023

COGNIVA is engineered around the principles of **Data Minimization**, **Purpose Limitation**, and **Storage Limitation** codified in the Digital Personal Data Protection (DPDP) Act, 2023 of India.

---

## 2. Privacy Engineering Safeguards

### 2.1 Pseudonymous Patient Identity
- Patients do not register with phone numbers, Aadhaar numbers, or names.
- Patient identity is tied strictly to a cryptographic UUID (`crypto.randomUUID()`) generated on device initialization.
- Game session telemetry carries only the pseudonymous hardware `device_id` and regional scope (`Assam`, `Meghalaya`, etc.).

### 2.2 Client-Side Isolation of Personal Memories
- Personal family photographs and voice recordings in the **Memories** module are stored exclusively in the browser's local sandbox (`localStorage`).
- Memories are **never transmitted** to the central SQLite database or cloud servers.
- A patient or caregiver can immediately purge all memories using the "Wipe Local Data" control in `/settings`.

### 2.3 Token Security & Role Enforcement
- Staff endpoints require HS256 JWT tokens.
- Secret keys are loaded from environment variables (`COGNIVA_SECRET_KEY`) with fallback defaults for local sandbox testing.
- Tokens expire in 8 hours.
- Backend routes inspect role claims and restrict queries to authorized regions and patient assignments.

### 2.4 Immutable Audit Logging
- Every read query by a Doctor, Hospital, or NGO is recorded in the `audit_logs` SQLite table with timestamp, user ID, requested resource, and outcome status.
