// ---------- Accessibility ----------
export type TextSize = 'standard' | 'large' | 'extra-large';
export type ContrastMode = 'standard' | 'high-contrast';
export type VoiceSpeed = 'slow' | 'normal' | 'fast';
export type VoiceGender = 'female' | 'male';

export interface AccessibilitySettings {
  textSize: TextSize;
  contrastMode: ContrastMode;
  voiceSpeed: VoiceSpeed;
  voiceGender: VoiceGender;
  reducedMotion: boolean;
  soundEnabled: boolean;
  languageCode: string; // e.g. 'en', 'hi', 'as', 'bn'
}

// ---------- MIRA Voice State Machine ----------
export type MiraState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface MiraSessionState {
  state: MiraState;
  transcript: string | null;       // recognized user speech (interim or final)
  responseText: string | null;     // MIRA's textual reply (also spoken via TTS)
  errorMessage: string | null;     // friendly, never technical
  isPanelExpanded: boolean;
}

// ---------- Patient Home Screen ----------
export type PatientActionType = 'play' | 'my_day' | 'reminders' | 'family' | 'talk_to_mira';

export interface PatientActionCardData {
  id: PatientActionType;
  label: string;
  icon: string;          // icon identifier (Lucide name)
  route: string;
  colorToken: string;    // design-token reference, not raw hex
}

export interface PatientProfile {
  id: string;
  displayName: string;   // "Arun"
  preferredLanguage: string;
  avatarUrl?: string;
}

// ---------- Component Prop Contracts ----------
export interface ActionCardProps {
  data: PatientActionCardData;
  onSelect: (action: PatientActionType) => void;
}

export interface MiraFloatingButtonProps {
  state: MiraState;
  onActivate: () => void;
}

// ---------- API Shapes ----------
export interface MiraInteractRequest {
  patientId: string;
  sessionId: string;
  inputType: 'voice' | 'text';
  transcript: string;
  languageCode: string;
  timestamp: string;
  context: {
    screen: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

export interface MiraSuggestedAction {
  type: PatientActionType;
  label: string;
}

export interface MiraInteractResponse {
  sessionId: string;
  responseText: string;
  responseAudioUrl: string;
  suggestedActions: MiraSuggestedAction[];
  voiceState: MiraState;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
