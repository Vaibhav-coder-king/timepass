# COGNIVA API Specification

Version: 2.0.0  
Base URL: `/api`  
Protocol: HTTP / JSON  

---

## 1. Authentication & Headers

COGNIVA supports dual authentication modes:
1. **Staff / Institutional Access**: JWT bearer token in standard Authorization header.
   ```http
   Authorization: Bearer <jwt_token>
   ```
2. **Patient Device Access**: Device-as-identity header using persistent UUID.
   ```http
   X-Device-ID: <device_uuid>
   ```

---

## 2. Endpoints

### 2.1 User Login & Patient Enrolment
- **Path**: `POST /api/login`
- **Access**: Public
- **Description**: Authenticates staff users with username and password, or accepts device-as-identity for zero-password patient pass-through.
- **Request Body (Staff)**:
  ```json
  {
    "username": "dr_barua",
    "password": "Password123!"
  }
  ```
- **Request Body (Patient Device Enrolment)**:
  ```json
  {
    "device_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "Doctor",
    "user_id": 4,
    "display_name": "Dr. Barua (Neurologist)",
    "region": "Assam"
  }
  ```

---

### 2.2 Offline Session Sync
- **Path**: `POST /api/sync`
- **Access**: All Authenticated Roles (or valid `X-Device-ID`)
- **Description**: Ingests a batch of completed or abandoned cognitive game sessions recorded offline on client devices.
- **Request Body**:
  ```json
  [
    {
      "session_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "patient_id": "dev_alpha_01",
      "game_type": "CLOCK_DRAW",
      "module_version": "1.0.0",
      "difficulty": "MEDIUM",
      "started_at": "2026-10-22T10:00:00Z",
      "ended_at": "2026-10-22T10:02:45Z",
      "duration_seconds": 165,
      "score": 85,
      "max_score": 100,
      "completed": true,
      "metrics": {
        "stroke_count": 28,
        "undo_count": 1,
        "visuospatial_index": 92
      },
      "schema_version": 2,
      "client_created_at": "2026-10-22T10:02:46Z",
      "device_id": "dev_alpha_01"
    }
  ]
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "synced": 1,
    "acknowledged_ids": ["9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"]
  }
  ```

---

### 2.3 Longitudinal Analytics & Radar Scores
- **Path**: `GET /api/analytics`
- **Access**: Doctor, Hospital, NGO, Admin, Family (scoped)
- **Query Parameters**:
  - `patient_id` *(optional)*: Filter by pseudonymous patient ID
  - `region` *(optional)*: Scoped automatically by token or overridden by Admin
- **Success Response (200 OK)**:
  ```json
  {
    "total_sessions": 45,
    "total_patients": 12,
    "compliance_rate": 84.5,
    "radar_scores": [
      { "domain": "Visuospatial", "score": 82, "module": "Clock Draw" },
      { "domain": "Attention", "score": 74, "module": "Audio Stroop" },
      { "domain": "Orientation", "score": 90, "module": "Reality Anchor" },
      { "domain": "Acoustic Recall", "score": 68, "module": "Acoustic Rec." },
      { "domain": "Motor Stability", "score": 88, "module": "Tremor Telemetry" }
    ],
    "MEMORY_MATCH": {
      "labels": ["S1", "S2", "S3"],
      "raw_time": [42.1, 38.5, 35.0],
      "moving_avg_time": [42.1, 40.3, 38.5],
      "raw_errors": [3, 2, 1],
      "moving_avg_errors": [3.0, 2.5, 2.0]
    },
    "DAILY_SEQUENCE": {
      "labels": ["S1", "S2", "S3"],
      "raw_time": [55.0, 48.2, 44.1],
      "moving_avg_time": [55.0, 51.6, 49.1],
      "raw_errors": [2, 1, 0],
      "moving_avg_errors": [2.0, 1.5, 1.0]
    }
  }
  ```

---

### 2.4 Government Elder-Care Schemes Directory
- **Path**: `GET /api/schemes`
- **Access**: Public
- **Description**: Returns verified official Indian senior-citizen welfare and geriatric healthcare schemes cached offline.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "pmjay-70",
      "name": "Ayushman Bharat PM-JAY (Senior Citizens 70+)",
      "ministry": "Ministry of Health and Family Welfare (MoHFW)",
      "helpline": "14555",
      "coverage": "₹5,00,000 / year health cover",
      "category": "Healthcare & Hospitalization"
    }
  ]
  ```

---

### 2.5 Health Check
- **Path**: `GET /api/health`
- **Access**: Public
- **Response**: `{"status": "ok", "version": "2.0.0", "timestamp": "2026-10-22T18:00:00Z"}`
