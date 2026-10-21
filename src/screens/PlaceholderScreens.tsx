import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
export { SettingsScreen as Settings } from './SettingsScreen';

interface PlaceholderProps {
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
}

function PlaceholderScreen({ emoji, title, subtitle, accent }: PlaceholderProps) {
  const navigate = useNavigate();

  return (
    <div
      className="h-[100dvh] w-full flex flex-col overflow-hidden"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
        <motion.button
          onClick={() => navigate('/')}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', damping: 18, stiffness: 300 }}
          aria-label="Back to Home"
          className="flex items-center justify-center rounded-2xl w-14 h-14 active:opacity-80 transition-all"
          style={{
            background: 'rgba(var(--color-primary),0.08)',
            color: 'rgb(var(--color-text-secondary))',
          }}
        >
          <ArrowLeft className="w-7 h-7" />
        </motion.button>
        <h1
          className="font-extrabold text-[rgb(var(--color-text-primary))]"
          style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-xl)' }}
        >
          {title}
        </h1>
        <div className="w-14" aria-hidden="true" />
      </header>

      {/* Content — centred */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.05 }}
          className="text-8xl"
          aria-hidden="true"
        >
          {emoji}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="text-center space-y-2"
        >
          <p
            className="font-extrabold text-[rgb(var(--color-text-primary))]"
            style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-2xl)' }}
          >
            Coming Soon
          </p>
          <p
            className="text-[rgb(var(--color-text-secondary))] max-w-xs mx-auto"
            style={{ fontSize: 'var(--text-base)', lineHeight: 1.55 }}
          >
            {subtitle}
          </p>
        </motion.div>

        {/* Coming soon badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="px-6 py-2.5 rounded-full font-bold"
          style={{
            background: `${accent}18`,
            border: `1.5px solid ${accent}40`,
            color: accent,
            fontSize: 'var(--text-sm)',
          }}
        >
          Being prepared for you with care 💛
        </motion.div>
      </main>

      {/* Back to Home — large bottom button */}
      <div className="px-6 pb-8 pt-3 flex-shrink-0">
        <motion.button
          onClick={() => navigate('/')}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', damping: 18, stiffness: 300 }}
          className="w-full font-bold rounded-3xl text-white flex items-center justify-center gap-3 active:opacity-90 transition-all"
          style={{
            height: 72,
            fontSize: 'var(--text-xl)',
            background: 'rgb(var(--color-primary))',
            boxShadow: 'var(--shadow-float)',
          }}
          aria-label="Go back to Home"
        >
          <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          Back to Home
        </motion.button>
      </div>
    </div>
  );
}

// ─── Individual exports ───────────────────────────────────────────────────────

export function MyDay() {
  return (
    <PlaceholderScreen
      emoji="☀️"
      title="My Day"
      subtitle="Your personalised daily schedule and wellness check-ins will appear here."
      accent="rgb(249,115,22)"
    />
  );
}

export function Reminders() {
  return (
    <PlaceholderScreen
      emoji="🔔"
      title="Reminders"
      subtitle="Medicine times, appointments, and gentle nudges — all in one calm place."
      accent="rgb(16,185,129)"
    />
  );
}

export function Memories() {
  return (
    <PlaceholderScreen
      emoji="📷"
      title="Memories"
      subtitle="Cherished photos and family moments will live here for you to revisit."
      accent="rgb(236,72,153)"
    />
  );
}
