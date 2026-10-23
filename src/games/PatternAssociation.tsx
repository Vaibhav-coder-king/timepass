import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { saveSession } from '../utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tile {
  id: number;        // unique index 0-15
  pairId: number;    // which pair (0-7)
  emoji: string;
  label: string;
  revealed: boolean;
  matched: boolean;
}

interface GameState {
  tiles: Tile[];
  flippedIds: number[];   // at most 2 at a time
  pairsMatched: number;
  totalFlips: number;
  errors: number;
  startTimeMs: number | null;
  locked: boolean;        // block input while mis-match animates back
  finished: boolean;
}

// ─── NER Cultural Patterns ────────────────────────────────────────────────────

const NER_PATTERNS: { emoji: string; label: string }[] = [
  { emoji: '🦚', label: 'Peacock – Assam state bird' },
  { emoji: '🌺', label: 'Kopou Phool – Assam state flower' },
  { emoji: '🧵', label: 'Muga silk – golden silk of Assam' },
  { emoji: '🐘', label: 'Kaziranga elephant' },
  { emoji: '🥁', label: 'Dhol – Bihu drum' },
  { emoji: '🦏', label: 'One-horned rhino of Kaziranga' },
  { emoji: '🍵', label: 'Tea garden of Assam' },
  { emoji: '🏔️', label: 'Hills of Meghalaya' },
];

const TOTAL_PAIRS = NER_PATTERNS.length; // 8

// ─── Fisher-Yates shuffle ─────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Initial state factory ────────────────────────────────────────────────────

