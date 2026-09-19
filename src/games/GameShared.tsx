import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { SyncIndicator } from '../components/SyncIndicator';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';

// ─────────────────────────────────────────────────────────────────────────────
// GameHeader
// Shared top bar for all game screens: back · title · mute · sync + restart
// ─────────────────────────────────────────────────────────────────────────────

interface GameHeaderProps {
  title: string;
  onBack: () => void;
  onReset: () => void;
  syncTrigger: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isSpeaking?: boolean;
  children?: React.ReactNode; // optional stats slot
}

export function GameHeader({
  title,
  onBack,
  onReset,
  syncTrigger,
  isMuted,
  onToggleMute,
  isSpeaking,
  children,
}: GameHeaderProps) {
  const { settings, setSoundEnabled } = useAccessibility();
  const { t } = useLanguage();

  const muted = isMuted ?? !settings.soundEnabled;
  const handleToggleMute = onToggleMute ?? (() => setSoundEnabled(muted));

  return (
    <header
      className="w-full flex flex-col gap-1.5 px-4 pt-4 pb-2 flex-shrink-0"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Go back to game hub"
          className="flex items-center justify-center rounded-2xl active:scale-95 active:opacity-75 transition-all border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          style={{
            width: 56,
            height: 56,
            color: 'rgb(var(--color-text-secondary))',
            background: 'rgba(var(--color-primary),0.07)',
          }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1
          className="font-extrabold text-[rgb(var(--color-text-primary))]"
          style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-xl)' }}
        >
          {title}
        </h1>

        <div className="flex items-center gap-1.5">
          {/* Mute / Unmute TTS voice toggle */}
          <button
            onClick={handleToggleMute}
            aria-label={muted ? t('game.audio.unmute') : t('game.audio.mute')}
            title={muted ? t('game.audio.unmute') : t('game.audio.mute')}
            className={`flex items-center justify-center rounded-2xl active:scale-95 active:opacity-75 transition-all relative border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400 ${
              isSpeaking && !muted ? 'ring-2 ring-[rgb(var(--color-primary))]' : ''
            }`}
            style={{
              width: 56,
              height: 56,
              color: muted ? 'rgb(var(--color-text-secondary))' : 'rgb(var(--color-primary))',
              background: muted ? 'rgba(0,0,0,0.05)' : 'rgba(var(--color-primary),0.12)',
            }}
          >
            {muted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
            {isSpeaking && !muted && (
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[rgb(var(--color-primary))] animate-ping"
                aria-hidden="true"
              />
            )}
          </button>

          <SyncIndicator refreshTrigger={syncTrigger} />
          <button
            onClick={onReset}
            aria-label="Restart game"
            className="flex items-center justify-center rounded-2xl active:scale-95 active:opacity-75 transition-all border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
            style={{
              width: 56,
              height: 56,
              color: 'rgb(var(--color-text-secondary))',
              background: 'rgba(var(--color-primary),0.07)',
            }}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Optional stats row */}
      {children && <div className="flex justify-center">{children}</div>}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatsBar
// TIME | divider | COUNTER inline bar
// ─────────────────────────────────────────────────────────────────────────────

interface StatsBarProps {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  rightColor?: string;
}

