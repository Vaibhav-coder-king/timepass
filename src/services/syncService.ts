/**
 * COGNIVA Sync Service — Offline-First Synchronization Engine
 *
 * Provides a dependable offline data bridge between browser storage and the backend.
 * Enforces strict synchronization truthfulness:
 * - 'synced'  : Confirmed by server acknowledgement for all local records.
 * - 'syncing' : In-flight batch upload to backend.
 * - 'pending' : Saved locally, awaiting sync queue transmission.
 * - 'offline' : Device is offline; records are preserved safely in localStorage.
 * - 'error'   : Network or server error during synchronization attempt.
 *
 * Never marks sessions synced without server acknowledgement.
 * Never drops unsynced records on failed requests.
 */

import { getSessions, markSynced, getUnsyncedCount, type GameSession } from '../utils/storage';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export type SyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export interface SyncStatusPayload {
  state: SyncState;
  unsyncedCount: number;
  lastSyncTime: string | null;
  errorMessage?: string;
}

// ── State Management ─────────────────────────────────────────────────────────

function computeInitialState(): SyncState {
  const count = getUnsyncedCount();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    return 'offline';
  }
  return count > 0 ? 'pending' : 'synced';
}

let currentState: SyncState = computeInitialState();
let currentUnsyncedCount: number = getUnsyncedCount();
let lastSyncTimestamp: string | null = localStorage.getItem('cogniva_last_sync_time');
const stateListeners = new Set<(status: SyncStatusPayload) => void>();

function emitState(errorMessage?: string): void {
  currentUnsyncedCount = getUnsyncedCount();
  const payload: SyncStatusPayload = {
    state: currentState,
    unsyncedCount: currentUnsyncedCount,
    lastSyncTime: lastSyncTimestamp,
    errorMessage,
  };
  stateListeners.forEach(cb => cb(payload));
}

export function subscribeSyncState(
  cb: (status: SyncStatusPayload) => void
): () => void {
  stateListeners.add(cb);
  cb({
    state: currentState,
    unsyncedCount: currentUnsyncedCount,
    lastSyncTime: lastSyncTimestamp,
  });
  return () => stateListeners.delete(cb);
}

// ── Core Synchronization Logic ────────────────────────────────────────────────

let isSyncInProgress = false;
let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;
const MAX_BACKOFF_MS = 30000;

/**
 * Synchronizes pending local sessions with the remote backend.
 * Uses bounded exponential backoff with jitter on temporary failures.
 *
 * @param isManualRetry If true, resets backoff counters and attempts immediate sync.
 */
