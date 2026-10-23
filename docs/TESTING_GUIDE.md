# COGNIVA Comprehensive Testing Guide

---

## 1. Automated Test Execution

### 1.1 Backend RBAC & API Tests
Run the comprehensive 7-scenario RBAC suite in `backend/test_rbac.py`:
```powershell
cd backend
python test_rbac.py
```
**Expected Outcome**: `Ran 7 tests in 0.033s ... OK (All 7 passed)`.

Verifies:
- Public endpoint access (`/api/health`, `/api/schemes`)
- Patient unauthenticated access to caregiver endpoints is rejected (HTTP 401)
- NGO regional scoping (Assam sees 12 sessions, Meghalaya sees 3)
- Hospital aggregate data scoping
- ASHA worker regional assignment filtering

### 1.2 Backend Adaptive Difficulty Engine Tests
Run the 8-scenario difficulty state machine test:
```powershell
cd backend
python test_backend.py
```
**Expected Outcome**: 8/8 adaptive scenarios pass (Good memory performance upgrades level, poor/abandoned performance degrades level gracefully).

### 1.3 Frontend TypeScript & PWA Build Verification
```powershell
npm run build
```
**Expected Outcome**:
- `tsc -b` compiles without errors (`0` exit code).
- Vite bundles all code into code-split chunks.
- Workbox generates production Service Worker (`dist/sw.js`).

---

## 2. Manual Verification Checklist

| Scenario | Steps | Expected Result |
|---|---|---|
| **PWA Offline Mode** | Open DevTools Network tab -> Set "Offline". Reload page. | App loads instantly from Service Worker precache. |
| **False-Sync Prevention** | Complete a game while offline. Look at header sync pill. | Shows "🟠 1 Pending" or "⚪ Offline". Never shows "🟢 Synced". |
| **Sync Recovery** | Switch Network back to "Online". | Sync pill transitions to "🟡 Syncing...", then "🟢 Synced" upon server ack. |
| **Clock Draw Canvas** | Navigate to `/games/clock-draw`. Draw clock hands. | Strokes render smoothly at High-DPI; Clear and Undo work. |
| **Tremor Telemetry** | Navigate to `/games/tremor-telemetry`. Hold still for 5s. | 5s countdown completes; RMS acceleration computed and saved. |
