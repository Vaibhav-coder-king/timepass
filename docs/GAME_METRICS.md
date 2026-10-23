# COGNIVA Cognitive Game Metrics & Clinical Telemetry

This document details the telemetry payloads, scoring algorithms, and cognitive domains assessed across all 8 game modules in COGNIVA.

> **Disclaimer**: All metrics gathered by COGNIVA are strictly observational and intended for longitudinal behavioral tracking and cognitive stimulation. They do not constitute a clinical diagnosis of dementia or Alzheimer's disease.

---

## Standard Session Contract

All games save to client storage using the following standard JSON contract:

```typescript
export interface GameSession {
  id: string | number;               // Local sequence ID
  session_id?: string;               // UUID v4
  patient_id?: string;               // Pseudonymous hardware ID
  game: GameId;                      // Module enum identifier
  game_type?: string;                // Redundant string identifier
  module_version?: string;           // Semantic version (e.g., '1.0.0')
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  level: number;                     // Adaptive difficulty ranking (1-5)
  time_taken_sec: number;            // Total active engagement duration
  error_count: number;               // Erroneous selections or undos
  score?: number;                    // Scaled score (typically 0-100)
  max_score?: number;                // Maximum attainable score
  completed?: boolean;               // True if finished; false if abandoned
  metrics?: Record<string, unknown>; // Domain-specific telemetry
  schema_version?: number;           // Contract version (2)
  synced: 0 | 1;                     // 0 = Pending in queue; 1 = Acknowledged
}
```

---

## 1. Memory Match (`MEMORY_MATCH`)
- **Route**: `/games/memory-match`
- **Cognitive Domain**: Short-term visual & episodic memory
- **Mechanic**: 8 or 12 cards depicting familiar North-East cultural symbols (Rhino, Hornbill, Tea, Dhol). Tap-to-flip only.
- **Metrics JSON**:
  ```json
  {
    "flips": 16,
    "matches": 6,
    "efficiency_ratio": 1.33
  }
  ```

---

## 2. Daily Sequence (`DAILY_SEQUENCE`)
- **Route**: `/games/daily-sequence`
- **Cognitive Domain**: Executive function, temporal sequencing, and procedural recall
- **Mechanic**: 3 to 4 daily living activities (e.g., waking up, breakfast, bath, medicines). Tap cards to order them chronologically without drag-and-drop.
- **Metrics JSON**:
  ```json
  {
    "steps_count": 3,
    "wrong_order_attempts": 1,
    "perfect_sequence": false
  }
  ```

---

## 3. Canvas Clock Draw (`CLOCK_DRAW`)
- **Route**: `/games/clock-draw`
- **Cognitive Domain**: Visuospatial construction and executive planning
- **Mechanic**: High-DPI canvas drawing with finger or stylus. Patient draws numbers 1–12 and hands pointing to a specified target time.
- **Metrics JSON**:
  ```json
  {
    "stroke_count": 24,
    "total_points": 1420,
    "undo_count": 2,
    "visuospatial_index": 84
  }
  ```

---

## 4. Vernacular Audio Stroop (`AUDIO_STROOP`)
- **Route**: `/games/audio-stroop`
- **Cognitive Domain**: Selective attention, auditory processing, and cognitive inhibition
- **Mechanic**: Spoken instruction in Assamese, Hindi, or English instructs tapping a specific shape, while the visual colors create conflicting stimuli.
- **Metrics JSON**:
  ```json
  {
    "mean_latency_ms": 1420,
    "conflict_errors": 1,
    "language": "as",
    "trials_completed": 4
  }
  ```

---

## 5. Reality Anchor (`REALITY_ANCHOR`)
- **Route**: `/games/reality-anchor`
- **Cognitive Domain**: Temporal, spatial, and environmental orientation
- **Mechanic**: Multiple-choice questions grounded in current real-world date, season, day of week, and time of day. Always offers a gentle "Not sure" escape option.
- **Metrics JSON**:
  ```json
  {
    "questions_answered": 4,
    "skips": 1,
    "accuracy_ratio": 0.75
  }
  ```

---

## 6. Acoustic Recognition (`ACOUSTIC_RECOGNITION`)
- **Route**: `/games/acoustic-recognition`
- **Cognitive Domain**: Auditory memory and associative sensory identification
- **Mechanic**: Procedurally synthesized environmental sounds (temple bell, monsoon rain, bamboo flute, birdsong). Patient taps the corresponding icon.
- **Metrics JSON**:
  ```json
  {
    "replays_used": 2,
    "correct_identifications": 4,
    "total_sounds": 4
  }
  ```

---

## 7. Passive Tremor Telemetry (`TREMOR_TELEMETRY`)
- **Route**: `/games/tremor-telemetry`
- **Cognitive Domain**: Fine motor control and postural hand steadiness
- **Mechanic**: 5-second controlled steady-hold gesture using `DeviceMotionEvent`. Computes Root Mean Square (RMS) acceleration.
- **Metrics JSON**:
  ```json
  {
    "rms_tremor": 0.084,
    "sample_count": 248,
    "duration_ms": 5000,
    "sensor_available": true,
    "permission_granted": true
  }
  ```

---

## 8. Pattern Association (`PATTERN_ASSOCIATION`)
- **Route**: `/games/pattern-match`
- **Cognitive Domain**: Visuoperceptual association and cultural visual recognition
- **Mechanic**: 4×4 grid matching authentic NER cultural motifs (Muga silk weave, Kopou phool, Kaziranga elephant, Meghalaya hills).
- **Metrics JSON**:
  ```json
  {
    "pairs_matched": 8,
    "total_flips": 22,
    "time_seconds": 68,
    "errors": 3
  }
  ```
