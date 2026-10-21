import { motion } from 'framer-motion';
import { Home, Gamepad2, MessageCircleHeart, BookImage, MoreHorizontal, type LucideProps } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useMira } from '../../context/MiraContext';

type LucideIcon = React.FC<LucideProps>;

interface NavItem {
  id: string;
  label: string;
  Icon: LucideIcon;
  ariaLabel: string;
}

interface PatientBottomNavProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

/**
 * Persistent patient bottom navigation: Home / Play / MIRA / Memories / More (Settings)
 * 80px height, large icons + labels. Fully localised via LanguageContext.
 * Sliding active indicator via Framer Motion layoutId.
 */
export function PatientBottomNav({ activeTab, onTabChange }: PatientBottomNavProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { activate } = useMira();

  // Labels are computed from the dictionary so they update when language changes
  const NAV_ITEMS: NavItem[] = [
    { id: 'home',     label: t('nav.home'),     Icon: Home,               ariaLabel: 'Go to Home' },
    { id: 'play',     label: t('nav.play'),     Icon: Gamepad2,           ariaLabel: 'Go to Games' },
    { id: 'mira',     label: t('nav.mira'),     Icon: MessageCircleHeart, ariaLabel: 'Talk to MIRA' },
    { id: 'memories', label: t('nav.memories'), Icon: BookImage,          ariaLabel: 'View Memories' },
    { id: 'more',     label: t('nav.more'),     Icon: MoreHorizontal,     ariaLabel: 'Settings & More' },
  ];

  const handleTabPress = (id: string) => {
    switch (id) {
      case 'home':     navigate('/');         break;
      case 'play':     navigate('/games');    break;
      case 'memories': navigate('/memories'); break;
      case 'more':     navigate('/settings'); break;
      case 'mira':     activate();            break;
      default:
        onTabChange?.(id);
    }
  };

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-[rgba(var(--color-text-primary),0.08)]"
      style={{
        background: 'rgba(var(--color-surface-bg), 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <ul
        role="list"
        className="flex items-stretch"
        style={{ height: 80 }}
      >
        {NAV_ITEMS.map(({ id, label, Icon, ariaLabel }) => {
          const isActive = activeTab === id;
          const strokeWidth = isActive ? 2.2 : 1.8;

          return (
            <li key={id} className="flex-1">
              <button
                aria-label={ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleTabPress(id)}
                className="relative flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-150 active:scale-95 active:opacity-70"
                style={{
                  color: isActive
                    ? 'rgb(var(--color-primary))'
                    : 'rgb(var(--color-text-secondary))',
                  minHeight: 56,
                }}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ background: 'rgb(var(--color-primary))' }}
                    transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                  />
                )}

                {/* Icon */}
                <span
                  className="flex items-center justify-center"
                  style={{ width: 28, height: 28 }}
                  aria-hidden="true"
                >
                  <Icon size={26} strokeWidth={strokeWidth} />
                </span>

                {/* Label */}
                <span
                  className="font-medium leading-none"
                  style={{ fontSize: '11px' }}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
