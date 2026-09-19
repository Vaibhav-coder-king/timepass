// ─── Game Session Payload ─────────────────────────────────────────────────────

export type GameId = 'MEMORY_MATCH' | 'DAILY_SEQUENCE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// ─── Triage Session Payload ───────────────────────────────────────────────────

export type TriageUrgency = 'critical' | 'high' | 'moderate' | 'low';

export interface TriageAnswer {
  nodeId: string;
  question: string;
  answer: string; // label of the option selected (e.g. 'Yes' / 'No')
}

export interface TriageSession {
  id: number;
  timestamp: string;            // ISO-8601
  outcomeId: string;            // leaf node id
  outcomeTitle: string;
  urgency: TriageUrgency;
  flagAsha: boolean;
  recommendation: string;
  ashaNotice: string;
  transcript: TriageAnswer[];   // ordered Q&A trail
  synced: 0 | 1;
}

const TRIAGE_STORAGE_KEY = 'cogniva_triage_queue';

// ─── Triage: Read ─────────────────────────────────────────────────────────────

export function getTriageSessions(): TriageSession[] {
  try {
    const raw = localStorage.getItem(TRIAGE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TriageSession[]) : [];
  } catch {
    return [];
  }
}

// ─── Triage: Write ────────────────────────────────────────────────────────────

export function saveTriageSession(
  session: Omit<TriageSession, 'id' | 'synced'>
): TriageSession {
  const newSession: TriageSession = {
    id: Date.now(),
    synced: 0,
    ...session,
  };
  const updated = [...getTriageSessions(), newSession];
  try {
    localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(updated));
  } catch { /* Storage quota exceeded — silently ignore */ }
  return newSession;
}

// ─── Triage: Mark synced ──────────────────────────────────────────────────────

export function markTriageSynced(id: number): void {
  const sessions = getTriageSessions().map(s =>
    s.id === id ? { ...s, synced: 1 as const } : s
  );
  try {
    localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(sessions));
  } catch { /* Silently ignore */ }
}

// ─── Triage: Unsynced count ───────────────────────────────────────────────────

export function getUnsyncedTriageCount(): number {
  return getTriageSessions().filter(s => s.synced === 0).length;
}

export interface GameSession {
  id: number;
  game: GameId;
  time_taken_sec: number;
  error_count: number;
  difficulty: Difficulty;
  level: number;         // Adaptive engine level at time of play
  synced: 0 | 1;
}

const STORAGE_KEY = 'cogniva_sessions';

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getSessions(): GameSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GameSession[]) : [];
  } catch {
    return [];
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export function saveSession(
  session: Omit<GameSession, 'id' | 'synced'>
): GameSession {
  const newSession: GameSession = { id: Date.now(), synced: 0, ...session };
  const updated = [...getSessions(), newSession];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* Storage quota exceeded */ }
  return newSession;
}

// ─── Mark synced ──────────────────────────────────────────────────────────────

export function markSynced(id: number): void {
  const sessions = getSessions().map(s =>
    s.id === id ? { ...s, synced: 1 as const } : s
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch { /* Silently ignore */ }
}

// ─── Count unsynced ───────────────────────────────────────────────────────────

export function getUnsyncedCount(): number {
  return getSessions().filter(s => s.synced === 0).length;
}

// ─── Clear (for testing) ──────────────────────────────────────────────────────

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
