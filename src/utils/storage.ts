// ─── Game Session Payload & Identifier Contracts ───────────────────────────────

export type GameId =
  | 'MEMORY_MATCH'
  | 'DAILY_SEQUENCE'
  | 'CLOCK_DRAW'
  | 'AUDIO_STROOP'
  | 'REALITY_ANCHOR'
  | 'ACOUSTIC_RECOGNITION'
  | 'TREMOR_TELEMETRY'
  | 'PATTERN_ASSOCIATION';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const INSTALLATION_KEY = 'cogniva_installation_id';

/**
 * Device-as-Identity: Generates or retrieves a persistent, cryptographically random
 * pseudonymous installation identifier without collecting invasive hardware fingerprints.
 */
export function getInstallationId(): string {
  try {
    let id = localStorage.getItem(INSTALLATION_KEY);
    if (!id) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = `inst_${crypto.randomUUID()}`;
      } else {
        id = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      localStorage.setItem(INSTALLATION_KEY, id);
    }
    return id;
  } catch {
    return 'inst_fallback';
  }
}

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

export function markTriageSynced(id: number | string): void {
  const strId = String(id);
  const sessions = getTriageSessions().map(s =>
    String(s.id) === strId ? { ...s, synced: 1 as const } : s
  );
  try {
    localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(sessions));
  } catch { /* Silently ignore */ }
}

// ─── Triage: Unsynced count ───────────────────────────────────────────────────

export function getUnsyncedTriageCount(): number {
  return getTriageSessions().filter(s => s.synced === 0).length;
}

// ─── Standard Game Session Contract ──────────────────────────────────────────

export interface GameSession {
  id: string | number;
  game: GameId;
  time_taken_sec: number;
  error_count: number;
  difficulty: Difficulty;
  level: number;         // Adaptive engine level at time of play
  synced: 0 | 1;
  // Master plan extended fields
  session_id?: string;
  patient_id?: string;
  game_type?: string;
  module_version?: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  score?: number;
  max_score?: number;
  metrics?: Record<string, unknown>;
  completed?: boolean;
  schema_version?: number;
  client_created_at?: string;
  device_id?: string;
  region?: string;
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
  session: Omit<GameSession, 'id' | 'synced'> & { id?: string | number }
): GameSession {
  const nowIso = new Date().toISOString();
  const installId = getInstallationId();
  const sid = session.id ?? `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newSession: GameSession = {
    id: sid,
    synced: 0,
    session_id: typeof sid === 'string' ? sid : `sess_${sid}`,
    patient_id: session.patient_id ?? 'P-101',
    game_type: session.game,
    module_version: session.module_version ?? '1.0.0',
    schema_version: 1,
    client_created_at: nowIso,
    device_id: session.device_id ?? installId,
    region: session.region ?? 'Assam',
    completed: session.completed ?? true,
    ...session,
  };
  const updated = [...getSessions(), newSession];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* Storage quota exceeded */ }
  return newSession;
}

// ─── Mark synced ──────────────────────────────────────────────────────────────

export function markSynced(id: string | number): void {
  const strId = String(id);
  const sessions = getSessions().map(s =>
    String(s.id) === strId || String(s.session_id) === strId
      ? { ...s, synced: 1 as const }
      : s
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