export async function syncPendingSessions(isManualRetry: boolean = false): Promise<boolean> {
  if (isManualRetry && retryTimeoutId) {
    clearTimeout(retryTimeoutId);
    retryTimeoutId = null;
    retryAttempt = 0;
  }

  if (isSyncInProgress) {
    return false;
  }

  const unsynced = getSessions().filter(s => s.synced === 0);

  // If there are zero unsynced sessions, state is truthful 'synced' or 'offline'
  if (unsynced.length === 0) {
    currentState = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
    emitState();
    return true;
  }

  // If client network is offline, preserve in queue and report offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentState = 'offline';
    emitState();
    return false;
  }

  isSyncInProgress = true;
  currentState = 'syncing';
  emitState();

  try {
    const payload = unsynced.map(({ synced: _s, ...rest }) => rest);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as { acknowledged_ids?: (string | number)[] };
      if (Array.isArray(data.acknowledged_ids)) {
        data.acknowledged_ids.forEach(id => markSynced(id));
      }

      const remaining = getUnsyncedCount();
      lastSyncTimestamp = new Date().toISOString();
      try {
        localStorage.setItem('cogniva_last_sync_time', lastSyncTimestamp);
      } catch { /* Quota */ }

      retryAttempt = 0;
      currentState = remaining === 0 ? 'synced' : 'pending';
      emitState();
      return true;
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (err: unknown) {
    const isNetworkErr =
      err instanceof TypeError ||
      (err instanceof Error && (err.name === 'AbortError' || err.message.includes('fetch')));

    currentState = isNetworkErr ? 'offline' : 'error';
    const errMsg = err instanceof Error ? err.message : 'Sync request failed';
    emitState(errMsg);

    // Schedule bounded exponential backoff with jitter if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      retryAttempt++;
      const jitter = Math.random() * 1000;
      const delay = Math.min(1000 * Math.pow(2, retryAttempt) + jitter, MAX_BACKOFF_MS);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      retryTimeoutId = setTimeout(() => {
        syncPendingSessions();
      }, delay);
    }
    return false;
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Public trigger for manual user retry (e.g. tapping the status pill).
 */
export function triggerManualSync(): Promise<boolean> {
  return syncPendingSessions(true);
}

// ── Analytics Models & Offline Computation ────────────────────────────────────

export interface GameStats {
  labels: string[];
  raw_time: number[];
  raw_errors: number[];
  moving_avg_time: number[];
  moving_avg_errors: number[];
}

export interface AnalyticsData {
  attention_needed: boolean;
  MEMORY_MATCH: GameStats;
  DAILY_SEQUENCE: GameStats;
  [key: string]: unknown;
}

const EMPTY_GAME_STATS: GameStats = {
  labels: [],
  raw_time: [],
  raw_errors: [],
  moving_avg_time: [],
  moving_avg_errors: [],
};

function computeMovingAvg(values: number[], windowSize: number = 3): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const chunk = values.slice(start, i + 1);
    const avg = chunk.reduce((sum, v) => sum + v, 0) / chunk.length;
    return Number(avg.toFixed(1));
  });
}

function formatSessionLabel(timestamp: string | number): string {
  const ts = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp) || Date.now();
  const d = new Date(ts);
  return (
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
}

export function computeLocalAnalytics(): AnalyticsData {
  const allSessions = getSessions();
  const mmSessions = allSessions.filter(s => s.game === 'MEMORY_MATCH').slice(-10);
  const dsSessions = allSessions.filter(s => s.game === 'DAILY_SEQUENCE').slice(-10);

  const buildStats = (sessions: GameSession[]): GameStats => {
    if (sessions.length === 0) return EMPTY_GAME_STATS;

    const labels = sessions.map(s => formatSessionLabel(s.id));
    const raw_time = sessions.map(s => s.time_taken_sec);
    const raw_errors = sessions.map(s => s.error_count);

    return {
      labels,
      raw_time,
      raw_errors,
      moving_avg_time: computeMovingAvg(raw_time),
      moving_avg_errors: computeMovingAvg(raw_errors),
    };
  };

  const mmStats = buildStats(mmSessions);
  const dsStats = buildStats(dsSessions);

  const recentErrors = mmStats.raw_errors.slice(-3);
  const attention_needed =
    recentErrors.length === 3 &&
    recentErrors[2] > recentErrors[1] &&
    recentErrors[1] > recentErrors[0];

  return {
    attention_needed,
    MEMORY_MATCH: mmStats,
    DAILY_SEQUENCE: dsStats,
  };
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  try {
    let authHeader = '';
    const rawAuth = localStorage.getItem('cogniva_auth_state');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      if (parsed.token) authHeader = `Bearer ${parsed.token}`;
    }

    const headers: Record<string, string> = {};
    if (authHeader) headers['Authorization'] = authHeader;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${API_URL}/analytics`, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return (await response.json()) as AnalyticsData;
    }
  } catch {
    // Offline or unreachable — fallback seamlessly to local storage computation
  }

  return computeLocalAnalytics();
}

// ── Browser Lifecycle Event Listeners ─────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentState = getUnsyncedCount() > 0 ? 'pending' : 'synced';
    emitState();
    syncPendingSessions();
  });

  window.addEventListener('offline', () => {
    currentState = 'offline';
    emitState();
  });

  // Safe initial verification on script load
  if (navigator.onLine && getUnsyncedCount() > 0) {
    syncPendingSessions();
  } else {
    emitState();
  }
}
