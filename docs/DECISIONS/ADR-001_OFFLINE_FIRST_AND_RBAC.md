# ADR-001: Offline-First Architecture & Device-as-Identity RBAC

**Status**: Accepted  
**Date**: October 2026  
**Deciders**: System Architecture Team  

---

## 1. Context and Problem Statement

North-East India faces significant infrastructural challenges in digital healthcare delivery:
- Remote hilly regions experience prolonged cellular network outages.
- Elderly dementia patients have low digital literacy, impaired short-term memory, and cannot remember alphanumeric passwords or respond to SMS OTPs.
- In-field community health workers (ASHAs) require immediate offline tool availability to assess patients during door-to-door visits.
- Institutional healthcare stakeholders (neurologists, district hospitals, health departments) require privacy-compliant, role-governed visibility into regional trends.

---

## 2. Decision Drivers

- **Zero-Friction Patient Onboarding**: Patients must never be blocked by login walls or forgotten passwords.
- **True Offline Resilience**: All games, triage tools, routine managers, and directories must function indefinitely without internet.
- **No False-Sync Guarantees**: UI indicators must never mislead caregivers into believing data is saved to the cloud when it remains local.
- **Granular Institutional Access**: Strict server-enforced role separation (Patient, Family, ASHA, Doctor, Hospital, NGO, Admin).

---

## 3. Considered Options

1. **Option A (Traditional Cloud SPA)**: Standard React app calling Firebase / REST APIs with mandatory login. (Rejected: completely fails offline; password barrier blocks patients).
2. **Option B (Native Android App with Room DB)**: Kotlin/Jetpack Compose Android app. (Rejected: high maintenance barrier across iOS/web; cannot be instantly opened via QR code or URL).
3. **Option C (Offline-First PWA with Dual-Identity RBAC)**: Workbox PWA + client-side queue + server-side Flask SQLite with WAL mode + Device-as-Identity for patients and JWT for staff. (Selected).

---

## 4. Decision Outcome

We decided to implement **Option C**.

### Positive Consequences
- Patients access games and aids instantly without any authentication friction.
- Data is preserved locally and queued safely across reboots and outages.
- Workbox Service Worker denylists `/api/*`, ensuring the sync engine never caches false HTTP 200 responses.
- Clinicians and ASHAs receive tailored, scoped dashboards via verified JWT claims.

### Negative Consequences
- Device-as-identity associates metrics with a hardware browser profile rather than a human individual, requiring separate profiles for shared devices.
- Local storage must be curated to avoid browser storage quota eviction.
