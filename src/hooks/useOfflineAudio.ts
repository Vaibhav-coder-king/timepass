import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage, type SupportedLocale } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';

export interface UseOfflineAudioOptions {
  autoSpeakText?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface UseOfflineAudioReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  setIsMuted: (muted: boolean) => void;
  isSupported: boolean;
  currentVoice: SpeechSynthesisVoice | null;
  locale: SupportedLocale;
}

// Map voiceSpeed to speech rates tuned for elderly cognitive clarity
const SPEED_MAP: Record<string, number> = {
  slow: 0.8,
  normal: 0.92,
  fast: 1.05,
};

/**
 * Maps app SupportedLocale to BCP-47 language tags for SpeechSynthesis.
 */
function getLanguageTag(locale: SupportedLocale): string {
  switch (locale) {
    case 'hi':
      return 'hi-IN';
    case 'as':
      return 'as-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}

/**
 * Filters and selects local voice models available on device.
 * Prioritizes voice.localService === true for offline reliability.
 */
function findLocalVoice(
  voices: SpeechSynthesisVoice[],
  locale: SupportedLocale
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  let targets: string[] = [];
  if (locale === 'en') {
    targets = ['en-in', 'en-gb', 'en-us', 'en'];
  } else if (locale === 'hi') {
    targets = ['hi-in', 'hi'];
  } else if (locale === 'as') {
    // Assamese voices: exact match, or fallback to phonetically close Bengali/Hindi if OS lacks Assamese voice pack
    targets = ['as-in', 'as', 'bn-in', 'bn', 'hi-in'];
  }

  const localVoices = voices.filter(v => v.localService);

  // 1. Try local service voices matching target language tags in priority order
  for (const tag of targets) {
    const matched = localVoices.find(v =>
      v.lang.toLowerCase().replace('_', '-').startsWith(tag)
    );
    if (matched) return matched;
  }

  // 2. Try any available voice on the device matching target language tags
  for (const tag of targets) {
    const matched = voices.find(v =>
      v.lang.toLowerCase().replace('_', '-').startsWith(tag)
    );
    if (matched) return matched;
  }

  // 3. Fallback: local voice, or default voice
  return localVoices.find(v => v.default) ?? localVoices[0] ?? voices[0] ?? null;
}

/**
 * Custom hook for offline Text-to-Speech (TTS) using native window.speechSynthesis.
 * - Detects language from LanguageContext (en, hi, as)
 * - Automatically reads game instructions aloud using local voice models
 * - Handles onend and cancel to prevent audio overlap
 * - Supports mute toggle linked to global accessibility settings
 */
export function useOfflineAudio(options: UseOfflineAudioOptions = {}): UseOfflineAudioReturn {
  const { autoSpeakText, rate: customRate, pitch: customPitch, onStart, onEnd } = options;

  const { locale } = useLanguage();
  const { settings, setSoundEnabled } = useAccessibility();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  const isMuted = !settings.soundEnabled;

  // Populate voices list and respond to dynamic voiceschanged events
  useEffect(() => {
    if (!isSupported) return;

    const populateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        setVoices(available);
      }
    };

    populateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', populateVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', populateVoices);
    };
  }, [isSupported]);

  // Selected voice for the active language
  const currentVoice = useMemo(() => {
    return findLocalVoice(voices, locale);
  }, [voices, locale]);

  // Stop current speech and cancel synthesis queue
  const stop = useCallback(() => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onstart = null;
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }
    setIsSpeaking(false);
  }, [isSupported]);

  // Toggle mute button
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    if (nextMuted) {
      stop();
    }
    setSoundEnabled(!nextMuted);
  }, [isMuted, stop, setSoundEnabled]);

  const setIsMuted = useCallback(
    (muted: boolean) => {
      if (muted) {
        stop();
      }
      setSoundEnabled(!muted);
    },
    [stop, setSoundEnabled]
  );

  // Read text aloud with local voice models and clean onend handling
  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;
      if (isMuted || !text || !text.trim()) {
        stop();
        return;
      }

      // Stop any pending speech to ensure no audio overlap
      stop();

      const langTag = getLanguageTag(locale);
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;

      utterance.lang = langTag;
      const voice = findLocalVoice(voices, locale);
      if (voice) {
        utterance.voice = voice;
      }

      const speedMultiplier = SPEED_MAP[settings.voiceSpeed] ?? 0.92;
      utterance.rate = customRate ?? speedMultiplier;
      utterance.pitch = customPitch ?? 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        onStart?.();
      };

      utterance.onend = () => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null;
        }
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onerror = (e) => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null;
        }
        setIsSpeaking(false);
        // Do not warn on deliberate cancellation
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Offline speech synthesis notice:', e.error);
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [
      isSupported,
      isMuted,
      locale,
      voices,
      settings.voiceSpeed,
      customRate,
      customPitch,
      stop,
      onStart,
      onEnd,
    ]
  );

  // Automatically read instruction when autoSpeakText changes or game renders
  useEffect(() => {
    if (!autoSpeakText || !autoSpeakText.trim() || isMuted) {
      return;
    }

    const timer = setTimeout(() => {
      speak(autoSpeakText);
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [autoSpeakText, isMuted, locale, speak]);

  // Clean up and cancel audio on component unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
      activeUtteranceRef.current = null;
    };
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isMuted,
    toggleMute,
    setIsMuted,
    isSupported,
    currentVoice,
    locale,
  };
}
