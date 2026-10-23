/**
 * COGNIVA Language Context — Comprehensive i18n Engine
 *
 * Supports 20 regional Indian and international languages:
 * English, Hindi, Punjabi, Bengali, Tamil, Telugu, Marathi, Gujarati,
 * Kannada, Malayalam, Odia, Urdu, Assamese, Spanish, French, German,
 * Portuguese, Arabic, Chinese (Simplified), and Japanese.
 *
 * Features:
 * - Immediate reactivity when language changes in Settings
 * - Automatic RTL text direction for Urdu and Arabic
 * - Graceful fallback to English for any missing translation keys
 * - Persisted in AccessibilityContext & localStorage
 */

import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAccessibility } from './AccessibilityContext';
import {
  TRANSLATIONS,
  LANGUAGE_LIST,
  type SupportedLocale,
  type DictionaryKey,
} from './translations';

export { LANGUAGE_LIST };
export type { SupportedLocale, DictionaryKey };

interface LanguageContextValue {
  locale: SupportedLocale;
  t: (key: DictionaryKey) => string;
  dir: 'ltr' | 'rtl';
  supportedLanguages: typeof LANGUAGE_LIST;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { settings } = useAccessibility();

  // Validate locale or fallback gracefully to 'en'
  const targetCode = (settings.languageCode || 'en').toLowerCase();
  const matched = LANGUAGE_LIST.find(l => l.code === targetCode);
  const locale: SupportedLocale = (matched ? matched.code : 'en') as SupportedLocale;
  const dir = locale === 'ur' || locale === 'ar' ? 'rtl' : 'ltr';

  // Synchronize document attributes for language and text direction
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;

  const t = (key: DictionaryKey): string => {
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, t, dir, supportedLanguages: LANGUAGE_LIST }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within <LanguageProvider>');
  }
  return ctx;
}
