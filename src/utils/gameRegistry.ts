import type { GameId } from './storage';

export interface GameDefinition {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  emoji: string;
  domain: string;
  primaryMetric: 'time' | 'errors' | 'accuracy' | 'stability';
  metricLabel: string;
  unit: string;
  isHubGame: boolean; // True for the 6 interactive brain games in GameHub
  category: 'cognitive_game' | 'clinical_assessment';
  gradient: { from: string; to: string };
  iconBg: string;
  difficulty: string;
  duration: string;
}

/**
 * Centralized Game Registry
 * Defines all existing games in the COGNIVA platform.
 * Used by GameHub, Family/Caregiver Analytics, Sync, and MIRA AI.
 */
export const GAME_REGISTRY: Record<GameId, GameDefinition> = {
  MEMORY_MATCH: {
    id: 'MEMORY_MATCH',
    title: 'Memory Match',
    subtitle: 'Flip & find pairs',
    description: 'Find matching pairs of cards featuring familiar symbols from North East India (Kaziranga rhino, Assam tea, Bihu dhol).',
    route: '/games/memory-match',
    emoji: '🧩',
    domain: 'Short-Term Visual Recall',
    primaryMetric: 'time',
    metricLabel: 'Response Time',
    unit: 's',
    isHubGame: true,
    category: 'cognitive_game',
    gradient: { from: 'rgb(236,220,255)', to: 'rgb(221,196,255)' },
    iconBg: 'rgb(124,92,252)',
    difficulty: 'Easy — 4 pairs',
    duration: 'About 3 minutes',
  },
  DAILY_SEQUENCE: {
    id: 'DAILY_SEQUENCE',
    title: 'Daily Sequence',
    subtitle: 'Arrange your day',
    description: 'Put everyday morning and evening activities in the right order — a gentle exercise for daily routine recall.',
    route: '/games/daily-sequence',
    emoji: '🌅',
    domain: 'Executive Function & Routine',
    primaryMetric: 'errors',
    metricLabel: 'Misplacements',
    unit: 'errors',
    isHubGame: true,
    category: 'cognitive_game',
    gradient: { from: 'rgb(255,235,205)', to: 'rgb(255,215,175)' },
    iconBg: 'rgb(249,115,22)',
    difficulty: 'Easy — 3 steps',
    duration: 'About 2 minutes',
  },
  AUDIO_STROOP: {
    id: 'AUDIO_STROOP',
    title: 'Listen & Tap',
    subtitle: 'Match what you hear',
    description: 'Listen to spoken color words and tap the matching color tile — tests selective attention and cognitive inhibition across languages.',
    route: '/games/audio-stroop',
    emoji: '🎧',
    domain: 'Attention & Cognitive Inhibition',
    primaryMetric: 'time',
    metricLabel: 'Reaction Time',
    unit: 's',
    isHubGame: true,
    category: 'cognitive_game',
    gradient: { from: 'rgb(220,255,231)', to: 'rgb(196,255,215)' },
    iconBg: 'rgb(34,197,94)',
    difficulty: 'Medium — audio',
    duration: 'About 4 minutes',
  },
  REALITY_ANCHOR: {
    id: 'REALITY_ANCHOR',
    title: "Today's World",
    subtitle: 'Stay oriented',
    description: 'Gentle conversational questions about the current day, season, time of day, and surroundings — supporting daily orientation.',
    route: '/games/reality-anchor',
    emoji: '🗓️',
    domain: 'Temporal & Spatial Orientation',
    primaryMetric: 'errors',
    metricLabel: 'Questions Skipped/Errors',
    unit: 'skips',
    isHubGame: true,
    category: 'cognitive_game',
    gradient: { from: 'rgb(255,246,220)', to: 'rgb(255,237,196)' },
    iconBg: 'rgb(234,179,8)',
    difficulty: 'Easy — no wrong answers',
    duration: 'About 2 minutes',
  },
  ACOUSTIC_RECOGNITION: {
    id: 'ACOUSTIC_RECOGNITION',
    title: 'Sounds Around',
    subtitle: 'Name that sound',
    description: 'Listen to familiar sounds of daily life — temple bell, falling rain, bamboo flute — and identify what made the sound.',
    route: '/games/acoustic-recognition',
    emoji: '🔊',
    domain: 'Auditory Memory & Processing',
    primaryMetric: 'errors',
    metricLabel: 'Auditory Identification Errors',
    unit: 'errors',
    isHubGame: true,
    category: 'cognitive_game',
    gradient: { from: 'rgb(255,228,240)', to: 'rgb(255,208,228)' },
    iconBg: 'rgb(236,72,153)',
    difficulty: 'Easy — sound clips',
    duration: 'About 3 minutes',
  },
  TREMOR_TELEMETRY: {
    id: 'TREMOR_TELEMETRY',
    title: 'Steady Hand',
    subtitle: 'Hold still for 5 seconds',
    description: 'Rest your hand on a flat surface while holding the device — passively measures hand tremor stability over 5 seconds.',
    route: '/games/tremor-telemetry',
    emoji: '📱',
    domain: 'Motor Stability & Neuromuscular',
    primaryMetric: 'stability',
    metricLabel: 'Stability Score',
    unit: '%',
    isHubGame: true,
    category: 'cognitive_game',
    gradient: { from: 'rgb(237,233,254)', to: 'rgb(221,214,254)' },
    iconBg: 'rgb(139,92,246)',
    difficulty: 'Easy — sensor based',
    duration: 'About 1 minute',
  },
  CLOCK_DRAW: {
    id: 'CLOCK_DRAW',
    title: 'Clock Draw',
    subtitle: 'Draw what you see',
    description: 'Draw a circular clock face with all 12 numbers and set hands — a standardized screening tool for visuospatial construction.',
    route: '/games/clock-draw',
    emoji: '🕐',
    domain: 'Visuospatial Construction',
    primaryMetric: 'time',
    metricLabel: 'Completion Time',
    unit: 's',
    isHubGame: false,
    category: 'clinical_assessment',
    gradient: { from: 'rgb(220,242,255)', to: 'rgb(196,232,255)' },
    iconBg: 'rgb(14,165,233)',
    difficulty: 'Medium — hand-drawn',
    duration: 'About 3 minutes',
  },
  PATTERN_ASSOCIATION: {
    id: 'PATTERN_ASSOCIATION',
    title: 'Pattern Association',
    subtitle: 'Match cultural motifs',
    description: 'Identify and pair cultural textile patterns and motifs from Assam, Meghalaya, and Manipur.',
    route: '/games/pattern-match',
    emoji: '🦚',
    domain: 'Visual Association & Cultural Recall',
    primaryMetric: 'errors',
    metricLabel: 'Pattern Mismatches',
    unit: 'errors',
    isHubGame: false,
    category: 'cognitive_game',
    gradient: { from: 'rgb(240,253,244)', to: 'rgb(220,252,231)' },
    iconBg: 'rgb(16,185,129)',
    difficulty: 'Easy — tap to match',
    duration: 'About 3 minutes',
  },
};

export const ALL_GAMES = Object.values(GAME_REGISTRY);
export const HUB_GAMES = ALL_GAMES.filter((g) => g.isHubGame);