export function StatsBar({ leftLabel, leftValue, rightLabel, rightValue, rightColor }: StatsBarProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-1.5 flex-shrink-0">
      <div className="text-center">
        <p
          className="font-bold tabular-nums text-[rgb(var(--color-text-primary))]"
          style={{ fontSize: 'var(--text-lg)' }}
        >
          {leftValue}
        </p>
        <p
          className="font-semibold uppercase tracking-wide"
          style={{ fontSize: '0.65rem', color: 'rgb(var(--color-text-secondary))' }}
        >
          {leftLabel}
        </p>
      </div>

      <div className="w-px h-6" style={{ background: 'rgba(0,0,0,0.1)' }} aria-hidden="true" />

      <div className="text-center">
        <p
          className="font-bold tabular-nums"
          style={{
            fontSize: 'var(--text-lg)',
            color: rightColor ?? 'rgb(var(--color-primary))',
          }}
        >
          {rightValue}
        </p>
        <p
          className="font-semibold uppercase tracking-wide"
          style={{ fontSize: '0.65rem', color: 'rgb(var(--color-text-secondary))' }}
        >
          {rightLabel}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CompletionScreen
// Warm victory screen — shows MIRA's adaptive message, stats, and actions
// ─────────────────────────────────────────────────────────────────────────────

interface CompletionScreenProps {
  title: string;
  miraMessage: string;          // From adaptive engine — warm and encouraging
  timeLabel: string;
  errorCount: number;
  onPlayAgain: () => void;
  onHome: () => void;
  syncTrigger: number;
}

export function CompletionScreen({
  title,
  miraMessage,
  timeLabel,
  errorCount,
  onPlayAgain,
  onHome,
  syncTrigger,
}: CompletionScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* Star */}
      <motion.div
        initial={{ scale: 0.4, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 220, delay: 0.05 }}
        className="text-6xl mb-3"
        aria-hidden="true"
      >
        🌟
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="font-extrabold mb-2 text-[rgb(var(--color-text-primary))]"
        style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-2xl)' }}
      >
        {title}
      </motion.h2>

      {/* MIRA message callout */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.28 }}
        className="flex items-center gap-2 rounded-2xl px-4 py-2.5 mb-4 max-w-xs"
        style={{
          background: 'rgba(var(--color-primary),0.09)',
          border: '1.5px solid rgba(var(--color-primary),0.18)',
        }}
      >
        <span className="text-xl flex-shrink-0" aria-hidden="true">🤖</span>
        <p
          className="text-left font-semibold"
          style={{ fontSize: 'var(--text-sm)', color: 'rgb(var(--color-primary))' }}
        >
          {miraMessage}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        className="flex gap-3 mb-4"
      >
        {[
          { emoji: '⏱️', value: timeLabel, label: 'Time' },
          { emoji: errorCount === 0 ? '✨' : '🔁', value: String(errorCount), label: 'Errors' },
        ].map(({ emoji, value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-2xl"
            style={{
              background: 'rgb(var(--color-surface-card))',
              boxShadow: 'var(--shadow-card)',
              minWidth: 84,
            }}
          >
            <span className="text-xl" aria-hidden="true">{emoji}</span>
            <span
              className="font-extrabold tabular-nums text-[rgb(var(--color-text-primary))]"
              style={{ fontSize: 'var(--text-xl)' }}
            >
              {value}
            </span>
            <span
              className="font-medium text-[rgb(var(--color-text-secondary))]"
              style={{ fontSize: 'var(--text-xs)' }}
            >
              {label}
            </span>
          </div>
        ))}
      </motion.div>

      <SyncIndicator refreshTrigger={syncTrigger} />

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
        className="flex flex-col gap-3 w-full max-w-xs mt-4"
      >
        <button
          onClick={onPlayAgain}
          className="w-full font-bold rounded-3xl text-white flex items-center justify-center transition-transform active:scale-95 border-2 border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          style={{
            height: 64,
            fontSize: 'var(--text-lg)',
            background: 'rgb(var(--color-primary))',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          Play Again
        </button>
        <button
          onClick={onHome}
          className="w-full font-bold rounded-3xl flex items-center justify-center transition-transform active:scale-95 border-2 border-[rgba(var(--color-text-primary),0.15)] dark:bg-slate-800 dark:text-white dark:border-blue-400"
          style={{
            height: 60,
            fontSize: 'var(--text-base)',
            background: 'transparent',
            color: 'rgb(var(--color-text-secondary))',
          }}
        >
          Choose Another Game
        </button>
      </motion.div>
    </motion.div>
  );
}
