import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { GameHeader, CompletionScreen } from './GameShared';
import { saveSession } from '../utils/storage';
import { syncPendingSessions } from '../services/syncService';
import { useLanguage } from '../context/LanguageContext';

interface StroopTrial {
  targetShape: 'sun' | 'moon' | 'leaf' | 'flower';
  spokenName: { en: string; hi: string; as: string };
  options: {
    shape: 'sun' | 'moon' | 'leaf' | 'flower';
    color: string; // Conflicting color stimulus
    emoji: string;
  }[];
}

const TRIALS: StroopTrial[] = [
  {
    targetShape: 'sun',
    spokenName: { en: 'Tap the Sun', hi: 'सूरज पर छुएं', as: 'সূৰ্য্যত স্পৰ্শ কৰক' },
    options: [
      { shape: 'sun', color: '#3b82f6', emoji: '☀️' }, // Sun rendered in blue!
      { shape: 'moon', color: '#eab308', emoji: '🌙' }, // Moon rendered in yellow!
    ],
  },
  {
    targetShape: 'leaf',
    spokenName: { en: 'Tap the Leaf', hi: 'पत्ते पर छुएं', as: 'পাতত স্পৰ্শ কৰক' },
    options: [
      { shape: 'flower', color: '#22c55e', emoji: '🌸' }, // Flower rendered in green!
      { shape: 'leaf', color: '#ef4444', emoji: '🍃' }, // Leaf rendered in red!
    ],
  },
  {
    targetShape: 'moon',
    spokenName: { en: 'Tap the Moon', hi: 'चांद पर छुएं', as: 'জোনত স্পৰ্শ কৰক' },
    options: [
      { shape: 'sun', color: '#a855f7', emoji: '☀️' },
      { shape: 'moon', color: '#3b82f6', emoji: '🌙' },
    ],
  },
  {
    targetShape: 'flower',
    spokenName: { en: 'Tap the Flower', hi: 'फूल पर छुएं', as: 'ফুলত স্পৰ্শ কৰক' },
    options: [
      { shape: 'flower', color: '#f97316', emoji: '🌸' },
      { shape: 'leaf', color: '#ec4899', emoji: '🍃' },
    ],
  },
];

export function AudioStroop() {
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const langKey = (locale === 'hi' || locale === 'as') ? locale : 'en';

  const [trialIndex, setTrialIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [phase, setPhase] = useState<'practice' | 'testing' | 'complete'>('practice');
  const [latencies, setLatencies] = useState<number[]>([]);
  const [trialStartTime, setTrialStartTime] = useState<number>(Date.now());
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const gameStartRef = useRef<number>(Date.now());

  const currentTrial = TRIALS[trialIndex % TRIALS.length];
  const instruction = currentTrial.spokenName[langKey];

  // Text-to-speech pronunciation of vernacular instruction
  const playInstructionAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(instruction);
      utterance.lang = langKey === 'hi' ? 'hi-IN' : langKey === 'as' ? 'as-IN' : 'en-IN';
      utterance.rate = 0.85; // Calibrated slower pace for elderly comfort
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    playInstructionAudio();
    setTrialStartTime(Date.now());
  }, [trialIndex, phase]);

  const handleSelectOption = (selectedShape: 'sun' | 'moon' | 'leaf' | 'flower') => {
    const latency = Date.now() - trialStartTime;
    setLatencies(prev => [...prev, latency]);

    if (selectedShape === currentTrial.targetShape) {
      // Correct selection
      if (phase === 'practice') {
        setPhase('testing');
        setTrialIndex(0);
        gameStartRef.current = Date.now();
        return;
      }

      if (trialIndex + 1 < TRIALS.length) {
        setTrialIndex(i => i + 1);
      } else {
        // Complete
        const elapsed = Math.max(1, Math.floor((Date.now() - gameStartRef.current) / 1000));
        setTotalTime(elapsed);
        const avgLatency = Math.round(
          [...latencies, latency].reduce((a, b) => a + b, 0) / (latencies.length + 1)
        );

        saveSession({
          game: 'AUDIO_STROOP',
          time_taken_sec: elapsed,
          error_count: errors,
          difficulty: 'MEDIUM',
          level: 2,
          metrics: {
            avg_latency_ms: avgLatency,
            total_trials: TRIALS.length,
            accuracy_rate: Number(((TRIALS.length / (TRIALS.length + errors)) * 100).toFixed(1)),
            inhibition_score: Math.max(30, 100 - errors * 15),
          },
        });

        syncPendingSessions();
        setSyncTrigger(t => t + 1);
        setPhase('complete');
      }
    } else {
      // Incongruent interference error
      setErrors(e => e + 1);
      playInstructionAudio();
    }
  };

  if (phase === 'complete') {
    return (
      <CompletionScreen
        title="Attention Focus Complete"
        miraMessage="Well done! Listening and choosing despite confusing colors is fantastic training for selective attention."
        timeLabel={`${totalTime}s`}
        errorCount={errors}
        onPlayAgain={() => {
          setPhase('practice');
          setTrialIndex(0);
          setErrors(0);
          setLatencies([]);
        }}
        onHome={() => navigate('/games')}
        syncTrigger={syncTrigger}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <GameHeader
        title="Vernacular Audio-Stroop"
        onBack={() => navigate('/games')}
        onReset={() => {
          setPhase('practice');
          setTrialIndex(0);
          setErrors(0);
        }}
        syncTrigger={syncTrigger}
      />

      <div className="flex-1 flex flex-col items-center justify-between px-6 py-6 max-w-lg mx-auto w-full">
        {/* Phase Indicator */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
            {phase === 'practice' ? '🌱 Practice Round' : `Trial ${trialIndex + 1} of ${TRIALS.length}`}
          </span>
        </div>

        {/* Big Vernacular Instruction & Voice Button */}
        <div className="text-center space-y-4 my-auto">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={playInstructionAudio}
            aria-label="Replay instruction voice"
            className="w-24 h-24 rounded-full bg-violet-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-violet-200 dark:shadow-none active:bg-violet-700"
          >
            <Volume2 className="w-12 h-12" />
          </motion.button>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
              "{instruction}"
            </h2>
            <p className="text-xs text-stone-500 font-medium dark:text-stone-400">
              Listen to the shape name. Ignore the misleading colors!
            </p>
          </div>
        </div>

        {/* 2 Big Accessible Tap Options (Fitts's Law 80px touch targets) */}
        <div className="grid grid-cols-2 gap-4 w-full pt-4">
          {currentTrial.options.map(opt => (
            <motion.button
              key={opt.shape}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelectOption(opt.shape)}
              className="aspect-square rounded-3xl p-4 flex flex-col items-center justify-center border-3 border-stone-200 bg-stone-50 shadow-md active:border-violet-500 transition-all dark:bg-slate-800 dark:border-slate-700"
              style={{
                minHeight: 120,
              }}
            >
              <span className="text-6xl mb-2" aria-hidden="true">
                {opt.emoji}
              </span>
              <span
                className="w-4 h-4 rounded-full shadow-inner"
                style={{ background: opt.color }}
                aria-hidden="true"
              />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
