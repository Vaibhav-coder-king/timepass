import { useCallback, useRef } from 'react';
import type { MiraState } from '../types/types';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useAccessibility } from '../context/AccessibilityContext';

interface UseMiraVoiceStateOptions {
  onTranscript: (text: string) => void;
  onStateChange: (state: MiraState) => void;
  onError: (message: string) => void;
}

interface UseMiraVoiceStateReturn {
  startListening: () => void;
  stopListening: () => void;
}

/**
 * Manages MIRA voice state machine:
 * idle → listening → processing → speaking → idle
 */
export function useMiraVoiceState({
  onTranscript,
  onStateChange,
  onError,
}: UseMiraVoiceStateOptions): UseMiraVoiceStateReturn {
  const { settings } = useAccessibility();
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
  };

  const handleFinalTranscript = useCallback(
    (text: string) => {
      clearTimer();
      onTranscript(text);
      onStateChange('processing');
    },
    [onTranscript, onStateChange]
  );

  const handleError = useCallback(
    (message: string) => {
      clearTimer();
      onError(message);
    },
    [onError]
  );

  const handleInterim = useCallback(
    (text: string) => {
      onTranscript(text);
    },
    [onTranscript]
  );

  const { startListening, stopListening } = useSpeechRecognition({
    languageCode: `${settings.languageCode}-${settings.languageCode.toUpperCase()}`,
    onInterimTranscript: handleInterim,
    onFinalTranscript: handleFinalTranscript,
    onError: handleError,
  });

  const start = useCallback(() => {
    clearTimer();
    onStateChange('listening');
    startListening();
  }, [startListening, onStateChange]);

  const stop = useCallback(() => {
    clearTimer();
    stopListening();
  }, [stopListening]);

  return { startListening: start, stopListening: stop };
}
