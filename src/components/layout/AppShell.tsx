import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MiraContextProvider } from '../../context/MiraContext';
import { MiraFloatingButton } from '../mira/MiraFloatingButton';
import { MiraPanel } from '../mira/MiraPanel';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
import { PatientBottomNav } from '../patient/PatientBottomNav';
import { useMira } from '../../context/MiraContext';

// Inner shell that can access MiraContext and React Router location
function AppShellInner({ children }: { children: React.ReactNode }) {
  const { session, activate, dismiss } = useMira();
  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const location = useLocation();

  // Determine layout widths for full responsiveness across 320px -> 1440px+
  const isIndividualGame =
    location.pathname.startsWith('/games/') && location.pathname !== '/games';

  const isWideRoute =
    location.pathname.startsWith('/caregiver') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/govt-hub') ||
    location.pathname.startsWith('/reminders') ||
    location.pathname.startsWith('/memories') ||
    location.pathname === '/games';

  return (
    <div
      id="app-shell"
      className="min-h-screen bg-cogniva-gradient flex flex-col relative text-[rgb(var(--color-text-primary))]"
      aria-label="COGNIVA Application"
    >
      {/* Main content area: Responsive container adapting from mobile 320px to ultrawide */}
      <main
        id="main-content"
        tabIndex={-1}
        className={`flex-1 w-full mx-auto overflow-x-hidden transition-all duration-200 ${
          isIndividualGame
            ? 'max-w-4xl pb-0 px-2 sm:px-4'
            : isWideRoute
            ? 'max-w-5xl lg:max-w-6xl px-3 sm:px-6 pb-28'
            : 'max-w-xl md:max-w-2xl px-3 sm:px-4 pb-28'
        }`}
      >
        {children}
      </main>

      {/* Persistent Bottom Navigation mounted across all primary routes */}
      {!isIndividualGame && <PatientBottomNav />}

      {/* Floating MIRA Voice Assistant Button */}
      {!isIndividualGame && (
        <MiraFloatingButton
          state={session.state}
          onActivate={activate}
        />
      )}

      {/* MIRA Conversational Panel */}
      <MiraPanel
        isOpen={session.isPanelExpanded}
        session={session}
        onClose={dismiss}
      />

      {/* Accessibility Settings Panel */}
      <AccessibilityPanel
        isOpen={isA11yOpen}
        onClose={() => setIsA11yOpen(false)}
      />

      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[rgb(var(--color-primary))] focus:text-white focus:font-semibold"
      >
        Skip to main content
      </a>
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Root layout shell. Provides MiraContext and mounts all global components:
 * - Persistent Bottom Navigation (Home, Play, MIRA, Memories, More)
 * - MiraFloatingButton (persistent across all non-game screens)
 * - MiraPanel
 * - AccessibilityPanel
 * - Skip-to-content accessibility link
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <MiraContextProvider>
      <AppShellInner>{children}</AppShellInner>
    </MiraContextProvider>
  );
}
