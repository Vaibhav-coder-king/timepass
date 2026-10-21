import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Lock } from 'lucide-react';
import type { PatientActionType, PatientProfile } from '../../types/types';
import { GreetingHeader } from './GreetingHeader';
import { ActionCardGrid } from './ActionCardGrid';
import { useMira } from '../../context/MiraContext';
import { getPatientProfile } from '../../services/geminiService';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';

const ACTION_ROUTES: Partial<Record<PatientActionType, string>> = {
  play:       '/games',
  my_day:     '/my-day',
  reminders:  '/reminders',
  family:     '/dashboard',
};

/**
 * Top-level Patient Home Screen.
 * Shows time-aware greeting + 5 large action cards.
 * "Good Morning, Arun" — the central home screen for elderly dementia patients.
 */
export function PatientHomeScreen() {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { activate } = useMira();
  const navigate = useNavigate();

  // ── Caregiver long-press: hold 🔒 for 1.5s to open dashboard ───────────────
  const lockPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLockPressStart = () => {
    lockPressRef.current = setTimeout(() => navigate('/caregiver'), 1500);
  };
  const handleLockPressEnd = () => {
    if (lockPressRef.current) clearTimeout(lockPressRef.current);
  };

  // Load configured patient profile
  useEffect(() => {
    const profile = getPatientProfile();
    setPatient({
      id: 'pat_cogniva_user',
      displayName: profile.name || 'Arun',
      preferredLanguage: 'en',
    });
  }, []);

  const handleCardSelect = (action: PatientActionType) => {
    if (action === 'talk_to_mira') {
      activate();
      return;
    }
    const route = ACTION_ROUTES[action];
    if (route) navigate(route);
  };

  return (
    <>
      <div className="relative min-h-screen">
        {/* Top-right controls: settings + discreet caregiver lock */}
        <div className="absolute top-6 right-5 z-10 flex items-center gap-2">
          {/* 🔒 Caregiver access — hold 1.5s to navigate */}
          <button
            onPointerDown={handleLockPressStart}
            onPointerUp={handleLockPressEnd}
            onPointerLeave={handleLockPressEnd}
            aria-label="Caregiver access — hold to open"
            title="Hold to open Caregiver Dashboard"
            className="flex items-center justify-center rounded-xl w-10 h-10 transition-all active:scale-90 active:opacity-60"
            style={{
              color: 'rgb(var(--color-text-secondary))',
              opacity: 0.25,
            }}
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open settings"
            title="Settings"
            className="flex items-center justify-center rounded-2xl w-14 h-14 transition-all active:scale-95 active:opacity-80"
            style={{
              background: 'rgba(var(--color-surface-card), 0.8)',
              backdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-card)',
              color: 'rgb(var(--color-text-secondary))',
            }}
          >
            <Settings2 className="w-6 h-6" />
          </button>
        </div>

        {/* Greeting */}
        <GreetingHeader patient={patient} />

        {/* Action Cards */}
        <ActionCardGrid onCardSelect={handleCardSelect} />

        {/* Ambient background decoration */}
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          aria-hidden="true"
          className="fixed bottom-24 left-0 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
            transform: 'translate(-30%, 20%)',
          }}
        />
      </div>

      {/* Accessibility / Settings slide-in panel */}
      <AccessibilityPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
