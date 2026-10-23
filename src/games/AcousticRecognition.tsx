import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { GameHeader, CompletionScreen } from './GameShared';
import { saveSession } from '../utils/storage';
import { syncPendingSessions } from '../services/syncService';

interface AcousticItem {
  id: string;
  name: string;
  emoji: string;
  soundType: 'bell' | 'rain' | 'flute' | 'bird';
  options: { name: string; emoji: string }[];
}

const ACOUSTIC_ITEMS: AcousticItem[] = [
  {
    id: 'temple_bell',
    name: 'Temple Bell',
    emoji: '🔔',
    soundType: 'bell',
    options: [
      { name: 'Temple Bell', emoji: '🔔' },
      { name: 'Rainfall', emoji: '🌧️' },
      { name: 'Tractor Engine', emoji: '🚜' },
    ],
  },
  {
    id: 'gentle_rain',
    name: 'Gentle Rain',
    emoji: '🌧️',
    soundType: 'rain',
    options: [
      { name: 'Birdsong', emoji: '🐦' },
      { name: 'Gentle Rain', emoji: '🌧️' },
      { name: 'Temple Bell', emoji: '🔔' },
    ],
  },
  {
    id: 'bamboo_flute',
    name: 'Bamboo Flute',
    emoji: '🪈',
    soundType: 'flute',
    options: [
      { name: 'Bamboo Flute', emoji: '🪈' },
      { name: 'Dhol Drum', emoji: '🥁' },
      { name: 'Rainfall', emoji: '🌧️' },
    ],
  },
  {
    id: 'morning_bird',
    name: 'Morning Birdsong',
    emoji: '🐦',
    soundType: 'bird',
    options: [
      { name: 'Tractor Engine', emoji: '🚜' },
      { name: 'Morning Birdsong', emoji: '🐦' },
      { name: 'Bamboo Flute', emoji: '🪈' },
    ],
  },
];

export function AcousticRecognition() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [replayCount, setReplayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'complete'>('playing');
  const [totalTime, setTotalTime] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  const currentItem = ACOUSTIC_ITEMS[currentIndex];

  // Synthesize realistic acoustic audio offline using Web Audio API
  const playSoundEffect = (type: 'bell' | 'rain' | 'flute' | 'bird') => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      setIsPlaying(true);

      if (type === 'bell') {
        // Resonant metallic chime with harmonic decay
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(293.66, ctx.currentTime + 1.8);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2.0);
      } else if (type === 'rain') {
        // Filtered pink/white noise simulating peaceful rainfall
        const bufferSize = ctx.sampleRate * 2.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } else if (type === 'flute') {
        // Warm lyrical woodwind tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(523.25, ctx.currentTime + 0.6);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.4);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.8);
      } else {
        // High chirping birdsong frequency modulation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(3200, ctx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      }

      setTimeout(() => setIsPlaying(false), 2000);
    } catch {
      setIsPlaying(false);
    }
  };

  const handlePlaySound = () => {
    setReplayCount(r => r + 1);
    playSoundEffect(currentItem.soundType);
  };

  const handleSelectOption = (name: string) => {
    if (name === currentItem.name) {
      // Correct
      if (currentIndex + 1 < ACOUSTIC_ITEMS.length) {
        setCurrentIndex(i => i + 1);
      } else {
        const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
        setTotalTime(elapsed);

        saveSession({
          game: 'ACOUSTIC_RECOGNITION',
          time_taken_sec: elapsed,
          error_count: errors,
          difficulty: 'MEDIUM',
          level: 2,
          metrics: {
            total_items: ACOUSTIC_ITEMS.length,
            replay_count: replayCount,
            auditory_score: Math.max(40, 100 - errors * 20),
          },
        });

        syncPendingSessions();
        setSyncTrigger(t => t + 1);
        setPhase('complete');
      }
    } else {
      setErrors(e => e + 1);
      handlePlaySound();
    }
  };

  if (phase === 'complete') {
    return (
      <CompletionScreen
        title="Acoustic Recognition Complete"
        miraMessage="Splendid listening! Distinguishing familiar environmental sounds exercises auditory processing and recall."
        timeLabel={`${totalTime}s`}
        errorCount={errors}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setErrors(0);
          setReplayCount(0);
          startTimeRef.current = Date.now();
          setPhase('playing');
        }}
        onHome={() => navigate('/games')}
        syncTrigger={syncTrigger}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <GameHeader
        title="Acoustic Recognition"
        onBack={() => navigate('/games')}
        onReset={() => {
          setCurrentIndex(0);
          setErrors(0);
        }}
        syncTrigger={syncTrigger}
      />

      <div className="flex-1 flex flex-col justify-between px-6 py-6 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
            Sound {currentIndex + 1} of {ACOUSTIC_ITEMS.length}
          </span>
          <span className="text-xs text-stone-400 font-semibold">
            Replays: {replayCount}
          </span>
        </div>

        {/* Central Audio Play Target */}
        <div className="text-center space-y-4 my-auto">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handlePlaySound}
            aria-label="Play sound clip"
            className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-2xl transition-all ${
              isPlaying
                ? 'bg-amber-500 ring-8 ring-amber-200 text-white animate-pulse'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            <Play className={`w-14 h-14 ${isPlaying ? 'scale-110' : 'ml-1.5'}`} />
          </motion.button>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Tap the button to listen
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1 dark:text-stone-400">
              Listen carefully, then identify which familiar sound was played.
            </p>
          </div>
        </div>

        {/* 3 Large Accessible Answer Cards */}
        <div className="space-y-3 w-full">
          {currentItem.options.map(opt => (
            <motion.button
              key={opt.name}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectOption(opt.name)}
              className="w-full py-4 px-5 rounded-2xl border-2 border-stone-200 bg-stone-50 font-extrabold text-base text-stone-900 flex items-center gap-3 active:border-violet-500 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <span className="text-3xl" aria-hidden="true">{opt.emoji}</span>
              <span>{opt.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
