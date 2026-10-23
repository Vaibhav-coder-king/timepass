import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { PatientLayout } from './components/layout/PatientLayout';
import { PatientHomeScreen } from './components/patient/PatientHomeScreen';
import { GameHub } from './screens/GameHub';
import { SettingsScreen } from './screens/SettingsScreen';
import { TriageChatbot } from './screens/TriageChatbot';

// Lazy-loaded patient screens
const MyDayScreen = lazy(() => import('./screens/MyDayScreen').then(m => ({ default: m.MyDayScreen })));
const RemindersScreen = lazy(() => import('./screens/RemindersScreen').then(m => ({ default: m.RemindersScreen })));
const MemoriesScreen = lazy(() => import('./screens/MemoriesScreen').then(m => ({ default: m.MemoriesScreen })));
const GovtHub = lazy(() => import('./screens/GovtHub').then(m => ({ default: m.GovtHub })));
const CaregiverDashboard = lazy(() => import('./screens/CaregiverDashboard').then(m => ({ default: m.CaregiverDashboard })));

// Lazy-loaded cognitive games
const MemoryMatch = lazy(() => import('./games/MemoryMatch').then(m => ({ default: m.MemoryMatch })));
const DailySequence = lazy(() => import('./games/DailySequence').then(m => ({ default: m.DailySequence })));
const CanvasClockDraw = lazy(() => import('./games/CanvasClockDraw').then(m => ({ default: m.CanvasClockDraw })));
const AudioStroop = lazy(() => import('./games/AudioStroop').then(m => ({ default: m.AudioStroop })));
const RealityAnchor = lazy(() => import('./games/RealityAnchor').then(m => ({ default: m.RealityAnchor })));
const AcousticRecognition = lazy(() => import('./games/AcousticRecognition').then(m => ({ default: m.AcousticRecognition })));
const PassiveTremorTelemetry = lazy(() => import('./games/PassiveTremorTelemetry'));
const PatternAssociation = lazy(() => import('./games/PatternAssociation'));

const SuspenseFallback = () => (
  <div
    className="min-h-screen flex items-center justify-center font-bold"
    style={{
      background: 'rgb(var(--color-surface-bg))',
      color: 'rgb(var(--color-text-secondary))',
      fontSize: 'var(--text-xl)',
    }}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin text-3xl">⏳</div>
      <p>Loading COGNIVA…</p>
    </div>
  </div>
);

/**
 * COGNIVA Application — PWA + MIRA AI + Cognitive Games + Multi-Role Dashboards
 *
 * Routes:
 *   /                          → Patient Home Screen
 *   /my-day                    → My Day (Routine tracker)
 *   /reminders                 → Reminders (Medicines & Appointments)
 *   /memories                  → Memories (Patient photo/audio album)
 *   /settings                  → Settings & Accessibility
 *   /games                     → Game Hub (8 Cognitive Games)
 *   /games/memory-match        → Memory Match
 *   /games/daily-sequence      → Daily Sequence
 *   /games/clock-draw          → Clock Draw (Visuospatial construction)
 *   /games/audio-stroop        → Audio Stroop (Attention & inhibition)
 *   /games/reality-anchor      → Reality Anchor (Temporal orientation)
 *   /games/acoustic-recognition→ Acoustic Recognition (Auditory recall)
 *   /games/tremor-telemetry    → Passive Tremor Telemetry (Motor stability)
 *   /games/pattern-match       → Pattern Association (Cultural recall)
 *   /govt-hub                  → Verified Indian Govt Elder-Care Schemes
 *   /caregiver, /dashboard     → Professional Care Portal (7 Roles RBAC)
 *   /triage                    → Offline Clinical Triage Chatbot
 */
export default function App() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppShell>
              <Suspense fallback={<SuspenseFallback />}>
                <Routes>
                  {/* ── Patient Home ────────────────────────────────────────────── */}
                  <Route
                    path="/"
                    element={
                      <PatientLayout activeTab="home">
                        <PatientHomeScreen />
                      </PatientLayout>
                    }
                  />

                  {/* ── Patient screens ─────────────────────────────────────────── */}
                  <Route path="/my-day"    element={<MyDayScreen />} />
                  <Route path="/reminders" element={<RemindersScreen />} />
                  <Route path="/memories"  element={<MemoriesScreen />} />
                  <Route path="/settings"  element={<SettingsScreen />} />
                  <Route path="/govt-hub"  element={<GovtHub />} />

                  {/* ── Game Hub ─────────────────────────────────────────────────── */}
                  <Route path="/games" element={<GameHub />} />

                  {/* ── Individual games — full-screen, no bottom nav ───────────── */}
                  <Route path="/games/memory-match"         element={<MemoryMatch />} />
                  <Route path="/games/daily-sequence"       element={<DailySequence />} />
                  <Route path="/games/clock-draw"           element={<CanvasClockDraw />} />
                  <Route path="/games/audio-stroop"         element={<AudioStroop />} />
                  <Route path="/games/reality-anchor"       element={<RealityAnchor />} />
                  <Route path="/games/acoustic-recognition" element={<AcousticRecognition />} />
                  <Route path="/games/tremor-telemetry"     element={<PassiveTremorTelemetry />} />
                  <Route path="/games/pattern-match"        element={<PatternAssociation />} />

                  {/* ── Multi-Role Professional Caregiver Portal (7 RBAC Roles) ──── */}
                  <Route
                    path="/caregiver"
                    element={
                      <ProtectedRoute allowedRoles={['Hospital', 'NGO', 'Family', 'Doctor', 'ASHA', 'Admin']}>
                        <CaregiverDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['Hospital', 'NGO', 'Family', 'Doctor', 'ASHA', 'Admin']}>
                        <CaregiverDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* ── Offline Rule-Based Triage Chatbot ───────────────────────── */}
                  <Route path="/triage" element={<TriageChatbot />} />
                </Routes>
              </Suspense>
            </AppShell>
          </AuthProvider>
        </LanguageProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}
