/**
 * COGNIVA Sync Service — Phase 3 & 4
 *
 * Manages the offline-first data bridge between the app and backend.
 * Operates 100% offline-first: if no backend is present, computes real analytics
 * directly from localStorage sessions so the app is completely self-reliant.
 */

import { getSessions, markSynced, getUnsyncedCount, type GameSession } from '../utils/storage';

// ── API URL — uses relative /api (proxied in dev or served on same origin) ─────
const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Sync state ────────────────────────────────────────────────────────────────

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline';

let currentState: SyncState = 'idle';
let currentUnsyncedCount: number = getUnsyncedCount();
const stateListeners = new Set<(state: SyncState, count: number) => void>();

function setState(state: SyncState): void {
  currentState = state;
  currentUnsyncedCount = getUnsyncedCount();
  stateListeners.forEach(cb => cb(currentState, currentUnsyncedCount));
}

export function subscribeSyncState(
  cb: (state: SyncState, unsyncedCount: number) => void
): () => void {
  stateListeners.add(cb);
  cb(currentState, currentUnsyncedCount);
  return () => stateListeners.delete(cb);
}

// ── Core sync loop ────────────────────────────────────────────────────────────

let isSyncing = false;

export async function syncPendingSessions(): Promise<void> {
  if (isSyncing) return;

  const unsynced = getSessions().filter(s => s.synced === 0);
  if (unsynced.length === 0) {
    setState('synced');
    return;
  }

  if (!navigator.onLine) {
    setState('offline');
    return;
  }

  isSyncing = true;
  setState('syncing');

  try {
    const payload = unsynced.map(({ synced: _s, ...rest }) => rest);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as { acknowledged_ids?: string[] };
      if (data.acknowledged_ids) {
        data.acknowledged_ids.forEach(id => markSynced(Number(id)));
      }
      setState(getUnsyncedCount() === 0 ? 'synced' : 'offline');
    } else {
      setState('offline');
    }
  } catch {
    // If backend is unreachable, sessions remain safe in localStorage
    setState('offline');
  } finally {
    isSyncing = false;
  }
}

// ── Fetch analytics data ──────────────────────────────────────────────────────

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

function formatSessionLabel(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
         d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Client-side analytics engine computed directly from local storage
export function computeLocalAnalytics(): AnalyticsData {
  const allSessions = getSessions();

  const mmSessions = allSessions.filter(s => s.game === 'MEMORY_MATCH').slice(-10);
  const dsSessions = allSessions.filter(s => s.game === 'DAILY_SEQUENCE').slice(-10);

  // If user has played actual sessions, format them
  const buildStats = (sessions: GameSession[]): GameStats => {
    if (sessions.length === 0) {
      return EMPTY_GAME_STATS;
    }

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

  // Check if attention needed (increasing error rates)
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
  // 1. Attempt to fetch live from backend if reachable
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
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${API_URL}/analytics`, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const remoteData = (await response.json()) as AnalyticsData;
      return remoteData;
    }
  } catch {
    // Backend unreachable — fallback seamlessly to local computation
  }

  // 2. Pure offline / client-side computation from localStorage
  return computeLocalAnalytics();
}

// ── Auto-triggers ─────────────────────────────────────────────────────────────

window.addEventListener('online', () => syncPendingSessions());
window.addEventListener('offline', () => setState('offline'));

// Initial sync attempt
(function initialSync() {
  if (navigator.onLine && getUnsyncedCount() > 0) {
    syncPendingSessions();
  } else {
    setState('synced');
  }
})();
