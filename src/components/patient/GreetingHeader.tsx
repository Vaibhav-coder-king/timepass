import { motion } from 'framer-motion';
import { useTimeOfDayGreeting } from '../../hooks/useTimeOfDayGreeting';
import { useLanguage } from '../../context/LanguageContext';
import { BCP47_LOCALE_MAP } from '../../services/geminiService';
import type { PatientProfile } from '../../types/types';

interface GreetingHeaderProps {
  patient: PatientProfile | null;
}

/**
 * Time-aware, localised greeting header.
 * Uses the language selected in Settings to translate the greeting, subtext, and prompt.
 */
export function GreetingHeader({ patient }: GreetingHeaderProps) {
  const { greetingKey, subtextKey, emoji } = useTimeOfDayGreeting();
  const { t, locale } = useLanguage();

  const name = patient?.displayName ?? 'Friend';

  const today = new Date().toLocaleDateString(BCP47_LOCALE_MAP[locale] || 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="px-6 pt-8 pb-6"
    >
      {/* Date */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="font-medium text-[rgb(var(--color-text-secondary))] mb-3"
        style={{ fontSize: 'var(--text-base)' }}
        aria-label={`Today is ${today}`}
      >
        📅 {today}
      </motion.p>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <h1
          className="font-extrabold leading-tight text-[rgb(var(--color-text-primary))]"
          style={{ fontSize: 'var(--text-4xl)', fontFamily: 'Nunito, Inter, sans-serif' }}
        >
          {t(greetingKey)}
          <span className="ml-3" aria-hidden="true">
            {emoji}
          </span>
        </h1>
        <h2
          className="font-bold mt-1 text-gradient-primary"
          style={{ fontSize: 'var(--text-3xl)', fontFamily: 'Nunito, Inter, sans-serif' }}
        >
          {name}
        </h2>
      </motion.div>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-3 text-[rgb(var(--color-text-secondary))]"
        style={{ fontSize: 'var(--text-lg)' }}
      >
        {t(subtextKey)}
      </motion.p>

      {/* Prompt — fully translated */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 font-semibold text-[rgb(var(--color-text-primary))]"
        style={{ fontSize: 'var(--text-xl)' }}
      >
        {t('prompt')}
      </motion.p>
    </motion.header>
  );
}
