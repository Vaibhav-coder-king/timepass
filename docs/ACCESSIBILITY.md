# COGNIVA Accessibility (a11y) Specification

**Conformance Level**: WCAG 2.1 Level AA & Cognitive Accessibility (COGA) Guidelines  

---

## 1. Physical & Motor Accessibility

1. **No Drag-and-Drop Requirements**:
   Elderly patients with tremors, arthritis, or Parkinsonism struggle with continuous touch drag gestures. All game mechanics (Daily Sequence, Memory Match, Pattern Association) utilize discrete **tap-to-select** and **tap-to-place** interactions.
2. **Minimum Touch Target Sizes**:
   All interactive buttons, cards, and navigation links have a minimum hit area of **56×56 CSS pixels**, exceeding WCAG Success Criterion 2.5.5 (Target Size).
3. **Generous Spacing**:
   Interactive elements maintain at least 16px margins to prevent accidental adjacent mis-taps.

---

## 2. Visual & Cognitive Accessibility

1. **High Contrast & Dark Mode Tokens**:
   Semantic tokens defined in `src/index.css` guarantee a minimum contrast ratio of **4.5:1** for normal text and **3:1** for large text and UI components across both light and dark themes.
2. **Triple Font Scaling**:
   The application settings provide 3 font size tiers (Standard, Large, Extra Large) scaling dynamically across all views via `--font-scale` factors (1.0×, 1.15×, 1.30×).
3. **Gentle Escape Options**:
   Every question in reality orientation or cognitive testing provides an explicitly labeled "I'm not sure / Skip" button so patients never feel trapped or agitated.

---

## 3. Auditory & Vernacular Features

1. **SpeechSynthesis API**:
   Voice prompts in the Audio Stroop and Reality Anchor games can be read aloud in Assamese (`as-IN`), Hindi (`hi-IN`), or English (`en-IN`).
2. **Visual Duplication of Audio Signals**:
   Acoustic Recognition provides synchronized animated visual sound wave ripples whenever a sound plays, ensuring deaf or hard-of-hearing patients can perceive audio playback.
