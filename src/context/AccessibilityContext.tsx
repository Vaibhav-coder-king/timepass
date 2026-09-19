import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { AccessibilitySettings, ContrastMode, TextSize, VoiceSpeed } from '../types/types';

// ─── Default Settings ───────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AccessibilitySettings = {
  textSize: 'large',          // Default to large for elderly users
  contrastMode: 'standard',
  voiceSpeed: 'normal',
  reducedMotion: false,
  soundEnabled: true,
  languageCode: 'en',
};

const STORAGE_KEY = 'cogniva_accessibility';

// ─── Context Shape ──────────────────────────────────────────────────────────

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  setTextSize: (size: TextSize) => void;
  setContrastMode: (mode: ContrastMode) => void;
  setVoiceSpeed: (speed: VoiceSpeed) => void;
  setReducedMotion: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setLanguageCode: (code: string) => void;
  resetToDefaults: () => void;
}

// ─── Context ────────────────────────────────────────────────────────────────

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Apply CSS variable overrides to <html> whenever settings change
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-text-size', settings.textSize);
    html.setAttribute('data-contrast', settings.contrastMode);
    html.setAttribute('data-reduced-motion', String(settings.reducedMotion));
    html.setAttribute('lang', settings.languageCode);

    // Toggle dark class for Tailwind dark mode styling
    if (settings.contrastMode === 'high-contrast') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Silently ignore storage errors
    }
  }, [settings]);

  // Detect OS-level reduced motion preference on mount
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }
    const handler = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTextSize = useCallback((textSize: TextSize) => {
    setSettings(prev => ({ ...prev, textSize }));
  }, []);

  const setContrastMode = useCallback((contrastMode: ContrastMode) => {
    setSettings(prev => ({ ...prev, contrastMode }));
  }, []);

  const setVoiceSpeed = useCallback((voiceSpeed: VoiceSpeed) => {
    setSettings(prev => ({ ...prev, voiceSpeed }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setSettings(prev => ({ ...prev, reducedMotion }));
  }, []);

  const setSoundEnabled = useCallback((soundEnabled: boolean) => {
    setSettings(prev => ({ ...prev, soundEnabled }));
  }, []);

  const setLanguageCode = useCallback((languageCode: string) => {
    setSettings(prev => ({ ...prev, languageCode }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setTextSize,
        setContrastMode,
        setVoiceSpeed,
        setReducedMotion,
        setSoundEnabled,
        setLanguageCode,
        resetToDefaults,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return ctx;
}
