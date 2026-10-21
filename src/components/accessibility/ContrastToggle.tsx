import { clsx } from 'clsx';
import { Sun, Moon } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface ContrastToggleProps {
  className?: string;
}

export function ContrastToggle({ className }: ContrastToggleProps) {
  const { settings, setContrastMode } = useAccessibility();
  const isHighContrast = settings.contrastMode === 'high-contrast';

  return (
    <div className={clsx('space-y-3', className)}>
      <p
        className="font-semibold text-[rgb(var(--color-text-primary))]"
        style={{ fontSize: 'var(--text-lg)' }}
      >
        Display
      </p>
      <button
        role="switch"
        aria-checked={isHighContrast}
        aria-label="High contrast mode"
        onClick={() =>
          setContrastMode(isHighContrast ? 'standard' : 'high-contrast')
        }
        className={clsx(
          'w-full flex items-center justify-between gap-4 rounded-2xl border-2 p-5 transition-all duration-300 min-h-[72px]',
          isHighContrast
            ? 'border-white bg-black text-white'
            : 'border-[rgba(var(--color-text-primary),0.15)] bg-[rgb(var(--color-surface-card))] text-[rgb(var(--color-text-primary))]'
        )}
      >
        <div className="flex items-center gap-4">
          {isHighContrast ? (
            <Moon className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
          ) : (
            <Sun className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
          )}
          <div className="text-left">
            <span
              className="block font-bold"
              style={{ fontSize: 'var(--text-lg)' }}
            >
              {isHighContrast ? 'High Contrast' : 'Standard'}
            </span>
            <span
              className="block opacity-70"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              {isHighContrast
                ? 'Dark background, bold colours'
                : 'Warm, comfortable colours'}
            </span>
          </div>
        </div>

        {/* Compact Toggle pill */}
        <div
          aria-hidden="true"
          className={clsx(
            'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-300',
            isHighContrast ? 'bg-white' : 'bg-[rgba(var(--color-text-primary),0.2)]'
          )}
        >
          <div
            className={clsx(
              'absolute top-1 w-4 h-4 rounded-full transition-transform duration-300',
              isHighContrast
                ? 'translate-x-6 bg-black'
                : 'translate-x-1 bg-white'
            )}
          />
        </div>
      </button>
    </div>
  );
}
