import React from 'react';
import { SafeAreaContainer } from './SafeAreaContainer';

interface PatientLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

/**
 * Patient-facing layout wrapper.
 * - Provides safe-area constraints for elder-friendly touch interactions.
 * - Persistent navigation is provided at the AppShell layer.
 */
export function PatientLayout({ children }: PatientLayoutProps) {
  return (
    <SafeAreaContainer className="flex flex-col min-h-screen">
      <div className="flex-1 w-full">
        {children}
      </div>
    </SafeAreaContainer>
  );
}
