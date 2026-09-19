import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import {
  getCurrentLevel,
  getPairsForLevel,
  evaluateAndSave,
  GRID_CLASS_FOR_PAIRS,
  EMOJI_CLASS_FOR_PAIRS,
} from '../utils/adaptiveEngine';
import { saveSession } from '../utils/storage';
import { syncPendingSessions } from '../services/syncService';
import { GameHeader, StatsBar, CompletionScreen } from './GameShared';
import { useLanguage } from '../context/LanguageContext';
import { useOfflineAudio } from '../hooks/useOfflineAudio';

// ─── NE Indian cultural emoji pairs pool ──────────────────────────────────────
// 6 pairs available (Level 4 maximum)

const EMOJI_POOL = [
  { emoji: '🧣', label: 'Gamusa — traditional Assamese cloth' },
  { emoji: '🦏', label: 'One-horned Rhinoceros of Kaziranga' },
  { emoji: '🎋', label: 'Bamboo — symbol of the hills' },
  { emoji: '☕', label: 'Assamese tea from the gardens' },
  { emoji: '🌸', label: 'Orchid — flower of the North East' },
  { emoji: '🐘', label: 'Wild Elephant of Assam' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Card {
  uid: number;       // unique index 0...(2*pairs-1)
  pairId: number;    // 0...(pairs-1)
  emoji: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

type Phase = 'playing' | 'complete';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDeck(pairs: number): Card[] {
  const pool = EMOJI_POOL.slice(0, pairs);
  const cards: Card[] = [];
  pool.forEach(({ emoji, label }, pairId) => {
    cards.push(
      { uid: pairId * 2,     pairId, emoji, label, isFlipped: false, isMatched: false },
      { uid: pairId * 2 + 1, pairId, emoji, label, isFlipped: false, isMatched: false },
    );
  });
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── MemoryMatch ──────────────────────────────────────────────────────────────

export function MemoryMatch() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const instruction = t('game.memory.instruction');

  const { speak, isSpeaking, isMuted, toggleMute } = useOfflineAudio({
    autoSpeakText: instruction,
  });

  // ── Adaptive level ──────────────────────────────────────────────────────────
  const [level]   = useState(() => getCurrentLevel());
  const pairs      = getPairsForLevel(level);
  const gridClass  = GRID_CLASS_FOR_PAIRS[pairs] ?? 'grid-cols-4';
  const emojiClass = EMOJI_CLASS_FOR_PAIRS[pairs] ?? 'text-4xl';

  // ── Game state ──────────────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState<Phase>('playing');
  const [cards,      setCards]      = useState<Card[]>(() => buildDeck(pairs));
  const [selected,   setSelected]   = useState<number[]>([]); // uids of face-up unmatched
  const [errorCount, setErrorCount] = useState(0);
  const [isLocked,   setIsLocked]   = useState(false);
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [miraMessage, setMiraMessage] = useState('');

  // ── AI: Per-move assistance ─────────────────────────────────────────────────
  // 2-Miss Rule: uid → number of times involved in a mismatch
  const [missMap,    setMissMap]    = useState<Record<number, number>>({});
  // uid of card to glow (partner of 2x-missed card)
  const [hintUid,    setHintUid]    = useState<number | null>(null);
  // uid of card to pulse for idle hint
  const [idleHintUid, setIdleHintUid] = useState<number | null>(null);

  // ── Timer ───────────────────────────────────────────────────────────────────
  const startTimeRef  = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedSec,  setElapsedSec] = useState(0);

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

  useEffect(() => () => { stopTimer(); }, [stopTimer]);

  // ── Idle hint: 12-second no-touch timer ────────────────────────────────────
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback((currentCards: Card[]) => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setIdleHintUid(null);
    idleTimerRef.current = setTimeout(() => {
      const unrevealed = currentCards.filter(c => !c.isFlipped && !c.isMatched);
      if (unrevealed.length > 0) {
        const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        setIdleHintUid(pick.uid);
      }
    }, 12_000);
  }, []);

  // Start idle timer on mount
  useEffect(() => { resetIdleTimer(cards); return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Find 2-miss hint partner ────────────────────────────────────────────────
  function findHintPartner(currentCards: Card[], newMissMap: Record<number, number>): number | null {
    for (const [uidStr, count] of Object.entries(newMissMap)) {
      if (count >= 2) {
        const missedCard = currentCards.find(c => c.uid === Number(uidStr));
        if (!missedCard || missedCard.isMatched) continue;
        const partner = currentCards.find(c =>
          c.pairId === missedCard.pairId && c.uid !== missedCard.uid && !c.isFlipped && !c.isMatched
        );
        if (partner) return partner.uid;
      }
    }
    return null;
  }

  // ── Card tap handler ────────────────────────────────────────────────────────
  const handleCardTap = useCallback((uid: number) => {
    if (isLocked) return;

    startTimer();
    resetIdleTimer(cards); // reset 12s idle on every tap

    const card = cards.find(c => c.uid === uid);
    if (!card || card.isFlipped || card.isMatched) return;
    if (selected.includes(uid)) return;

    const newSelected = [...selected, uid];

    // Flip card visually
    const flippedCards = cards.map(c => c.uid === uid ? { ...c, isFlipped: true } : c);
    setCards(flippedCards);

    if (newSelected.length < 2) {
      setSelected(newSelected);
      return;
    }

    // Two cards selected — evaluate
    setIsLocked(true);
    const [aUid, bUid] = newSelected;
    const cardA = flippedCards.find(c => c.uid === aUid)!;
    const cardB = flippedCards.find(c => c.uid === bUid)!;

    if (cardA.pairId === cardB.pairId) {
      // ✅ MATCH
      const matched = flippedCards.map(c =>
        c.uid === aUid || c.uid === bUid ? { ...c, isMatched: true } : c
      );
      setCards(matched);
      setSelected([]);
      setIsLocked(false);
      // Clear any hint on this pair
      if (hintUid === aUid || hintUid === bUid) setHintUid(null);
      if (idleHintUid === aUid || idleHintUid === bUid) setIdleHintUid(null);

      // Win?
      if (matched.every(c => c.isMatched)) {
        stopTimer();
        const timeTaken = startTimeRef.current
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : 0;
        const result = evaluateAndSave({ errors: errorCount, timeSec: timeTaken, level, pairs });
        saveSession({ game: 'MEMORY_MATCH', time_taken_sec: timeTaken, error_count: errorCount, difficulty: 'EASY', level });
        syncPendingSessions(); // auto-trigger offline bridge
        setSyncTrigger(t => t + 1);
        setMiraMessage(result.message);
        setPhase('complete');
      }
    } else {
      // ❌ MISMATCH — Visual Processing Buffer: 2.5 s face-up before flip-back
      const newErrors = errorCount + 1;
      setErrorCount(newErrors);

      const newMissMap = {
        ...missMap,
        [aUid]: (missMap[aUid] ?? 0) + 1,
        [bUid]: (missMap[bUid] ?? 0) + 1,
      };
      setMissMap(newMissMap);
      setHintUid(findHintPartner(flippedCards, newMissMap));

      setTimeout(() => {
        setCards(prev =>
          prev.map(c => c.uid === aUid || c.uid === bUid ? { ...c, isFlipped: false } : c)
        );
        setSelected([]);
        setIsLocked(false);
      }, 2500); // 2.5-second Visual Processing Buffer
    }
  }, [isLocked, cards, selected, startTimer, resetIdleTimer, stopTimer, errorCount, missMap, hintUid, idleHintUid, level, pairs]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    stopTimer();
    startTimeRef.current = null;
    const newCards = buildDeck(pairs);
    setCards(newCards);
    setSelected([]);
    setErrorCount(0);
    setElapsedSec(0);
    setPhase('playing');
    setIsLocked(false);
    setMissMap({});
    setHintUid(null);
    setIdleHintUid(null);
    resetIdleTimer(newCards);
    speak(instruction);
  };

  // ── Completion screen ───────────────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <CompletionScreen
        title="Wonderful work! 🎉"
        miraMessage={miraMessage}
        timeLabel={formatTime(elapsedSec)}
        errorCount={errorCount}
        onPlayAgain={handleReset}
        onHome={() => navigate('/games')}
        syncTrigger={syncTrigger}
      />
    );
  }

  const matchedCount = cards.filter(c => c.isMatched).length / 2;

  // ── Game board ──────────────────────────────────────────────────────────────
  return (
    <div
      className="h-[100dvh] w-full flex flex-col overflow-hidden"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* Header */}
      <GameHeader
        title="Memory Match"
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
        rightLabel={`Pairs ${matchedCount}/${pairs}`}
        rightValue={`${matchedCount}/${pairs}`}
        rightColor="rgb(var(--color-primary))"
      />

      {/* Level badge + localized hint with TTS replay button */}
      <div className="flex items-center justify-between px-4 py-1 flex-shrink-0">
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{
            background: 'rgba(var(--color-primary),0.1)',
            color: 'rgb(var(--color-primary))',
          }}
        >
          Level {level}
        </span>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-[rgb(var(--color-text-secondary))]">
            {instruction}
          </p>
          <button
            onClick={() => speak(instruction)}
            aria-label={t('game.audio.listenAgain')}
            title={t('game.audio.listenAgain')}
            className="flex items-center justify-center p-1 rounded-lg text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.1)] active:scale-95 transition-all border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          >
            <Volume2
              className={`w-4 h-4 ${
                isSpeaking && !isMuted ? 'animate-pulse text-[rgb(var(--color-primary))]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Card Grid — flex-1, centered */}
      <main
        className="flex-1 flex items-center justify-center px-3 py-2 overflow-hidden"
        aria-label="Memory card grid"
      >
        <div className={`grid ${gridClass} gap-2 w-full`}>
          {cards.map(card => (
            <MemoryCard
              key={card.uid}
              card={card}
              emojiClass={emojiClass}
              isHinted={hintUid === card.uid}
              isIdleHint={idleHintUid === card.uid}
              isLocked={isLocked && !card.isMatched && !card.isFlipped}
              onTap={handleCardTap}
            />
          ))}
        </div>
      </main>

      {/* Progress strip */}
      <div className="px-4 pb-3 pt-1 flex-shrink-0">
        <div
          className="rounded-full overflow-hidden"
          style={{ height: 5, background: 'rgba(var(--color-primary),0.12)' }}
          role="progressbar"
          aria-valuenow={matchedCount}
          aria-valuemin={0}
          aria-valuemax={pairs}
          aria-label={`${matchedCount} of ${pairs} pairs found`}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'rgb(var(--color-primary))' }}
            animate={{ width: `${(matchedCount / pairs) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── MemoryCard ───────────────────────────────────────────────────────────────

interface MemoryCardProps {
  card: Card;
  emojiClass: string;
  isHinted: boolean;     // 2-miss rule: glow the correct partner card
  isIdleHint: boolean;   // 12-second idle: pulse a random unrevealed card
  isLocked: boolean;
  onTap: (uid: number) => void;
}

function MemoryCard({ card, emojiClass, isHinted, isIdleHint, isLocked, onTap }: MemoryCardProps) {
  const isVisible = card.isFlipped || card.isMatched;
  const showHint = (isHinted || isIdleHint) && !isVisible;

  return (
    <motion.div
      className="aspect-square relative"
      animate={
        showHint
          ? { scale: [1, 1.06, 1], opacity: [1, 0.85, 1] }
          : {}
      }
      transition={showHint ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <motion.button
        onClick={() => onTap(card.uid)}
        disabled={card.isMatched || (isLocked && !isVisible)}
        aria-label={isVisible ? `${card.label}${card.isMatched ? ' — matched' : ''}` : 'Hidden card'}
        aria-pressed={isVisible}
        whileTap={!card.isMatched && !isLocked ? { scale: 0.91 } : {}}
        className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
        style={{
          outline: showHint
            ? isHinted
              ? '3px solid rgb(251 191 36)' // amber-400 — 2-miss hint
              : '3px solid rgb(167 139 250)' // purple-400 — idle hint
            : 'none',
          outlineOffset: 2,
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          {isVisible ? (
            <motion.div
              key="front"
              initial={{ rotateY: -90 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: 90 }}
              transition={{ duration: 0.22 }}
              className={`absolute inset-0 flex items-center justify-center ${emojiClass} dark:bg-slate-800 dark:text-white dark:border-blue-400 border-2`}
              style={{
                background: card.isMatched ? 'rgb(240 253 244)' : 'rgb(255 251 235)', // green-50 : amber-50
                border: `2px solid ${card.isMatched ? 'rgb(134 239 172)' : 'rgb(253 230 138)'}`,
                borderRadius: '1rem',
              }}
              aria-hidden="true"
            >
              {card.emoji}
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: 90 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: -90 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0 flex items-center justify-center rounded-2xl text-white text-2xl dark:bg-slate-800 dark:text-white dark:border-blue-400 border-2 border-transparent"
              style={{
                background: 'linear-gradient(135deg, rgb(99 102 241) 0%, rgb(168 85 247) 100%)',
              }}
              aria-hidden="true"
            >
              ✦
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