function buildInitialState(): GameState {
  // Create 2 tiles per pattern
  const raw: Omit<Tile, 'id'>[] = NER_PATTERNS.flatMap((p, pairId) => [
    { pairId, emoji: p.emoji, label: p.label, revealed: false, matched: false },
    { pairId, emoji: p.emoji, label: p.label, revealed: false, matched: false },
  ]);

  const shuffled = shuffle(raw);
  const tiles: Tile[] = shuffled.map((t, idx) => ({ ...t, id: idx }));

  return {
    tiles,
    flippedIds: [],
    pairsMatched: 0,
    totalFlips: 0,
    errors: 0,
    startTimeMs: null,
    locked: false,
    finished: false,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatternAssociation() {
  const navigate = useNavigate();
  const [game, setGame] = useState<GameState>(buildInitialState);
  const mismatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (mismatchTimer.current) clearTimeout(mismatchTimer.current);
    };
  }, []);

  const handleTileTap = useCallback(
    (tileId: number) => {
      setGame((prev) => {
        if (prev.locked) return prev;
        if (prev.finished) return prev;

        const tile = prev.tiles[tileId];
        if (tile.revealed || tile.matched) return prev;

        // Start timer on first tap
        const startTimeMs = prev.startTimeMs ?? Date.now();

        const flippedIds = [...prev.flippedIds, tileId];
        const totalFlips = prev.totalFlips + 1;

        // Reveal the tapped tile
        const tiles = prev.tiles.map((t) =>
          t.id === tileId ? { ...t, revealed: true } : t
        );

        if (flippedIds.length < 2) {
          // First card flipped — wait for second
          return { ...prev, tiles, flippedIds, totalFlips, startTimeMs };
        }

        // Second card flipped — check for match
        const [firstId, secondId] = flippedIds;
        const first = tiles[firstId];
        const second = tiles[secondId];

        if (first.pairId === second.pairId) {
          // ✅ Match
          const matchedTiles = tiles.map((t) =>
            t.id === firstId || t.id === secondId ? { ...t, matched: true, revealed: true } : t
          );
          const pairsMatched = prev.pairsMatched + 1;
          const finished = pairsMatched === TOTAL_PAIRS;

          return {
            ...prev,
            tiles: matchedTiles,
            flippedIds: [],
            pairsMatched,
            totalFlips,
            startTimeMs,
            finished,
          };
        } else {
          // ❌ Mismatch — lock board for 1 second then flip back
          const errors = prev.errors + 1;
          const lockedState: GameState = {
            ...prev,
            tiles,
            flippedIds,
            totalFlips,
            errors,
            startTimeMs,
            locked: true,
          };

          // Schedule flip-back
          mismatchTimer.current = setTimeout(() => {
            setGame((s) => ({
              ...s,
              tiles: s.tiles.map((t) =>
                (t.id === firstId || t.id === secondId) && !t.matched
                  ? { ...t, revealed: false }
                  : t
              ),
              flippedIds: [],
              locked: false,
            }));
          }, 1000);

          return lockedState;
        }
      });
    },
    []
  );

  function handleDone() {
    const elapsed = game.startTimeMs ? (Date.now() - game.startTimeMs) / 1000 : 0;
    saveSession({
      game: 'PATTERN_ASSOCIATION',
      game_type: 'PATTERN_ASSOCIATION',
      time_taken_sec: Math.round(elapsed),
      error_count: game.errors,
      level: 1,
      score: game.pairsMatched,
      max_score: TOTAL_PAIRS,
      duration_seconds: Math.round(elapsed),
      completed: true,
      difficulty: 'EASY',
      metrics: {
        pairs_matched: game.pairsMatched,
        total_flips: game.totalFlips,
        time_seconds: Math.round(elapsed),
        errors: game.errors,
      },
    });
    navigate('/games');
  }

  function handleRestart() {
    if (mismatchTimer.current) clearTimeout(mismatchTimer.current);
    setGame(buildInitialState());
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'rgb(var(--color-surface-bg))',
        color: 'rgb(var(--color-text-primary))',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgb(var(--color-border))',
          background: 'rgb(var(--color-surface-card))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/games')}
            aria-label="Back to games"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgb(var(--color-text-primary))',
              display: 'flex',
              alignItems: 'center',
              padding: 8,
            }}
          >
            <ArrowLeft size={28} />
          </button>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>
            Pattern Association
          </h1>
        </div>

        {/* Score pill */}
        <div
          style={{
            background: 'rgb(var(--color-primary))',
            color: '#fff',
            borderRadius: 999,
            padding: '6px 18px',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
          }}
        >
          {game.pairsMatched} / {TOTAL_PAIRS}
        </div>
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {game.finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{
                background: 'rgb(var(--color-surface-card))',
                borderRadius: 24,
                padding: '40px 32px',
                maxWidth: 380,
                width: '100%',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <span style={{ fontSize: 80 }}>🎉</span>
              <h2
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 800,
                  margin: 0,
                  color: 'rgb(var(--color-text-primary))',
                }}
              >
                Wonderful!
              </h2>
              <p
                style={{
                  fontSize: 'var(--text-lg)',
                  color: 'rgb(var(--color-text-secondary))',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                You matched all the patterns! 🎉
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  width: '100%',
                }}
              >
                <button
                  style={primaryBtn}
                  onClick={handleRestart}
                >
                  Play Again
                </button>
                <button
                  style={secondaryBtn}
                  onClick={handleDone}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitle */}
      <p
        style={{
          textAlign: 'center',
          fontSize: 'var(--text-base)',
          color: 'rgb(var(--color-text-secondary))',
          margin: '16px 16px 8px',
        }}
      >
        Tap two tiles to find matching NER cultural symbols
      </p>

      {/* Grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          padding: '12px 16px 24px',
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
          alignContent: 'start',
        }}
        role="grid"
        aria-label="Pattern matching grid"
      >
        {game.tiles.map((tile) => (
          <TileCard
            key={tile.id}
            tile={tile}
            onTap={handleTileTap}
          />
        ))}
      </div>
    </div>
  );
}

// ─── TileCard ─────────────────────────────────────────────────────────────────

interface TileCardProps {
  tile: Tile;
  onTap: (id: number) => void;
}

function TileCard({ tile, onTap }: TileCardProps) {
  const isVisible = tile.revealed || tile.matched;

  return (
    <motion.button
      layout
      onClick={() => onTap(tile.id)}
      aria-label={isVisible ? tile.label : 'Hidden tile – tap to reveal'}
      aria-pressed={isVisible}
      disabled={tile.matched}
      style={{
        minWidth: 64,
        minHeight: 64,
        aspectRatio: '1 / 1',
        border: 'none',
        borderRadius: 14,
        cursor: tile.matched ? 'default' : 'pointer',
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        perspective: 600,
        background: 'transparent',
      }}
      whileTap={tile.matched ? {} : { scale: 0.92 }}
    >
      {/* Back face */}
      <motion.div
        animate={{ rotateY: isVisible ? 90 : 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          backfaceVisibility: 'hidden',
          background:
            'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-secondary, var(--color-primary))) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Subtle NER texture mark */}
        <span style={{ fontSize: 24, opacity: 0.35 }}>🌿</span>
      </motion.div>

      {/* Front face */}
      <motion.div
        animate={{ rotateY: isVisible ? 0 : -90 }}
        transition={{ duration: 0.18, delay: isVisible ? 0.16 : 0 }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          backfaceVisibility: 'hidden',
          background: tile.matched
            ? 'rgba(34, 197, 94, 0.18)' // green tint on match
            : 'rgb(var(--color-surface-card))',
          border: tile.matched
            ? '2px solid rgba(34, 197, 94, 0.7)'
            : '2px solid rgb(var(--color-border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: tile.matched ? '0 0 12px rgba(34,197,94,0.35)' : 'none',
        }}
      >
        <span
          style={{ fontSize: 36, lineHeight: 1, userSelect: 'none' }}
          role="img"
          aria-label={tile.label}
        >
          {tile.emoji}
        </span>
      </motion.div>
    </motion.button>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  background: 'rgb(var(--color-primary))',
  color: '#fff',
  border: 'none',
  borderRadius: 16,
  padding: '18px 40px',
  fontSize: 'var(--text-lg)',
  fontWeight: 700,
  cursor: 'pointer',
  minHeight: 64,
  width: '100%',
};

const secondaryBtn: React.CSSProperties = {
  background: 'transparent',
  color: 'rgb(var(--color-text-secondary))',
  border: '2px solid rgb(var(--color-border))',
  borderRadius: 16,
  padding: '16px 40px',
  fontSize: 'var(--text-lg)',
  cursor: 'pointer',
  minHeight: 64,
  width: '100%',
};
