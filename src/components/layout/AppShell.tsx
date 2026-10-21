import React, { useState } from 'react';
import { MiraContextProvider } from '../../context/MiraContext';
import { MiraFloatingButton } from '../mira/MiraFloatingButton';
import { MiraPanel } from '../mira/MiraPanel';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
import { useMira } from '../../context/MiraContext';

// Inner shell that can access MiraContext
function AppShellInner({ children }: { children: React.ReactNode }) {
  const { session, activate, dismiss } = useMira();
  const [isA11yOpen, setIsA11yOpen] = useState(false);

  return (
    <div
      id="app-shell"
      className="min-h-screen bg-cogniva-gradient"
      aria-label="COGNIVA Application"
    >
      {/* Main content */}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <MiraFloatingButton
        state={session.state}
        onActivate={activate}
      />

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
 * - MiraFloatingButton (persistent across all screens)
 * - MiraPanel
 * - AccessibilityPanel
 * - Skip-to-content link
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <MiraContextProvider>
      <AppShellInner>{children}</AppShellInner>
    </MiraContextProvider>
  );
}
