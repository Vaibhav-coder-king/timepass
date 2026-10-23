import { motion } from 'framer-motion';
import { ArrowLeft, Brain, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SyncIndicator } from '../components/SyncIndicator';
import { getUnsyncedCount } from '../utils/storage';
import { useState } from 'react';

// ─── Game card data ───────────────────────────────────────────────────────────

interface GameCardData {
  id: string;
  route: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: { from: string; to: string };
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
    gradient: { from: 'rgb(236,220,255)', to: 'rgb(221,196,255)' },
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
    gradient: { from: 'rgb(255,235,205)', to: 'rgb(255,215,175)' },
    iconBg: 'rgb(249,115,22)',
    difficulty: 'Easy — 3 steps',
    duration: 'About 2 minutes',
  },
  {
    id: 'clock-draw',
    route: '/games/clock-draw',
    emoji: '🕐',
    title: 'Clock Draw',
    subtitle: 'Draw what you see',
    description:
      'Draw a clock face — a gentle exercise for visual memory and spatial thinking.',
    gradient: { from: 'rgb(220,242,255)', to: 'rgb(196,232,255)' },
    iconBg: 'rgb(14,165,233)',
    difficulty: 'Medium — hand-drawn',
    duration: 'About 3 minutes',
  },
  {
    id: 'audio-stroop',
    route: '/games/audio-stroop',
    emoji: '🎧',
    title: 'Listen & Tap',
    subtitle: 'Match what you hear',
    description:
      'Listen to a word and tap the right colour — tests attention across Assamese, Hindi, and English.',
    gradient: { from: 'rgb(220,255,231)', to: 'rgb(196,255,215)' },
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
    gradient: { from: 'rgb(255,246,220)', to: 'rgb(255,237,196)' },
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
    gradient: { from: 'rgb(255,228,240)', to: 'rgb(255,208,228)' },
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
    gradient: { from: 'rgb(237,233,254)', to: 'rgb(221,214,254)' },
    iconBg: 'rgb(139,92,246)',
    difficulty: 'Easy — sensor based',
    duration: 'About 1 minute',
  },
  {
    id: 'pattern-match',
    route: '/games/pattern-match',
    emoji: '🦚',
    title: 'Pattern Match',
    subtitle: 'Find the pair',
    description:
      'Match beautiful patterns inspired by Assamese silk, Bihu icons, and Kaziranga wildlife.',
    gradient: { from: 'rgb(240,253,244)', to: 'rgb(220,252,231)' },
    iconBg: 'rgb(16,185,129)',
    difficulty: 'Easy — tap to match',
    duration: 'About 3 minutes',
  },
];

// ─── GameHub ──────────────────────────────────────────────────────────────────

export function GameHub() {
  const navigate = useNavigate();
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
          aria-label="Go back to Home"
          className="flex items-center justify-center rounded-2xl w-14 h-14 transition-all active:scale-95 active:opacity-75 hover:bg-[rgba(var(--color-primary),0.08)]"
          style={{ color: 'rgb(var(--color-text-secondary))' }}
        >
          <ArrowLeft className="w-7 h-7" />
        </button>

        <div className="text-center">
          <h1
            className="font-extrabold text-[rgb(var(--color-text-primary))]"
            style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-2xl)' }}
          >
            Let's Play
          </h1>
          <p className="text-[rgb(var(--color-text-secondary))]" style={{ fontSize: 'var(--text-sm)' }}>
            Choose a game to begin
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
            className="w-full text-left rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${card.gradient.from} 0%, ${card.gradient.to} 100%)`,
              boxShadow: '0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
              minHeight: 180,
            }}
          >
            <div className="flex items-start gap-5 p-7">
              {/* Icon */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-2xl"
                aria-hidden="true"
                style={{
                  width: 72,
                  height: 72,
                  background: card.iconBg,
                  fontSize: 36,
                  boxShadow: `0 4px 16px rgba(0,0,0,0.18)`,
                }}
              >
                {card.emoji}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2
                  className="font-extrabold text-[rgb(var(--color-text-primary))] leading-tight"
                  style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-2xl)' }}
                >
                  {card.title}
                </h2>
                <p
                  className="font-semibold mt-0.5 text-[rgb(var(--color-text-secondary))]"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  {card.subtitle}
                </p>
                <p
                  className="mt-2 text-[rgb(var(--color-text-primary))] leading-relaxed"
                  style={{ fontSize: 'var(--text-base)', opacity: 0.75 }}
                >
                  {card.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {[card.difficulty, card.duration].map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full font-semibold"
                      style={{
                        background: 'rgba(255,255,255,0.55)',
                        fontSize: 'var(--text-xs)',
                        color: 'rgb(var(--color-text-primary))',
                        backdropFilter: 'blur(4px)',
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
              className="flex items-center justify-center py-3 font-bold"
              style={{
                background: 'rgba(255,255,255,0.35)',
                fontSize: 'var(--text-lg)',
                color: 'rgb(var(--color-text-primary))',
                backdropFilter: 'blur(6px)',
              }}
            >
              Tap to Play →
            </div>
          </motion.button>
        ))}

        {/* Progress summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: 'rgb(var(--color-surface-card))',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 52,
              height: 52,
              background: 'rgba(var(--color-primary), 0.1)',
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
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'rgba(249,115,22,0.08)',
              border: '1.5px solid rgba(249,115,22,0.2)',
            }}
          >
            <List className="w-5 h-5 flex-shrink-0" style={{ color: 'rgb(194,65,12)' }} aria-hidden="true" />
            <p style={{ fontSize: 'var(--text-sm)', color: 'rgb(194,65,12)', fontWeight: 600 }}>
              {getUnsyncedCount()} game result{getUnsyncedCount() !== 1 ? 's' : ''} saved on this device — will sync when connected.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
