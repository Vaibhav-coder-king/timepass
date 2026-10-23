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

  // Active full-screen games: intentional focused interaction layout without nav occlusion
  const isIndividualGame =
    location.pathname.startsWith('/games/') && location.pathname !== '/games';

  return (
    <div
      id="app-shell"
      className="min-h-screen bg-cogniva-gradient flex flex-col relative text-[rgb(var(--color-text-primary))]"
      aria-label="COGNIVA Application"
    >
      {/* Main content area */}
      <main
        id="main-content"
        tabIndex={-1}
        className={`flex-1 w-full max-w-lg mx-auto overflow-x-hidden ${
          isIndividualGame ? 'pb-0' : 'pb-24'
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
