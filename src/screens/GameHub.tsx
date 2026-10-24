import { motion } from 'framer-motion';
import { ArrowLeft, Brain, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SyncIndicator } from '../components/SyncIndicator';
import { getUnsyncedCount } from '../utils/storage';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

// ─── Game card data ───────────────────────────────────────────────────────────

interface GameCardData {
  id: string;
  route: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  cardClasses: string;
  iconBg: string;
  difficulty: string;
  duration: string;
}

const GAME_CARDS: GameCardData[] = [
  {
    id: 'memory-match',
    route: '/games/memory-match',
    emoji: '🧩',
    title: 'Memory Match',
    subtitle: 'Flip & find pairs',
    description:
      'Find matching pairs of cards featuring familiar symbols from North East India.',
    cardClasses:
      'bg-gradient-to-br from-[#ECDCFF] to-[#DDC4FF] border border-purple-300/50 ' +
      'dark:from-[#1E1938] dark:to-[#17132B] dark:border-purple-500/40',
    iconBg: 'rgb(124,92,252)',
    difficulty: 'Easy — 4 pairs',
    duration: 'About 3 minutes',
  },
  {
    id: 'daily-sequence',
    route: '/games/daily-sequence',
    emoji: '🌅',
    title: 'Daily Sequence',
    subtitle: 'Arrange your day',
    description:
      'Put everyday activities in the right order — a gentle exercise for daily recall.',
    cardClasses:
      'bg-gradient-to-br from-[#FFEBCD] to-[#FFD7AF] border border-amber-300/50 ' +
      'dark:from-[#2B1D13] dark:to-[#20140D] dark:border-amber-500/40',
    iconBg: 'rgb(249,115,22)',
    difficulty: 'Easy — 3 steps',
    duration: 'About 2 minutes',
  },
  {
    id: 'audio-stroop',
    route: '/games/audio-stroop',
    emoji: '🎧',
    title: 'Listen & Tap',
    subtitle: 'Match what you hear',
    description:
      'Listen to a word and tap the right colour — tests attention across Assamese, Hindi, and English.',
    cardClasses:
      'bg-gradient-to-br from-[#DCFFE7] to-[#C4FFD7] border border-emerald-300/50 ' +
      'dark:from-[#10281F] dark:to-[#0C1E17] dark:border-emerald-500/40',
    iconBg: 'rgb(34,197,94)',
    difficulty: 'Medium — audio',
    duration: 'About 4 minutes',
  },
  {
    id: 'reality-anchor',
    route: '/games/reality-anchor',
    emoji: '🗓️',
    title: "Today's World",
    subtitle: 'Stay oriented',
    description:
      "Gentle questions about today's date, season, and place — supporting orientation and awareness.",
    cardClasses:
      'bg-gradient-to-br from-[#FFF6DC] to-[#FFEDC4] border border-yellow-300/50 ' +
      'dark:from-[#292210] dark:to-[#1F190C] dark:border-yellow-500/40',
    iconBg: 'rgb(234,179,8)',
    difficulty: 'Easy — no wrong answers',
    duration: 'About 2 minutes',
  },
  {
    id: 'acoustic-recognition',
    route: '/games/acoustic-recognition',
    emoji: '🔊',
    title: 'Sounds Around',
    subtitle: 'Name that sound',
    description:
      'Listen to everyday sounds — temple bell, rain, flute — and identify them.',
    cardClasses:
      'bg-gradient-to-br from-[#FFE4F0] to-[#FFD0E4] border border-pink-300/50 ' +
      'dark:from-[#2D1424] dark:to-[#220D1A] dark:border-pink-500/40',
    iconBg: 'rgb(236,72,153)',
    difficulty: 'Easy — sound clips',
    duration: 'About 3 minutes',
  },
  {
    id: 'tremor-telemetry',
    route: '/games/tremor-telemetry',
    emoji: '📱',
    title: 'Steady Hand',
    subtitle: 'Hold still for 5 seconds',
    description:
      'Rest your phone on a flat surface while holding it — a gentle way to track hand steadiness over time.',
    cardClasses:
      'bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] border border-indigo-300/50 ' +
      'dark:from-[#1A1636] dark:to-[#131028] dark:border-indigo-500/40',
    iconBg: 'rgb(139,92,246)',
    difficulty: 'Easy — sensor based',
    duration: 'About 1 minute',
  },
];

// ─── GameHub ──────────────────────────────────────────────────────────────────

