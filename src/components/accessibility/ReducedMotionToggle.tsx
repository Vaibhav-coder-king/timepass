import { clsx } from 'clsx';
import { Wind, Leaf } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface ReducedMotionToggleProps {
  className?: string;
}

export function ReducedMotionToggle({ className }: ReducedMotionToggleProps) {
  const { settings, setReducedMotion } = useAccessibility();
  const isReduced = settings.reducedMotion;

  return (
    <div className={clsx('space-y-3', className)}>
      <p
        className="font-semibold text-[rgb(var(--color-text-primary))]"
        style={{ fontSize: 'var(--text-lg)' }}
      >
        Motion
      </p>
      <button
        role="switch"
        aria-checked={isReduced}
        aria-label="Reduce motion and animations"
        onClick={() => setReducedMotion(!isReduced)}
        className={clsx(
          'w-full flex items-center justify-between gap-4 rounded-2xl border-2 p-5 transition-all duration-200 min-h-[72px]',
          'border-[rgba(var(--color-text-primary),0.15)] bg-[rgb(var(--color-surface-card))]',
          'text-[rgb(var(--color-text-primary))]',
          'hover:border-[rgb(var(--color-primary))]'
        )}
      >
        <div className="flex items-center gap-4">
          {isReduced ? (
            <Leaf className="w-7 h-7 flex-shrink-0 text-[rgb(var(--color-success))]" aria-hidden="true" />
          ) : (
            <Wind className="w-7 h-7 flex-shrink-0 text-[rgb(var(--color-primary))]" aria-hidden="true" />
          )}
          <div className="text-left">
            <span
              className="block font-bold"
              style={{ fontSize: 'var(--text-lg)' }}
            >
              {isReduced ? 'Calm Mode' : 'Smooth Animations'}
            </span>
            <span
              className="block text-[rgb(var(--color-text-secondary))]"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              {isReduced
                ? 'Minimal movement for comfort'
                : 'Gentle transitions and motion'}
            </span>
          </div>
        </div>

        {/* Compact Toggle pill */}
        <div
          aria-hidden="true"
          className={clsx(
            'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-300',
            isReduced
              ? 'bg-[rgb(var(--color-success))]'
              : 'bg-[rgb(var(--color-primary))]'
          )}
        >
          <div
            className={clsx(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300',
              isReduced ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </div>
      </button>
    </div>
  );
}
