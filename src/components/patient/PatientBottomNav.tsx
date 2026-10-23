import { motion } from 'framer-motion';
import { Home, Gamepad2, MessageCircleHeart, BookImage, MoreHorizontal, type LucideProps } from 'lucide-react';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

/**
 * Persistent patient bottom navigation: Home / Play / MIRA / Memories / More (Settings)
 * 80px height, large touch targets, clear labels. Fully localised via LanguageContext.
 * Sliding active indicator via Framer Motion layoutId.
 */
export function PatientBottomNav({ activeTab, onTabChange }: PatientBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { activate } = useMira();

  // Compute active tab from route if not explicitly supplied
  let currentTab = activeTab;
  if (!currentTab) {
    const path = location.pathname;
    if (path === '/') currentTab = 'home';
    else if (path === '/games' || path.startsWith('/games')) currentTab = 'play';
    else if (path.startsWith('/memories')) currentTab = 'memories';
    else if (
      path.startsWith('/settings') ||
      path.startsWith('/caregiver') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/asha') ||
      path.startsWith('/doctor') ||
      path.startsWith('/hospital') ||
      path.startsWith('/ngo') ||
      path.startsWith('/admin') ||
      path.startsWith('/govt-hub')
    ) {
      currentTab = 'more';
    } else {
      currentTab = 'home';
    }
  }

  const NAV_ITEMS: NavItem[] = [
    { id: 'home',     label: t('nav.home') || 'Home',         Icon: Home,               ariaLabel: 'Go to Home' },
    { id: 'play',     label: t('nav.play') || 'Play',         Icon: Gamepad2,           ariaLabel: 'Go to Games' },
    { id: 'mira',     label: t('nav.mira') || 'MIRA',         Icon: MessageCircleHeart, ariaLabel: 'Talk to MIRA' },
    { id: 'memories', label: t('nav.memories') || 'Memories', Icon: BookImage,          ariaLabel: 'View Memories' },
    { id: 'more',     label: t('nav.more') || 'More',         Icon: MoreHorizontal,     ariaLabel: 'Settings & Portals' },
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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(var(--color-border),0.4)]"
      style={{
        background: 'rgba(var(--color-surface-bg), 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <ul
        role="list"
        className="flex items-stretch max-w-lg mx-auto"
        style={{ height: 76 }}
      >
        {NAV_ITEMS.map(({ id, label, Icon, ariaLabel }) => {
          const isActive = currentTab === id;
          const strokeWidth = isActive ? 2.3 : 1.8;

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
                  className="font-semibold leading-none"
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
