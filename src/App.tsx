import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { PatientLayout } from './components/layout/PatientLayout';
import { PatientHomeScreen } from './components/patient/PatientHomeScreen';
import { GameHub } from './screens/GameHub';
import { MemoryMatch } from './games/MemoryMatch';
import { DailySequence } from './games/DailySequence';
import { CaregiverDashboard } from './screens/CaregiverDashboard';
import { TriageChatbot } from './screens/TriageChatbot';
import { MyDay, Reminders, Memories, Settings } from './screens/PlaceholderScreens';

/**
 * COGNIVA Application — Phase 1 + 2 + 3 + 4 + RBAC
 *
 * Routes:
 *   /                        → Patient Home Screen
 *   /my-day                  → My Day (placeholder)
 *   /reminders               → Reminders (placeholder)
 *   /memories                → Memories (placeholder)
 *   /settings                → Settings (placeholder)
 *   /games                   → Game Hub
 *   /games/memory-match      → Memory Match
 *   /games/daily-sequence    → Daily Sequence
 *   /caregiver               → Caregiver Analytics Dashboard (Protected: Hospital, NGO, Family)
 *   /dashboard               → Caregiver Dashboard (alias — wired from "Family" card)
 *   /triage                  → Offline Clinical Triage Chatbot
 */
export default function App() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppShell>
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

                {/* ── Placeholder screens ─────────────────────────────────────── */}
                <Route path="/my-day"    element={<MyDay />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="/memories"  element={<Memories />} />
                <Route path="/settings"  element={<Settings />} />

                {/* ── Game Hub ─────────────────────────────────────────────────── */}
                <Route path="/games" element={<GameHub />} />

                {/* ── Individual games — full-screen, no bottom nav ───────────── */}
                <Route path="/games/memory-match"   element={<MemoryMatch />} />
                <Route path="/games/daily-sequence" element={<DailySequence />} />

                {/* ── Caregiver Dashboard (RBAC Protected: Hospital, NGO, Family) */}
                <Route
                  path="/caregiver"
                  element={
                    <ProtectedRoute allowedRoles={['Hospital', 'NGO', 'Family']}>
                      <CaregiverDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['Hospital', 'NGO', 'Family']}>
                      <CaregiverDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* ── Offline Rule-Based Triage Chatbot ───────────────────────── */}
                <Route path="/triage"     element={<TriageChatbot />} />
              </Routes>
            </AppShell>
          </AuthProvider>
        </LanguageProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}
