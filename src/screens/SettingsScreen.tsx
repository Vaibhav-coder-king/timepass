import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Globe,
  Type,
  ShieldCheck,
  Smartphone,
  User,
  Phone,
  CheckCircle2,
  RotateCcw,
  Send,
  Download,
  Activity,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { ContrastToggle } from '../components/accessibility/ContrastToggle';
import { LANGUAGE_LIST } from '../context/translations';
import type { TextSize, VoiceSpeed } from '../types/types';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  getGeminiModel,
  setGeminiModel,
  getPatientProfile,
  savePatientProfile,
  askMira,
  speakMira,
} from '../services/geminiService';

const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Recommended - Fast & Warm)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
];

export function SettingsScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    settings,
    setTextSize,
    setVoiceSpeed,
    setVoiceGender,
    setReducedMotion,
    setSoundEnabled,
    setLanguageCode,
    resetToDefaults,
  } = useAccessibility();

  // Gemini state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [testQuery, setTestQuery] = useState('What should I do today?');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Patient & caregiver profile state
  const [patientName, setPatientName] = useState('Arun');
  const [initialPatientName, setInitialPatientName] = useState('Arun');
  const [patientNameError, setPatientNameError] = useState<string | null>(null);
  const [caregiverName, setCaregiverName] = useState('Priya');
  const [initialCaregiverName, setInitialCaregiverName] = useState('Priya');
  const [caregiverPhone, setCaregiverPhone] = useState('+91 98765 43210');
  const [initialCaregiverPhone, setInitialCaregiverPhone] = useState('+91 98765 43210');

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PWA install prompt state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Language search filter
  const [langSearch, setLangSearch] = useState('');

  useEffect(() => {
    setApiKey(getGeminiApiKey());
    setSelectedModel(getGeminiModel());

    const profile = getPatientProfile();
    const pName = profile.name || 'Arun';
    const cName = profile.caregiverName || 'Priya';
    const cPhone = profile.caregiverPhone || '+91 98765 43210';

    setPatientName(pName);
    setInitialPatientName(pName);
    setCaregiverName(cName);
    setInitialCaregiverName(cName);
    setCaregiverPhone(cPhone);
    setInitialCaregiverPhone(cPhone);

    // Fetch from backend profile endpoint if available
    fetch('/api/patient/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.profile) {
          const bp = data.profile;
          if (bp.display_name) {
            setPatientName(bp.display_name);
            setInitialPatientName(bp.display_name);
          }
          if (bp.caregiver_name) {
            setCaregiverName(bp.caregiver_name);
            setInitialCaregiverName(bp.caregiver_name);
          }
          if (bp.caregiver_phone) {
            setCaregiverPhone(bp.caregiver_phone);
            setInitialCaregiverPhone(bp.caregiver_phone);
          }
        }
      })
      .catch(() => {});

    // Check if app is installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture beforeinstallprompt for PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKey);
    setGeminiModel(selectedModel);
    showToast('Gemini API settings saved successfully!');
  };

  const handleSaveProfile = () => {
    const cleanName = patientName.trim();
    if (!cleanName) {
      setPatientNameError('Patient name cannot be blank. Please enter a valid name.');
      return;
    }
    if (cleanName.length > 50) {
      setPatientNameError('Patient name is too long (maximum 50 characters).');
      return;
    }
    setPatientNameError(null);

    const updatedProfile = {
      name: cleanName,
      caregiverName: caregiverName.trim() || 'Priya',
      caregiverPhone: caregiverPhone.trim() || '+91 98765 43210',
    };

    // Save locally
    savePatientProfile(updatedProfile);
    setInitialPatientName(cleanName);
    setInitialCaregiverName(updatedProfile.caregiverName);
    setInitialCaregiverPhone(updatedProfile.caregiverPhone);

    // Sync to backend
    fetch('/api/patient/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: cleanName,
        caregiver_name: updatedProfile.caregiverName,
        caregiver_phone: updatedProfile.caregiverPhone,
      }),
    }).catch(() => {});

    // Broadcast change across app components (PatientHomeScreen, Greetings, Mira)
    window.dispatchEvent(
      new CustomEvent('cogniva_patient_updated', {
        detail: updatedProfile,
      })
    );

    showToast(`Patient name updated to "${cleanName}"!`);
  };

  const handleCancelProfile = () => {
    setPatientName(initialPatientName);
    setCaregiverName(initialCaregiverName);
    setCaregiverPhone(initialCaregiverPhone);
    setPatientNameError(null);
    showToast('Changes discarded.');
  };

  const hasProfileChanges =
    patientName !== initialPatientName ||
    caregiverName !== initialCaregiverName ||
    caregiverPhone !== initialCaregiverPhone;

  const handleTestMira = async () => {
    if (!testQuery.trim()) return;
    setIsTesting(true);
    setTestResponse(null);
    try {
      const res = await askMira(testQuery, {
        patientName: patientName.trim() || 'Arun',
        languageCode: settings.languageCode,
        voiceSpeed: settings.voiceSpeed,
      });
      setTestResponse(res.responseText);
      speakMira(res.responseText, {
        languageCode: settings.languageCode,
        speed: settings.voiceSpeed,
        soundEnabled: settings.soundEnabled,
      });
    } catch {
      setTestResponse("Could not connect. Checking offline dementia memory response...");
    } finally {
      setIsTesting(false);
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        showToast('COGNIVA installed to Home Screen!');
      }
      setDeferredPrompt(null);
    } else {
      showToast('To install, tap browser menu (⋮ or Share) and select "Add to Home Screen"');
    }
  };

  const filteredLanguages = LANGUAGE_LIST.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.region.toLowerCase().includes(langSearch.toLowerCase())
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-xl flex items-center gap-2 max-w-[90vw]"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-6 pb-4 border-b border-[rgba(var(--color-text-primary),0.08)] bg-[rgba(var(--color-surface-bg),0.95)] backdrop-blur-md">
        <motion.button
          onClick={() => navigate('/')}
          whileTap={{ scale: 0.94 }}
          aria-label={t('common.backToHome')}
          className="flex items-center justify-center rounded-2xl w-14 h-14 active:opacity-80 transition-all border border-[rgba(var(--color-text-primary),0.12)] bg-[rgb(var(--color-surface-card))]"
          style={{ color: 'rgb(var(--color-text-primary))' }}
        >
          <ArrowLeft className="w-7 h-7" />
        </motion.button>
        <div className="text-center">
          <h1
            className="font-extrabold text-[rgb(var(--color-text-primary))]"
            style={{ fontSize: 'var(--text-xl)' }}
          >
            {t('settings.title')}
          </h1>
          <p className="text-xs text-[rgb(var(--color-text-secondary))]">
            Personalisation, MIRA AI & Accessibility
          </p>
        </div>
        <div className="w-14" aria-hidden="true" />
      </header>

      {/* Main Settings Body */}
      <main className="max-w-2xl mx-auto w-full px-5 pt-6 space-y-8">

        {/* ── SECTION 1: MIRA AI & GEMINI CONFIGURATION ────────────────────────── */}
        <section className="p-6 rounded-3xl border-2 border-[rgba(var(--color-primary),0.2)] bg-[rgba(var(--color-surface-card),0.9)] shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(var(--color-primary),0.15)] flex items-center justify-center text-[rgb(var(--color-primary))]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-[rgb(var(--color-text-primary))]" style={{ fontSize: 'var(--text-lg)' }}>
                  MIRA AI Companion (Gemini)
                </h2>
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                  Memory assistance & cognitive gaming guide
                </p>
              </div>
            </div>
            {apiKey.trim() ? (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4" /> Gemini Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                <Activity className="w-4 h-4" /> Offline Engine
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[rgb(var(--color-text-primary))] flex items-center gap-2">
              <Key className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... (leave blank for offline mode)"
                className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-[rgba(var(--color-text-primary),0.12)] focus:border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-bg))] text-[rgb(var(--color-text-primary))] text-base outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-[rgb(var(--color-text-secondary))] leading-relaxed">
              Obtain your API key from <span className="font-semibold text-[rgb(var(--color-primary))]">Google AI Studio (ai.google.dev)</span>. When offline or without a key, Mira automatically uses the built-in North-East India Dementia memory engine.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[rgb(var(--color-text-primary))]">
              AI Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-[rgba(var(--color-text-primary),0.12)] focus:border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-bg))] text-[rgb(var(--color-text-primary))] text-sm font-medium outline-none transition-colors"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveApiKey}
            className="w-full py-3.5 rounded-2xl font-bold bg-[rgb(var(--color-primary))] text-white shadow-md active:scale-98 transition-all hover:opacity-95"
          >
            Save Gemini Settings
          </button>

          {/* Interactive Test Bar */}
          <div className="pt-3 border-t border-[rgba(var(--color-text-primary),0.08)] space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-secondary))]">
              Test MIRA AI Response
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Ask Mira a test question..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[rgba(var(--color-text-primary),0.12)] bg-[rgb(var(--color-surface-bg))] text-[rgb(var(--color-text-primary))] text-sm outline-none"
              />
              <button
                onClick={handleTestMira}
                disabled={isTesting || !testQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-[rgba(var(--color-primary),0.15)] text-[rgb(var(--color-primary))] font-bold text-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
              >
                <Send className="w-4 h-4" /> {isTesting ? 'Thinking...' : 'Test'}
              </button>
            </div>

            {testResponse && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-[rgba(var(--color-primary),0.06)] border border-[rgba(var(--color-primary),0.15)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[rgb(var(--color-primary))]">MIRA Response:</span>
                  <button
                    onClick={() => speakMira(testResponse, { speed: settings.voiceSpeed, soundEnabled: true })}
                    className="text-xs font-semibold text-[rgb(var(--color-primary))] flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Replay
                  </button>
                </div>
                <p className="text-sm text-[rgb(var(--color-text-primary))] leading-relaxed">
                  {testResponse}
                </p>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── SECTION 2: EDITABLE PATIENT & CAREGIVER PROFILE ─────────────────── */}
        <section className="p-6 rounded-3xl border border-[rgba(var(--color-text-primary),0.12)] bg-[rgb(var(--color-surface-card))] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-[rgb(var(--color-text-primary))]" style={{ fontSize: 'var(--text-lg)' }}>
                Patient Identity & Caregiver Info
              </h2>
              <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                Editable patient name used in daily greetings, games, and MIRA AI
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Editable Patient Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[rgb(var(--color-text-secondary))] flex items-center justify-between">
                <span>{t('settings.patientName')} *</span>
                {patientName !== initialPatientName && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    (Modified)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  if (patientNameError) setPatientNameError(null);
                }}
                placeholder="e.g. Arun"
                className={`w-full px-4 py-3 rounded-2xl border-2 bg-[rgb(var(--color-surface-bg))] text-[rgb(var(--color-text-primary))] text-base outline-none transition-colors ${
                  patientNameError
                    ? 'border-rose-500 focus:border-rose-600'
                    : 'border-[rgba(var(--color-text-primary),0.15)] focus:border-[rgb(var(--color-primary))]'
                }`}
              />
              {patientNameError && (
                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {patientNameError}
                </p>
              )}
            </div>

            {/* Primary Caregiver Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[rgb(var(--color-text-secondary))]">
                Primary Caregiver Name
              </label>
              <input
                type="text"
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
                placeholder="e.g. Priya"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[rgba(var(--color-text-primary),0.15)] focus:border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-bg))] text-[rgb(var(--color-text-primary))] text-base outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[rgb(var(--color-text-secondary))] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Emergency Phone Number
            </label>
            <input
              type="tel"
              value={caregiverPhone}
              onChange={(e) => setCaregiverPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-4 py-3 rounded-2xl border-2 border-[rgba(var(--color-text-primary),0.15)] focus:border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-bg))] text-[rgb(var(--color-text-primary))] text-base outline-none transition-colors"
            />
          </div>

          {/* Save & Cancel Controls */}
          <div className="flex gap-3 pt-2">
            {hasProfileChanges && (
              <button
                type="button"
                onClick={handleCancelProfile}
                className="px-5 py-3.5 rounded-2xl font-bold border border-[rgba(var(--color-text-primary),0.2)] text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-text-primary),0.05)] active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> {t('common.cancel')}
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveProfile}
              className="flex-1 py-3.5 rounded-2xl font-bold bg-[rgb(var(--color-primary))] text-white shadow-md active:scale-98 transition-all hover:opacity-95 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {t('common.save')}
            </button>
          </div>
        </section>

        {/* ── SECTION 3: ACCESSIBILITY & VISUAL COMFORT (THEMES) ───────────────── */}
        <section className="p-6 rounded-3xl border border-[rgba(var(--color-text-primary),0.12)] bg-[rgb(var(--color-surface-card))] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Type className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-[rgb(var(--color-text-primary))]" style={{ fontSize: 'var(--text-lg)' }}>
                Dementia Readability & Visual Comfort
              </h2>
              <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                Tailored font sizing, light/dark/system themes, and high contrast
              </p>
            </div>
          </div>

          {/* Theme Mode Toggle (Compact, Centered, 3-Option) */}
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-[rgb(var(--color-text-primary))]">
              {t('settings.theme')}
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-[rgba(var(--color-text-primary),0.1)] bg-[rgb(var(--color-surface-bg))] gap-3">
              <div>
                <p className="text-xs font-bold text-[rgb(var(--color-text-primary))]">
                  Color Appearance
                </p>
                <p className="text-[11px] text-[rgb(var(--color-text-secondary))]">
                  Follows OS preferences or select explicit theme
                </p>
              </div>
              <ContrastToggle />
            </div>
          </div>

          {/* Text Size */}
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-[rgb(var(--color-text-primary))]">
              {t('settings.textSize')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { size: 'standard' as TextSize, label: 'Standard', desc: 'Default' },
                { size: 'large' as TextSize, label: 'Large', desc: 'Recommended' },
                { size: 'extra-large' as TextSize, label: 'Extra Large', desc: 'Maximum' },
              ].map(({ size, label, desc }) => {
                const isSelected = settings.textSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setTextSize(size)}
                    className={`py-3.5 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                      isSelected
                        ? 'border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] font-bold shadow-sm'
                        : 'border-[rgba(var(--color-text-primary),0.12)] text-[rgb(var(--color-text-secondary))]'
                    }`}
                  >
                    <span className="text-base">{label}</span>
                    <span className="text-[11px] opacity-75">{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[rgba(var(--color-text-primary),0.1)] bg-[rgb(var(--color-surface-bg))]">
            <div>
              <p className="font-bold text-sm text-[rgb(var(--color-text-primary))]">
                Reduced Motion
              </p>
              <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                Minimises slide & zoom animations to prevent disorientation
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReducedMotion(!settings.reducedMotion)}
              role="switch"
              aria-checked={settings.reducedMotion}
              aria-label="Toggle reduced motion"
              data-compact="true"
              className={`w-12 h-7 rounded-full relative flex-shrink-0 transition-colors duration-200 inline-flex items-center p-0.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] active:scale-95 ${
                settings.reducedMotion ? 'bg-[rgb(var(--color-primary))]' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
              style={{ minHeight: '28px', height: '28px', width: '48px' }}
            >
              <span
                className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                  settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* ── SECTION 4: SOUND & SPEECH SPEED ─────────────────────────────────── */}
        <section className="p-6 rounded-3xl border border-[rgba(var(--color-text-primary),0.12)] bg-[rgb(var(--color-surface-card))] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-[rgb(var(--color-text-primary))]" style={{ fontSize: 'var(--text-lg)' }}>
                Audio & Voice Guidance
              </h2>
              <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                Speech speed, companion voice, and audio encouragement
              </p>
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[rgba(var(--color-text-primary),0.1)] bg-[rgb(var(--color-surface-bg))]">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-6 h-6 text-[rgb(var(--color-primary))]" />
              ) : (
                <VolumeX className="w-6 h-6 text-[rgb(var(--color-text-secondary))]" />
              )}
              <div>
                <p className="font-bold text-sm text-[rgb(var(--color-text-primary))]">
                  Sound Effects & Voice
                </p>
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                  Allows MIRA to speak responses out loud
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!settings.soundEnabled)}
              role="switch"
              aria-checked={settings.soundEnabled}
              aria-label="Toggle sound and voice guidance"
              data-compact="true"
              className={`w-12 h-7 rounded-full relative flex-shrink-0 transition-colors duration-200 inline-flex items-center p-0.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] active:scale-95 ${
                settings.soundEnabled ? 'bg-[rgb(var(--color-primary))]' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
              style={{ minHeight: '28px', height: '28px', width: '48px' }}
            >
              <span
                className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Voice Gender Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[rgb(var(--color-text-primary))]">
              Companion Voice (MIRA / MIRO)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVoiceGender('female')}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  settings.voiceGender === 'female'
                    ? 'border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] font-bold shadow-sm'
                    : 'border-[rgba(var(--color-text-primary),0.12)] text-[rgb(var(--color-text-secondary))]'
                }`}
              >
                <span>👩 Female Voice (MIRA)</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceGender('male')}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  settings.voiceGender === 'male'
                    ? 'border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] font-bold shadow-sm'
                    : 'border-[rgba(var(--color-text-primary),0.12)] text-[rgb(var(--color-text-secondary))]'
                }`}
              >
                <span>👨 Male Voice (MIRO)</span>
              </button>
            </div>
          </div>

          {/* Speech Rate */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[rgb(var(--color-text-primary))]">
              Voice Reading Speed
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { speed: 'slow' as VoiceSpeed, label: 'Slow (Gentle)', rate: '0.8x' },
                { speed: 'normal' as VoiceSpeed, label: 'Normal', rate: '0.95x' },
                { speed: 'fast' as VoiceSpeed, label: 'Fast', rate: '1.1x' },
              ].map(({ speed, label, rate }) => {
                const isSelected = settings.voiceSpeed === speed;
                return (
                  <button
                    key={speed}
                    onClick={() => setVoiceSpeed(speed)}
                    className={`py-3 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                      isSelected
                        ? 'border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] font-bold'
                        : 'border-[rgba(var(--color-text-primary),0.12)] text-[rgb(var(--color-text-secondary))]'
                    }`}
                  >
                    <span className="text-xs font-bold">{label}</span>
                    <span className="text-[10px] opacity-75">{rate}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: COMPREHENSIVE LANGUAGE SUPPORT (20 LANGUAGES) ────────── */}
        <section className="p-6 rounded-3xl border border-[rgba(var(--color-text-primary),0.12)] bg-[rgb(var(--color-surface-card))] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-[rgb(var(--color-text-primary))]" style={{ fontSize: 'var(--text-lg)' }}>
                  {t('settings.language')} (20 Languages)
                </h2>
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                  Indian regional (Assamese, Hindi, Bengali, etc.) & International with RTL support
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]">
              {LANGUAGE_LIST.length} Available
            </span>
          </div>

          {/* Quick Search */}
          <input
            type="text"
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
            placeholder="Search language or script..."
            className="w-full px-4 py-2.5 rounded-xl border border-[rgba(var(--color-text-primary),0.15)] bg-[rgb(var(--color-surface-bg))] text-xs text-[rgb(var(--color-text-primary))] outline-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredLanguages.map(({ code, name, nativeName, region, dir }) => {
              const isSelected = settings.languageCode === code;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setLanguageCode(code);
                    showToast(`Language switched to ${name} (${nativeName})`);
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all active:scale-95 ${
                    isSelected
                      ? 'border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.08)] text-[rgb(var(--color-primary))] font-bold shadow-sm'
                      : 'border-[rgba(var(--color-text-primary),0.12)] text-[rgb(var(--color-text-secondary))] hover:border-[rgba(var(--color-text-primary),0.25)]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-bold text-[rgb(var(--color-text-primary))] truncate">
                      {nativeName} <span className="text-xs font-normal opacity-70">({name})</span>
                    </p>
                    <p className="text-[11px] opacity-70 truncate">
                      {region} {dir === 'rtl' ? '• RTL' : ''}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[rgb(var(--color-primary))]" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── SECTION 6: PWA APP INSTALLATION ──────────────────────────────────── */}
        <section className="p-6 rounded-3xl border border-[rgba(var(--color-text-primary),0.12)] bg-[rgb(var(--color-surface-card))] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-[rgb(var(--color-text-primary))]" style={{ fontSize: 'var(--text-lg)' }}>
                Install COGNIVA as PWA App
              </h2>
              <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                Install directly on mobile or desktop without APK
              </p>
            </div>
          </div>

          <p className="text-sm text-[rgb(var(--color-text-secondary))] leading-relaxed">
            COGNIVA runs as a progressive web app with offline capabilities, automatic updates, and full standalone home screen support.
          </p>

          <button
            onClick={handleInstallPWA}
            className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all hover:opacity-95"
          >
            <Download className="w-5 h-5" />
            {isInstalled ? 'App is Already Installed!' : 'Install App to Home Screen'}
          </button>
        </section>

        {/* ── SECTION 7: RESET TO DEFAULTS ────────────────────────────────────── */}
        <div className="pt-2">
          <button
            onClick={() => {
              resetToDefaults();
              showToast('All accessibility preferences reset to default.');
            }}
            className="w-full py-4 rounded-2xl border-2 border-red-500/30 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 active:scale-98 transition-all"
          >
            <RotateCcw className="w-5 h-5" /> Reset Preferences to Default
          </button>
        </div>

        {/* ── BACK TO HOME — In-flow button safely above bottom navigation ─────── */}
        <div className="pt-4 pb-12">
          <motion.button
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.97 }}
            className="w-full h-16 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:opacity-90"
            style={{
              background: 'rgb(var(--color-primary))',
              fontSize: 'var(--text-lg)',
            }}
          >
            <ArrowLeft className="w-6 h-6" /> Back to Home
          </motion.button>
        </div>

      </main>
    </div>
  );
}
