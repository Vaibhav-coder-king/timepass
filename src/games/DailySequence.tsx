import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowUp, ArrowDown, Volume2 } from 'lucide-react';
import { getCurrentLevel } from '../utils/adaptiveEngine';
import { saveSession } from '../utils/storage';
import { syncPendingSessions } from '../services/syncService';
import { GameHeader, StatsBar, CompletionScreen } from './GameShared';
import { useLanguage, type DictionaryKey } from '../context/LanguageContext';
import { useOfflineAudio } from '../hooks/useOfflineAudio';

// ─── Question bank ────────────────────────────────────────────────────────────

interface Activity {
  id: string;
  emoji: string;
  label: string;
}

interface Question {
  promptKey: DictionaryKey;
  promptFallback: string;
  correctOrder: Activity[];
}

const QUESTIONS: Question[] = [
  {
    promptKey: 'game.sequence.morningPrompt',
    promptFallback: 'Arrange these morning activities:',
    correctOrder: [
      { id: 'wake',  emoji: '🌅', label: 'Wake Up' },
      { id: 'tea',   emoji: '☕', label: 'Drink Tea' },
      { id: 'med',   emoji: '💊', label: 'Take Medicine' },
    ],
  },
  {
    promptKey: 'game.sequence.rightOrderPrompt',
    promptFallback: 'Put these in the right order:',
    correctOrder: [
      { id: 'brush', emoji: '🪥', label: 'Brush Teeth' },
      { id: 'bath',  emoji: '🚿', label: 'Take Bath' },
      { id: 'dress', emoji: '👕', label: 'Get Dressed' },
    ],
  },
  {
    promptKey: 'game.sequence.eveningPrompt',
    promptFallback: 'Arrange these evening activities:',
    correctOrder: [
      { id: 'walk', emoji: '🚶', label: 'Evening Walk' },
      { id: 'dine', emoji: '🍽️', label: 'Have Dinner' },
      { id: 'read', emoji: '📖', label: 'Read a Book' },
    ],
  },
  {
    promptKey: 'game.sequence.mealPrompt',
    promptFallback: 'Put these meal-time steps in order:',
    correctOrder: [
      { id: 'wash', emoji: '🤲', label: 'Wash Hands' },
      { id: 'eat',  emoji: '🍛', label: 'Eat Meal' },
      { id: 'rest', emoji: '🛋️', label: 'Rest a While' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestion(): Question {
  return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
}

function isCorrect(items: Activity[], correct: Activity[]): boolean {
  return items.every((item, i) => item.id === correct[i].id);
}

function formatTime(sec: number): string {
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
}

// ─── DailySequence ────────────────────────────────────────────────────────────

type Phase = 'playing' | 'complete';

export function DailySequence() {
  const navigate = useNavigate();
  const level    = getCurrentLevel();
  const { t }    = useLanguage();

  const [question,    setQuestion]    = useState<Question>(pickQuestion);
  const [items,       setItems]       = useState<Activity[]>(() => shuffle(question.correctOrder));
  const [phase,       setPhase]       = useState<Phase>('playing');
  const [errorCount,  setErrorCount]  = useState(0);
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [wrongShake,  setWrongShake]  = useState(false);
  const [miraMessage, setMiraMessage] = useState('');

  const promptText = t(question.promptKey) || question.promptFallback;
  const hintText = t('game.sequence.hint');
  const fullInstruction = `${promptText} ${hintText}`;

  const { speak, isSpeaking, isMuted, toggleMute } = useOfflineAudio({
    autoSpeakText: fullInstruction,
  });

  // Timer — starts on first arrow press
  const startTimeRef     = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedSec,  setElapsedSec]  = useState(0);

  const startTimer = useCallback(() => {
    if (startTimeRef.current !== null) return;
    startTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current !== null)
        setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Move item ───────────────────────────────────────────────────────────────
  const moveItem = useCallback((index: number, dir: 'up' | 'down') => {
    startTimer();
    setItems(prev => {
      const next = [...prev];
      const target = dir === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, [startTimer]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (isCorrect(items, question.correctOrder)) {
      stopTimer();
      const timeTaken = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;
      const msg =
        errorCount === 0
          ? 'Flawless sequence! Your daily routine memory is wonderful.'
          : 'You worked it out beautifully. Every attempt helps your memory grow.';
      saveSession({ game: 'DAILY_SEQUENCE', time_taken_sec: timeTaken, error_count: errorCount, difficulty: 'EASY', level });
      syncPendingSessions(); // auto-trigger offline bridge
      setSyncTrigger(t => t + 1);
      setMiraMessage(msg);
      setPhase('complete');
    } else {
      setErrorCount(e => e + 1);
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 600);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    stopTimer();
    startTimeRef.current = null;
    const q = pickQuestion();
    setQuestion(q);
    setItems(shuffle(q.correctOrder));
    setErrorCount(0);
    setElapsedSec(0);
    setPhase('playing');
    setWrongShake(false);
    const nextPrompt = t(q.promptKey) || q.promptFallback;
    speak(`${nextPrompt} ${hintText}`);
  };

  // ── Completion ──────────────────────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <CompletionScreen
        title={errorCount === 0 ? 'Perfect sequence! 🌸' : "That's exactly right! 🌸"}
        miraMessage={miraMessage}
        timeLabel={formatTime(elapsedSec)}
        errorCount={errorCount}
        onPlayAgain={handleReset}
        onHome={() => navigate('/games')}
        syncTrigger={syncTrigger}
      />
    );
  }

  const feedbackMsg =
    errorCount > 0
      ? wrongShake
        ? "Not quite — give it another try!"
        : `${errorCount} attempt${errorCount !== 1 ? 's' : ''} — you're getting closer!`
      : null;

  // ── Game board ──────────────────────────────────────────────────────────────
  return (
    <div
      className="h-[100dvh] w-full flex flex-col overflow-hidden"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* Header */}
      <GameHeader
        title="Daily Sequence"
        onBack={() => navigate('/games')}
        onReset={handleReset}
        syncTrigger={syncTrigger}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isSpeaking={isSpeaking}
      />

      {/* Stats */}
      <StatsBar
        leftLabel="Time"
        leftValue={formatTime(elapsedSec)}
        rightLabel="Tries"
        rightValue={String(errorCount)}
        rightColor="rgb(var(--color-secondary))"
      />

      {/* Main */}
      <main className="flex-1 flex flex-col px-4 pt-2 pb-4 gap-3 overflow-hidden">
        {/* Prompt with localized text and TTS replay speaker button */}
        <div className="flex items-center justify-center gap-2">
          <p
            className="text-center font-semibold text-[rgb(var(--color-text-primary))]"
            style={{ fontSize: 'var(--text-base)' }}
          >
            {promptText}
          </p>
          <button
            onClick={() => speak(fullInstruction)}
            aria-label={t('game.audio.listenAgain')}
            title={t('game.audio.listenAgain')}
            className="flex items-center justify-center p-1.5 rounded-xl text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.1)] active:scale-95 transition-all flex-shrink-0 border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          >
            <Volume2
              className={`w-4 h-4 ${
                isSpeaking && !isMuted ? 'animate-pulse text-[rgb(var(--color-primary))]' : ''
              }`}
            />
          </button>
        </div>

        {/* Orderable rows */}
        <motion.div
          className="flex flex-col gap-2"
          animate={wrongShake ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {items.map((item, index) => (
            <ActivityRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              onMoveUp={()   => moveItem(index, 'up')}
              onMoveDown={() => moveItem(index, 'down')}
            />
          ))}
        </motion.div>

        {/* Feedback toast */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              key={feedbackMsg}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              aria-live="polite"
              className="text-center rounded-2xl px-4 py-2"
              style={{
                background: 'rgba(249,115,22,0.1)',
                border: '1.5px solid rgba(249,115,22,0.25)',
                color: 'rgb(194,65,12)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
              }}
            >
              {feedbackMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint */}
        <p
          className="text-center text-[rgb(var(--color-text-secondary))]"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          {hintText}
        </p>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full font-bold rounded-3xl text-white flex items-center justify-center gap-2 transition-transform active:scale-95 mt-auto flex-shrink-0 border-2 border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          style={{
            height: 64,
            fontSize: 'var(--text-lg)',
            background: 'rgb(var(--color-primary))',
            boxShadow: 'var(--shadow-float)',
          }}
          aria-label="Submit my sequence order"
        >
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          That's My Order
        </button>
      </main>
    </div>
  );
}

// ─── ActivityRow ──────────────────────────────────────────────────────────────
// Large card row with position badge, big emoji, label, and massive arrow buttons

interface ActivityRowProps {
  item: Activity;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ActivityRow({ item, index, total, onMoveUp, onMoveDown }: ActivityRowProps) {
  return (
    <motion.div
      layout
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="flex items-center gap-3 rounded-2xl px-4"
      style={{
        minHeight: 80,
        background: 'rgb(var(--color-surface-card))',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Position number */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          background: 'rgba(var(--color-primary),0.12)',
          color: 'rgb(var(--color-primary))',
          fontSize: 'var(--text-base)',
        }}
      >
        {index + 1}
      </div>

      {/* Emoji — text-6xl for maximum readability for elderly users */}
      <span className="text-5xl flex-shrink-0" aria-hidden="true">{item.emoji}</span>

      {/* Label */}
      <span
        className="flex-1 font-bold text-[rgb(var(--color-text-primary))] min-w-0 truncate"
        style={{ fontSize: 'var(--text-lg)' }}
      >
        {item.label}
      </span>

      {/* Arrow buttons — kept wide for elderly touch targets */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label={`Move ${item.label} up`}
          className="flex items-center justify-center rounded-xl transition-colors disabled:opacity-25 hover:bg-[rgba(var(--color-primary),0.1)] border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          style={{ width: 52, height: 36, color: 'rgb(var(--color-primary))' }}
        >
          <ArrowUp className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label={`Move ${item.label} down`}
          className="flex items-center justify-center rounded-xl transition-colors disabled:opacity-25 hover:bg-[rgba(var(--color-primary),0.1)] border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          style={{ width: 52, height: 36, color: 'rgb(var(--color-primary))' }}
        >
          <ArrowDown className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
