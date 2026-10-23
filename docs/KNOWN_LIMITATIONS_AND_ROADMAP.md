# COGNIVA Known Limitations & Strategic Roadmap

---

## 1. Known Architectural Limitations

1. **Client Storage Quotas (`localStorage`)**:
   - High-resolution photographs captured in the **Memories** album are compressed to base64 JPEG and saved in browser `localStorage`.
   - While adequate for standard usage (~20–40 personal photos), extensive memory albums may approach the 5MB–10MB browser domain limit. Migration to IndexedDB is prioritized on the roadmap.
2. **Device-as-Identity in Shared Household Settings**:
   - The zero-password onboarding binds telemetry to the device hardware UUID.
   - If multiple elderly family members share the same phone, their cognitive metrics will be recorded under a shared profile unless separate browser profiles are utilized.
3. **Sensor Availability on Desktop Platforms**:
   - The Passive Tremor Telemetry module depends on the W3C `DeviceMotionEvent`. Most desktop workstations lack accelerometers and automatically trigger the gentle desktop skip option.
4. **Vernacular Speech Synthesis Support**:
   - Assamese text-to-speech relies on system voices (`as-IN`). If the target Android device does not have Assamese voice data installed in Google TTS, it falls back gracefully to Hindi (`hi-IN`) or English (`en-IN`).

---

## 2. Strategic Roadmap

### Phase A: Mobile-Native Hardening (Q1 2027)
- [ ] Migrate memory photo album and session storage from `localStorage` to `idb-keyval` (IndexedDB).
- [ ] Implement Background Sync API (`registration.sync.register('cogniva-sync')`) for zero-interaction background synchronization when WiFi connects.

### Phase B: National Health Integration (Q2 2027)
- [ ] Integration with Ayushman Bharat Digital Mission (ABDM) / Ayushman Bharat Health Account (ABHA).
- [ ] Support voluntary patient linking via 14-digit ABHA ID for longitudinal hospital EHR interoperability.

### Phase C: Advanced Multilingual ML (Q3 2027)
- [ ] Offline ONNX-runtime neural speech synthesis for Assamese, Bodo, and Khasi dialects directly on-device.
- [ ] Automated clock drawing shape recognition scoring using an on-device lightweight convolutional neural network.