export function GameHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [syncTrigger] = useState(getUnsyncedCount());

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <button
          onClick={() => navigate('/')}
          aria-label={t('common.backToHome')}
          className="flex items-center justify-center rounded-2xl w-14 h-14 transition-all active:scale-95 active:opacity-75 hover:bg-[rgba(var(--color-primary),0.08)] border border-[rgba(var(--color-text-primary),0.1)] bg-[rgb(var(--color-surface-card))]"
          style={{ color: 'rgb(var(--color-text-primary))' }}
        >
          <ArrowLeft className="w-7 h-7" />
        </button>

        <div className="text-center">
          <h1
            className="font-extrabold text-[rgb(var(--color-text-primary))]"
            style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-2xl)' }}
          >
            {t('play')}
          </h1>
          <p className="text-[rgb(var(--color-text-secondary))]" style={{ fontSize: 'var(--text-sm)' }}>
            {t('prompt')}
          </p>
        </div>

        <SyncIndicator refreshTrigger={syncTrigger} />
      </header>

      {/* Ambient decoration */}
      <div
        aria-hidden="true"
        className="fixed top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
          transform: 'translate(35%, -35%)',
        }}
      />

      {/* Game cards */}
      <main className="flex-1 px-5 pt-4 pb-10 space-y-5">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full font-bold"
            style={{
              background: 'rgba(var(--color-primary), 0.12)',
              color: 'rgb(var(--color-primary))',
              fontSize: 'var(--text-xs)',
            }}
          >
            🎮 6 Brain Games
          </span>
        </div>

        <p
          className="font-medium text-[rgb(var(--color-text-secondary))] mb-2"
          style={{ fontSize: 'var(--text-base)' }}
        >
          Play any game to gently exercise different areas of your mind.
        </p>

        {GAME_CARDS.map((card, index) => (
          <motion.button
            key={card.id}
            onClick={() => navigate(card.route)}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12, duration: 0.45, ease: 'easeOut' }}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            aria-label={`Play ${card.title} — ${card.description}`}
            className={`w-full text-left rounded-3xl overflow-hidden shadow-lg transition-all ${card.cardClasses}`}
            style={{ minHeight: 180 }}
          >
            <div className="flex items-start gap-5 p-7">
              {/* Icon */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-2xl shadow-md"
                aria-hidden="true"
                style={{
                  width: 72,
                  height: 72,
                  background: card.iconBg,
                  fontSize: 36,
                }}
              >
                {card.emoji}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2
                  className="font-extrabold text-neutral-900 dark:text-white leading-tight"
                  style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-2xl)' }}
                >
                  {card.title}
                </h2>
                <p
                  className="font-semibold mt-0.5 text-neutral-700 dark:text-slate-300"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  {card.subtitle}
                </p>
                <p
                  className="mt-2 text-neutral-800 dark:text-slate-200 leading-relaxed font-medium"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  {card.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {[card.difficulty, card.duration].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full font-bold bg-white/75 text-neutral-900 border border-black/5 dark:bg-white/10 dark:text-slate-100 dark:border-white/15 backdrop-blur-sm"
                      style={{
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom play strip */}
            <div
              className="flex items-center justify-center py-3 font-extrabold bg-white/45 text-neutral-900 dark:bg-black/40 dark:text-white dark:border-t dark:border-white/10 backdrop-blur-md"
              style={{
                fontSize: 'var(--text-lg)',
              }}
            >
              {t('play')} →
            </div>
          </motion.button>
        ))}

        {/* Progress summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-5 flex items-center gap-4 border border-[rgba(var(--color-text-primary),0.1)] bg-[rgb(var(--color-surface-card))] shadow-sm"
        >
          <div
            className="flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{
              width: 52,
              height: 52,
              background: 'rgba(var(--color-primary), 0.12)',
              color: 'rgb(var(--color-primary))',
            }}
            aria-hidden="true"
          >
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p
              className="font-bold text-[rgb(var(--color-text-primary))]"
              style={{ fontSize: 'var(--text-lg)' }}
            >
              Keep it up!
            </p>
            <p
              className="text-[rgb(var(--color-text-secondary))]"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              Every game you play strengthens your memory gently over time.
            </p>
          </div>
        </motion.div>

        {/* Saved sessions note */}
        {getUnsyncedCount() > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/25"
          >
            <List className="w-5 h-5 flex-shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {getUnsyncedCount()} game result{getUnsyncedCount() !== 1 ? 's' : ''} saved on this device — will sync when connected.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
