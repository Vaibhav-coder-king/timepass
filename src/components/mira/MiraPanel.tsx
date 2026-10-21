import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Send, Volume2, Gamepad2, Sparkles, User, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MiraSessionState } from '../../types/types';
import { MiraAvatarOrb } from './MiraAvatarOrb';
import { MiraTranscriptBubble } from './MiraTranscriptBubble';
import { MiraErrorToast } from './MiraErrorToast';
import { useMira } from '../../context/MiraContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { speakMira, getGeminiApiKey } from '../../services/geminiService';

interface MiraPanelProps {
  isOpen: boolean;
  session: MiraSessionState;
  onClose: () => void;
}

const LOCALIZED_DATA: Record<string, {
  companionName: string;
  welcome: string;
  statusLabels: Record<string, string>;
  prompts: Array<{ label: string; text: string }>;
}> = {
  en: {
    companionName: 'MIRA AI',
    welcome: "Namaste! I am your memory and cognitive companion. You can ask me about your day, your medicines, or we can play a relaxing memory game.",
    statusLabels: {
      idle: "Tap microphone or pick a topic below",
      listening: "Listening… speak whenever you're ready",
      processing: "MIRA is thinking with Gemini AI…",
      speaking: "MIRA is speaking…",
      error: "Let's try that again",
    },
    prompts: [
      { label: '🎮 Play Memory Match', text: 'Let’s play Memory Match with Assam tea and rhino cards!' },
      { label: '🧩 Daily Routine Game', text: 'Help me with my daily routine sequence game.' },
      { label: '⏰ My Medicine Time', text: 'When is my medicine reminder today?' },
      { label: '☕ Reminisce about Assam', text: 'Tell me a peaceful memory about Assam tea gardens.' },
      { label: '💛 I feel confused', text: 'I am feeling a little confused right now.' },
    ],
  },
  as: {
    companionName: 'মীৰা (MIRA)',
    welcome: "নমস্কাৰ! মই আপোনাৰ স্মৃতি আৰু মগজুৰ সংগী মীৰা। আপুনি আজিৰ দিনটো, ঔষধৰ সময় বা আমাৰ মনোৰম মেম’ৰী খেলৰ বিষয়ে সুধিব পাৰে।",
    statusLabels: {
      idle: "মাইক্ৰ'ফনত স্পৰ্শ কৰক বা তলত এটা বাছি লওক",
      listening: "শুনি আছোঁ… কওক",
      processing: "মীৰাই চিন্তা কৰি আছে…",
      speaking: "মীৰাই উত্তৰ দি আছে…",
      error: "আকৌ চেষ্টা কৰক",
    },
    prompts: [
      { label: '🎮 মেম’ৰী খেল খেলোঁ', text: 'আহক কাজিৰঙাৰ গঁড় আৰু চাহৰ কাৰ্ড লৈ মেম’ৰী মেচ খেলোঁ!' },
      { label: '🧩 দৈনিক ৰুটিন খেল', text: 'মোক দৈনিক নিয়ম সজোৱা খেলত সহায় কৰক।' },
      { label: '⏰ ঔষধৰ সময়', text: 'আজি মোৰ ঔষধ খোৱাৰ সময় কেতিয়া?' },
      { label: '☕ অসমৰ চাহ বাগিচা', text: 'অসমৰ চাহ বাগিচাৰ বিষয়ে কিবা এটা শান্ত কথা কওক।' },
      { label: '💛 মোৰ ভয় লাগিছে', text: 'মই অলপ বিভ্ৰান্ত আৰু ভয় খাইছোঁ।' },
    ],
  },
  hi: {
    companionName: 'मीरा (MIRA)',
    welcome: "नमस्ते! मैं आपकी दिमागी और याददाश्त साथी मीरा हूँ। आप मुझसे अपनी दिनचर्या, दवाइयों के समय या मेमोरी मैच खेल के बारे में पूछ सकते हैं।",
    statusLabels: {
      idle: "माइक पर टैप करें या नीचे से विषय चुनें",
      listening: "सुन रही हूँ… बोलिए",
      processing: "मीरा सोच रही है…",
      speaking: "मीरा बोल रही है…",
      error: "फिर से प्रयास करें",
    },
    prompts: [
      { label: '🎮 मेमोरी मैच खेलें', text: 'चलिए असम के गैंडे और चाय के सुंदर कार्ड वाला खेल खेलते हैं!' },
      { label: '🧩 दिनचर्या क्रम खेल', text: 'सुबह की दिनचर्या सही क्रम में जमाने वाले खेल में मदद कीजिए।' },
      { label: '⏰ दवा का समय', text: 'आज मेरी दवा का समय कब है?' },
      { label: '☕ असम की यादें', text: 'मुझे असम के चाय बागानों की कोई प्यारी बात बताइए।' },
      { label: '💛 मुझे घबराहट हो रही है', text: 'मुझे थोड़ा भ्रम और डर लग रहा है।' },
    ],
  },
  bn: {
    companionName: 'মীরা (MIRA)',
    welcome: "নমস্কার! আমি আপনার স্মৃতি ও মনের যত্নশীল বন্ধু মীরা। আপনি আপনার দিন, ওষুধ বা মেমোরি ম্যাচ খেলা নিয়ে কথা বলতে পারেন।",
    statusLabels: {
      idle: "মাইক্রোফোনে চাপুন অথবা নিচের বিষয় বেছে নিন",
      listening: "শুনছি… বলুন",
      processing: "মীরা ভাবছে…",
      speaking: "মীরা বলছে…",
      error: "আবার চেষ্টা করুন",
    },
    prompts: [
      { label: '🎮 মেমোরি খেলা খেলি', text: 'আসুন আসামের গণ্ডার আর চায়ের কার্ড দিয়ে মেমোরি ম্যাচ খেলি!' },
      { label: '🧩 দৈনন্দিন কাজের পর্যায়', text: 'আমার সকালের রুটিন সাজানোর খেলায় সাহায্য করুন।' },
      { label: '⏰ ওষুধের সময়', text: 'আজ আমার ওষুধ খাওয়ার সময় কখন?' },
      { label: '☕ আসামের চা বাগান', text: 'আসামের সুন্দর চা বাগানের গল্প বলুন।' },
      { label: '💛 মনটা ভয় ভয় করছে', text: 'আমার একটু বিভ্রান্ত লাগছে।' },
    ],
  },
};

