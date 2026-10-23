# COGNIVA Role and Permission Matrix

**System Architecture**: 7-Role Server-Enforced RBAC  

---

## 1. Feature Entitlement Grid

| Feature / Capability | Patient | Family | ASHA | Doctor | Hospital | NGO | Admin |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Zero-Password Client Access** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Play 8 Cognitive Modules** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Personal My Day & Reminders** | ✅ Full | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Personal Memories Album** | ✅ Full | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Browse Government Hub** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Offline Triage Chatbot** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Personal Adherence Dashboard** | ❌ None | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Regional Caseload Monitoring**| ❌ None | ❌ None | ✅ Regional | ❌ None | ✅ Scoped | ✅ Regional | ✅ National |
| **5-Axis Neuro Radar Chart** | ❌ None | ❌ None | ❌ None | ✅ Full | ✅ Full | ❌ None | ✅ Full |
| **Clinical Observation Flags** | ❌ None | ❌ None | ❌ None | ✅ Full | ✅ Full | ❌ None | ✅ Full |
| **Cohort De-identified Trends**| ❌ None | ❌ None | ❌ None | ✅ Full | ✅ Full | ✅ Aggregated | ✅ Full |
| **User & Role Provisioning** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ✅ Full |
| **System Audit Logs** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ✅ Full |

---

## 2. Role Descriptions & Scope

### 2.1 Patient
- **Identity**: Device UUID (`crypto.randomUUID()`)
- **Authentication**: Zero-password hardware-bound token
- **Scope**: Can only generate and store sessions locally; synchronizes pseudonymously.

### 2.2 Family / Primary Caregiver
- **Identity**: Registered account linked to patient device
- **Scope**: Views memory accuracy trends, medication adherence, and configures reminders for their family member.

### 2.3 ASHA (Accredited Social Health Activist)
- **Identity**: Field healthcare worker with regional assignment
- **Scope**: Views all patient compliance rates and pending sync queues within their designated district/block. Cannot view full clinical neurological radar metrics.

### 2.4 Doctor / Neurologist
- **Identity**: Licensed medical professional
- **Scope**: Full clinical visualization including 5-Axis Neuro Radar, longitudinal response latency curves, and observational tremor trends. Subject to mandatory non-diagnostic disclaimers.

### 2.5 Hospital / Health Facility
- **Identity**: Institutional supervisor
- **Scope**: Cross-clinician overview, bed/patient caseload statistics, and department-level activity.

### 2.6 NGO (Non-Governmental Organization)
- **Identity**: Community health program manager
- **Scope**: Aggregated, privacy-preserved cohort metrics to evaluate intervention efficacy across North-East rural districts.

### 2.7 System Administrator
- **Identity**: Platform technical operator
- **Scope**: User credentials, database migration health, sync queue throughput, and immutable audit logs.
