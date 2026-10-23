import { clsx } from 'clsx';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import type { ThemeMode } from '../../types/types';

interface ContrastToggleProps {
  className?: string;
  compact?: boolean;
}

export function ContrastToggle({ className, compact = true }: ContrastToggleProps) {
  const { settings, setThemeMode } = useAccessibility();
  const currentMode: ThemeMode = settings.themeMode || 'system';

  const THEME_OPTIONS: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className={clsx('space-y-1.5', className)}>
      {!compact && (
        <div className="flex items-center justify-between">
          <label
            id="theme-toggle-label"
            className="text-sm font-bold text-[rgb(var(--color-text-primary))]"
          >
            Theme Appearance
          </label>
          <span className="text-xs text-[rgb(var(--color-text-secondary))] font-medium capitalize">
            {currentMode === 'system' ? 'Follows OS' : `${currentMode} Mode`}
          </span>
        </div>
      )}

      <div
        role="group"
        aria-labelledby="theme-toggle-label"
        aria-label="Theme mode selector"
        className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[rgba(var(--color-text-primary),0.06)] border border-[rgba(var(--color-text-primary),0.1)]"
      >
        {THEME_OPTIONS.map(({ mode, label, icon: Icon }) => {
          const isSelected = currentMode === mode;
          return (
            <button
              key={mode}
              type="button"
              data-compact="true"
              onClick={() => setThemeMode(mode)}
              aria-pressed={isSelected}
              style={{ minHeight: '36px', height: '36px' }}
              className={clsx(
                'flex items-center justify-center gap-1.5 py-1 px-3 rounded-xl font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] text-xs sm:text-sm active:scale-95',
                isSelected
                  ? 'bg-[rgb(var(--color-surface-card))] text-[rgb(var(--color-primary))] shadow-sm border border-[rgba(var(--color-text-primary),0.08)]'
                  : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] hover:bg-[rgba(var(--color-text-primary),0.03)]'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