/**
 * Expanded MIRA conversational panel.
 * Slides up from the bottom on activation.
 * Powered by Google Gemini AI with dementia-specific memory grounding & cognitive games assistance.
 */
export function MiraPanel({ isOpen, session, onClose }: MiraPanelProps) {
  const { activate, askQuestion, setErrorMessage } = useMira();
  const { settings, setVoiceGender } = useAccessibility();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasApiKey = Boolean(getGeminiApiKey());

  // Localized configuration for the active language
  const loc = LOCALIZED_DATA[settings.languageCode] || LOCALIZED_DATA.en;

  // Focus management
  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // Scroll to bottom when response or transcript updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.transcript, session.responseText, session.state]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSendText = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;
    setInputText('');
    askQuestion(query);
  };

  const handleReplayAudio = () => {
    if (session.responseText) {
      speakMira(session.responseText, {
        languageCode: settings.languageCode,
        speed: settings.voiceSpeed,
        gender: settings.voiceGender,
        soundEnabled: true,
      });
    }
  };

  const isListening = session.state === 'listening';
  const isProcessing = session.state === 'processing';
  const statusLabel = loc.statusLabels[session.state] ?? loc.statusLabels.idle;

  // Check if response mentions games so we can offer a direct shortcut
  const isGameMentioned =
    session.responseText &&
    (session.responseText.toLowerCase().includes('memory match') ||
      session.responseText.toLowerCase().includes('game') ||
      session.responseText.toLowerCase().includes('খেল') ||
      session.responseText.toLowerCase().includes('खेल') ||
      session.responseText.toLowerCase().includes('rhino') ||
      session.responseText.toLowerCase().includes('গঁড়') ||
      session.responseText.toLowerCase().includes('गैंडा'));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mira-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="mira-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Talk to MIRA"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: 'rgb(var(--color-surface-bg))',
              maxHeight: '90vh',
              height: '84vh',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden="true">
              <div className="w-12 h-1.5 rounded-full bg-[rgba(var(--color-text-primary),0.2)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(var(--color-text-primary),0.06)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MiraAvatarOrb state={session.state} size={48} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className="font-bold text-gradient-primary"
                      style={{ fontSize: 'var(--text-xl)' }}
                    >
                      {settings.voiceGender === 'male' ? 'MIRO AI' : loc.companionName}
                    </h2>
                    {hasApiKey ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <Sparkles className="w-3 h-3" /> Gemini
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        NER Companion
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[rgb(var(--color-text-secondary))]"
                    style={{ fontSize: 'var(--text-xs)' }}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {statusLabel}
                  </p>
                </div>
              </div>

              {/* Top controls: Male/Female voice switcher & Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextGender = settings.voiceGender === 'female' ? 'male' : 'female';
                    setVoiceGender(nextGender);
                    speakMira(nextGender === 'female' ? 'Hello, I am Mira.' : 'Hello, I am Miro.', {
                      languageCode: settings.languageCode,
                      gender: nextGender,
                      speed: settings.voiceSpeed,
                      soundEnabled: true,
                    });
                  }}
                  title="Switch between Female (Mira) and Male (Miro) voice"
                  aria-label="Switch voice gender"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[rgba(var(--color-text-primary),0.15)] bg-[rgb(var(--color-surface-card))] text-xs font-bold text-[rgb(var(--color-primary))] transition-all active:scale-95"
                >
                  {settings.voiceGender === 'female' ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-pink-500" /> 👩 Female
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-blue-500" /> 👨 Male
                    </>
                  )}
                </button>

                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close MIRA"
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-text-primary),0.08)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Localized welcoming greeting */}
              <MiraTranscriptBubble
                text={loc.welcome}
                speaker="mira"
                state={session.state}
              />

              {/* User transcript */}
              {session.transcript && (
                <MiraTranscriptBubble
                  text={session.transcript}
                  speaker="user"
                  state={session.state}
                />
              )}

              {/* MIRA thinking indicator */}
              {isProcessing && (
                <MiraTranscriptBubble
                  text=""
                  speaker="mira"
                  state="processing"
                />
              )}

              {/* MIRA response */}
              {session.responseText && (
                <div className="space-y-2">
                  <MiraTranscriptBubble
                    text={session.responseText}
                    speaker="mira"
                    state={session.state}
                  />

                  {/* Audio replay button */}
                  <div className="flex items-center gap-2 pl-10">
                    <button
                      onClick={handleReplayAudio}
                      aria-label="Listen to response again"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.18)] transition-all"
                    >
                      <Volume2 className="w-4 h-4" /> Listen Again
                    </button>

                    {isGameMentioned && (
                      <button
                        onClick={() => {
                          onClose();
                          navigate('/games/memory-match');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-all"
                      >
                        <Gamepad2 className="w-4 h-4" /> Start Memory Match
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick suggestions when idle */}
              {session.state === 'idle' && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-secondary))]">
                    Suggested topics:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {loc.prompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendText(prompt.text)}
                        className="text-left px-3.5 py-2 rounded-2xl border border-[rgba(var(--color-text-primary),0.12)] hover:border-[rgb(var(--color-primary))] bg-[rgba(var(--color-surface-card),0.6)] text-[rgb(var(--color-text-primary))] text-sm font-medium transition-all active:scale-95"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error toast */}
              <MiraErrorToast
                message={session.errorMessage}
                onDismiss={() => setErrorMessage('')}
                onRetry={activate}
              />

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Controls: Text input + Big Voice button */}
            <div className="p-4 bg-[rgba(var(--color-surface-bg),0.98)] border-t border-[rgba(var(--color-text-primary),0.06)] flex-shrink-0 space-y-3">
              {/* Text input form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendText();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type or speak a question for MIRA..."
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 rounded-2xl border-2 border-[rgba(var(--color-text-primary),0.12)] focus:border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-card))] text-[rgb(var(--color-text-primary))] text-base outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  aria-label="Send message"
                  className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[rgb(var(--color-primary))] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

              {/* Microphone speak button */}
              <button
                onClick={isListening ? onClose : activate}
                aria-label={isListening ? 'Stop listening' : 'Start speaking to MIRA'}
                aria-pressed={isListening}
                className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold transition-all duration-300 active:scale-98"
                style={{
                  minHeight: 56,
                  fontSize: 'var(--text-lg)',
                  background: isListening
                    ? 'rgb(var(--color-error))'
                    : 'rgb(var(--color-primary))',
                  color: 'white',
                  boxShadow: isListening
                    ? '0 8px 24px rgba(239,68,68,0.35)'
                    : 'var(--shadow-float)',
                }}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-6 h-6 animate-pulse" aria-hidden="true" />
                    Listening… Tap to Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" aria-hidden="true" />
                    Speak to {settings.voiceGender === 'male' ? 'MIRO' : 'MIRA'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
