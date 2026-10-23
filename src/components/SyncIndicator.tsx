import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type SyncStatusPayload,
  subscribeSyncState,
  triggerManualSync,
} from '../services/syncService';

interface SyncIndicatorProps {
  /** Kept for backward compatibility — triggers a re-check after game saves */
  refreshTrigger?: number;
  /** Optional compact styling */
  compact?: boolean;
}

/**
 * Truthful, interactive sync status badge for COGNIVA.
 *
 * 🟢 Synced           — All sessions confirmed by server acknowledgement.
 * ⏳ Pending Sync (X) — Sessions saved locally, waiting for transmission.
 * 🔄 Syncing...       — Actively transmitting batch to backend.
 * 🟠 Offline (X)      — Saved securely on device, awaiting network connectivity.
 * ⚠️ Sync Error (X)   — Transmission error; tap to manually retry.
 */
export function SyncIndicator({ refreshTrigger = 0, compact = false }: SyncIndicatorProps) {
  const [status, setStatus] = useState<SyncStatusPayload>({
    state: 'synced',
    unsyncedCount: 0,
    lastSyncTime: null,
  });
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncState(newStatus => {
      setStatus(newStatus);
    });
    return unsub;
  }, [refreshTrigger]);

  const handleManualRetry = async () => {
    if (status.state === 'syncing' || isRetrying) return;
    setIsRetrying(true);
    try {
      await triggerManualSync();
    } finally {
      setIsRetrying(false);
    }
  };

  const { state, unsyncedCount } = status;

  const config = {
    syncing: {
      icon: '🔄',
      label: 'Syncing...',
      bg: 'rgba(124,92,252,0.12)',
      border: 'rgba(124,92,252,0.3)',
      color: 'rgb(91,53,234)',
      spin: true,
    },
    synced: {
      icon: '🟢',
      label: 'Synced',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.3)',
      color: 'rgb(5,150,105)',
      spin: false,
    },
    pending: {
      icon: '⏳',
      label: compact ? `Pending (${unsyncedCount})` : `Pending Sync (${unsyncedCount} saved)`,
      bg: 'rgba(59,130,246,0.12)',
      border: 'rgba(59,130,246,0.3)',
      color: 'rgb(37,99,235)',
      spin: false,
    },
    offline: {
      icon: '🟠',
      label: unsyncedCount > 0
        ? `Offline (${unsyncedCount} saved)`
        : 'Offline',
      bg: 'rgba(249,115,22,0.12)',
      border: 'rgba(249,115,22,0.3)',
      color: 'rgb(194,65,12)',
      spin: false,
    },
    error: {
      icon: '⚠️',
      label: compact ? `Retry (${unsyncedCount})` : `Sync Error (${unsyncedCount} queued · Tap to retry)`,
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.35)',
      color: 'rgb(220,38,38)',
      spin: false,
    },
  }[state];

  const canRetry = state === 'error' || state === 'offline' || state === 'pending';

  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={`${state}-${unsyncedCount}`}
        onClick={canRetry ? handleManualRetry : undefined}
        disabled={!canRetry || isRetrying}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.2 }}
        role="status"
        aria-live="polite"
        aria-label={`Sync status: ${config.label}`}
        title={canRetry ? 'Click to retry synchronization now' : `Status: ${config.label}`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-transform active:scale-95 ${
          canRetry ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
        }`}
        style={{
          background: config.bg,
          border: `1.5px solid ${config.border}`,
          color: config.color,
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className={config.spin || isRetrying ? 'animate-spin inline-block' : 'inline-block'}
          aria-hidden="true"
        >
          {config.icon}
        </span>
        <span>{isRetrying ? 'Retrying...' : config.label}</span>
      </motion.button>
    </AnimatePresence>
  );
}
