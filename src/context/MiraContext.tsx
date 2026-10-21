import React, { createContext, useCallback, useContext, useState, useRef, useEffect } from 'react';
import type { MiraSessionState, MiraState } from '../types/types';
import { useMiraVoiceState } from '../hooks/useMiraVoiceState';
import { askMira, speakMira, getPatientProfile } from '../services/geminiService';
import { useAccessibility } from './AccessibilityContext';

// ─── Context Shape ──────────────────────────────────────────────────────────

interface MiraContextValue {
  session: MiraSessionState;
  activate: () => void;
  dismiss: () => void;
  togglePanel: () => void;
  askQuestion: (text: string) => Promise<void>;
  setResponseText: (text: string) => void;
  setErrorMessage: (msg: string) => void;
  reset: () => void;
}

// ─── Initial State ───────────────────────────────────────────────────────────

const INITIAL_SESSION: MiraSessionState = {
  state: 'idle',
  transcript: null,
  responseText: null,
  errorMessage: null,
  isPanelExpanded: false,
};

// ─── Context ─────────────────────────────────────────────────────────────────

const MiraContext = createContext<MiraContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function MiraContextProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MiraSessionState>(INITIAL_SESSION);
  const { settings } = useAccessibility();
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSpeakingTimer = () => {
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
  };

  const handleProcessQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;

    clearSpeakingTimer();
    setSession(prev => ({
      ...prev,
      state: 'processing',
      transcript: query,
      errorMessage: null,
    }));

    try {
      const patient = getPatientProfile();
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

      const result = await askMira(query, {
        patientName: patient.name,
        languageCode: settings.languageCode,
        timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'evening' | 'night',
        voiceSpeed: settings.voiceSpeed,
        voiceGender: settings.voiceGender,
      });

      setSession(prev => ({
        ...prev,
        state: 'speaking',
        responseText: result.responseText,
      }));

      // Speak aloud for elderly dementia patients who struggle with reading
      speakMira(result.responseText, {
        languageCode: settings.languageCode,
        speed: settings.voiceSpeed,
        gender: settings.voiceGender,
        soundEnabled: settings.soundEnabled,
      });

      // After estimated reading/speaking time, return to idle
      const wordCount = result.responseText.split(/\s+/).length;
      const durationMs = Math.max(3500, wordCount * 380);
      speakingTimeoutRef.current = setTimeout(() => {
        setSession(prev => ({ ...prev, state: 'idle' }));
      }, durationMs);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Please try speaking again.';
      setSession(prev => ({
        ...prev,
        state: 'error',
        errorMessage: errorMsg,
      }));
    }
  }, [settings]);

  const { startListening, stopListening } = useMiraVoiceState({
    onTranscript: useCallback((transcript: string) => {
      setSession(prev => ({ ...prev, transcript }));
    }, []),
    onStateChange: useCallback((state: MiraState) => {
      setSession(prev => ({ ...prev, state }));
    }, []),
    onError: useCallback((msg: string) => {
      setSession(prev => ({
        ...prev,
        state: 'error',
        errorMessage: msg,
      }));
    }, []),
  });

  // Watch for when voice state transitions to 'processing' and has a transcript
  useEffect(() => {
    if (session.state === 'processing' && session.transcript && !session.responseText) {
      handleProcessQuery(session.transcript);
    }
  }, [session.state, session.transcript, session.responseText, handleProcessQuery]);

  const activate = useCallback(() => {
    clearSpeakingTimer();
    setSession(prev => ({
      ...prev,
      isPanelExpanded: true,
      state: 'listening',
      transcript: null,
      responseText: null,
      errorMessage: null,
    }));
    startListening();
  }, [startListening]);

  const dismiss = useCallback(() => {
    clearSpeakingTimer();
    stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSession(prev => ({
      ...prev,
      isPanelExpanded: false,
      state: 'idle',
    }));
  }, [stopListening]);

  const togglePanel = useCallback(() => {
    setSession(prev => ({ ...prev, isPanelExpanded: !prev.isPanelExpanded }));
  }, []);

  const setResponseText = useCallback((responseText: string) => {
    setSession(prev => ({ ...prev, responseText, state: 'speaking' }));
  }, []);

  const setErrorMessage = useCallback((errorMessage: string) => {
    setSession(prev => ({ ...prev, errorMessage, state: 'error' }));
  }, []);

  const reset = useCallback(() => {
    clearSpeakingTimer();
    stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSession(INITIAL_SESSION);
  }, [stopListening]);

  return (
    <MiraContext.Provider
      value={{
        session,
        activate,
        dismiss,
        togglePanel,
        askQuestion: handleProcessQuery,
        setResponseText,
        setErrorMessage,
        reset,
      }}
    >
      {children}
    </MiraContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMira(): MiraContextValue {
  const ctx = useContext(MiraContext);
  if (!ctx) {
    throw new Error('useMira must be used within MiraContextProvider');
  }
  return ctx;
}
