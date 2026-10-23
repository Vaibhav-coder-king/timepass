import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { MiraFloatingButtonProps } from '../../types/types';
import { MiraAvatarOrb } from './MiraAvatarOrb';
import { MiraStatusRing } from './MiraStatusRing';

const STORAGE_KEY_POS = 'cogniva_mira_position';

const STATE_ARIA_LABELS = {
  idle: 'Talk to MIRA (Drag to move, tap to open)',
  listening: 'MIRA is listening',
  processing: 'MIRA is thinking',
  speaking: 'MIRA is speaking',
  error: 'MIRA had an issue — tap to retry',
};

const BUTTON_SIZE = 64;
const PADDING = 16;
// 80px bottom nav + 16px clearance
const BOTTOM_NAV_HEIGHT = 96;

/**
 * Movable Floating Action Button for MIRA AI Assistant.
 * Supports fluid mouse and touch dragging with viewport bounds clamping,
 * click vs drag differentiation, safe-area awareness, position persistence,
 * and keyboard accessibility.
 */
export function MiraFloatingButton({ state, onActivate }: MiraFloatingButtonProps) {
  const isActive = state !== 'idle';

  // Clamp helper to ensure MIRA always stays safely within the visible viewport
  const clampPosition = useCallback((x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y };
    const minX = PADDING;
    const maxX = Math.max(minX, window.innerWidth - BUTTON_SIZE - PADDING);
    const minY = PADDING;
    const maxY = Math.max(minY, window.innerHeight - BUTTON_SIZE - BOTTOM_NAV_HEIGHT);

    return {
      x: Math.min(Math.max(minX, x), maxX),
      y: Math.min(Math.max(minY, y), maxY),
    };
  }, []);

  // Compute default bottom-right position
  const getDefaultPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: 300, y: 500 };
    return clampPosition(
      window.innerWidth - BUTTON_SIZE - PADDING - 4,
      window.innerHeight - BUTTON_SIZE - BOTTOM_NAV_HEIGHT - 12
    );
  }, [clampPosition]);

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return { x: 0, y: 0 };
  });

  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking refs
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; posX: number; posY: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  // Initialize position on mount and listen to window resize / orientation change
  useEffect(() => {
    const initPos = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_POS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPosition(clampPosition(parsed.x, parsed.y));
            setHasInitialized(true);
            return;
          }
        }
      } catch {
        // ignore
      }
      setPosition(getDefaultPosition());
      setHasInitialized(true);
    };

    initPos();

    const handleResize = () => {
      setPosition(prev => clampPosition(prev.x, prev.y));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [clampPosition, getDefaultPosition]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button
    if (e.button !== 0) return;

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    hasMovedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    if (!hasMovedRef.current && Math.hypot(dx, dy) > 5) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }

    if (hasMovedRef.current) {
      const newX = dragStartRef.current.posX + dx;
      const newY = dragStartRef.current.posY + dy;
      setPosition(clampPosition(newX, newY));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const wasDragging = hasMovedRef.current;
    dragStartRef.current = null;
    hasMovedRef.current = false;
    setIsDragging(false);

    if (wasDragging) {
      // Persist new position
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
      } catch {
        // ignore
      }
    } else {
      // Normal click / tap -> activate assistant
      onActivate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  };

  if (!hasInitialized) return null;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={STATE_ARIA_LABELS[state]}
      aria-pressed={isActive}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragStartRef.current = null;
        hasMovedRef.current = false;
        setIsDragging(false);
      }}
      className="fixed z-40 select-none outline-none focus-visible:ring-4 focus-visible:ring-violet-400/70 rounded-full"
      style={{
        left: position.x,
        top: position.y,
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      initial={false}
      animate={{ scale: isDragging ? 1.08 : 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
        }}
      >
        {/* Outer glow ring when active */}
        {isActive && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-[-8px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Status ring SVG */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ inset: -10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <MiraStatusRing state={state} size={BUTTON_SIZE + 20} />
        </div>

        {/* Avatar Orb */}
        <div className="pointer-events-none">
          <MiraAvatarOrb state={state} size={BUTTON_SIZE} />
        </div>
      </div>

      {/* State Badge */}
      <div
        aria-hidden="true"
        className="mt-1 text-center pointer-events-none"
      >
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-white font-bold shadow-md"
          style={{
            background: isDragging ? 'rgba(91,53,234,0.95)' : 'rgba(124,92,252,0.88)',
            fontSize: '10px',
            letterSpacing: '0.04em',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isDragging ? 'MOVING' : 'MIRA'}
        </span>
      </div>
    </motion.div>
  );
}
