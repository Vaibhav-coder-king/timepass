import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Volume2 } from 'lucide-react';
import { GameHeader, CompletionScreen } from './GameShared';
import { saveSession } from '../utils/storage';
import { syncPendingSessions } from '../services/syncService';

interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export function RealityAnchor() {
  const navigate = useNavigate();

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-IN', { weekday: 'long' });
  const currentYear = String(now.getFullYear());
  const hour = now.getHours();
  const currentTimeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  const questions: Question[] = [
    {
      id: 'day_of_week',
      prompt: 'What day of the week is it today?',
      options: [currentDay, 'Sunday', 'Wednesday', 'Friday'].filter(
        (v, i, a) => a.indexOf(v) === i
      ).slice(0, 3).sort(),
      correctAnswer: currentDay,
    },
    {
      id: 'time_of_day',
      prompt: 'Which part of the day are we in right now?',
      options: ['Morning', 'Afternoon', 'Evening'],
      correctAnswer: currentTimeSlot,
    },
    {
      id: 'year',
      prompt: 'What year is it right now?',
      options: [currentYear, String(Number(currentYear) - 1), String(Number(currentYear) + 1)].sort(),
      correctAnswer: currentYear,
    },
    {
      id: 'surroundings',
      prompt: 'Where are you resting right now?',
      options: ['Safe and warm at home', 'In a distant market', 'At a railway station'],
      correctAnswer: 'Safe and warm at home',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'complete'>('playing');
  const [totalTime, setTotalTime] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  const currentQ = questions[currentIndex];

  const speakPrompt = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleAnswer = (chosen: string) => {
    if (chosen === currentQ.correctAnswer) {
      setCorrectCount(c => c + 1);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1);
    } else {
      finishGame(correctCount + (chosen === currentQ.correctAnswer ? 1 : 0), skipCount);
    }
  };

  const handleSkipOrUnknown = () => {
    setSkipCount(s => s + 1);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1);
    } else {
      finishGame(correctCount, skipCount + 1);
    }
  };

  const finishGame = (finalCorrect: number, finalSkips: number) => {
    const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    setTotalTime(elapsed);

    saveSession({
      game: 'REALITY_ANCHOR',
      time_taken_sec: elapsed,
      error_count: questions.length - finalCorrect - finalSkips,
      difficulty: 'EASY',
      level: 1,
      metrics: {
        total_questions: questions.length,
        correct_count: finalCorrect,
        skipped_count: finalSkips,
        orientation_score: Math.round((finalCorrect / questions.length) * 100),
      },
    });

    syncPendingSessions();
    setSyncTrigger(t => t + 1);
    setPhase('complete');
  };

  if (phase === 'complete') {
    return (
      <CompletionScreen
        title="Orientation Anchor Complete"
        miraMessage="You are grounded and safe. Checking in on today's time and place gives reassurance to both mind and heart."
        timeLabel={`${totalTime}s`}
        errorCount={questions.length - correctCount}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setCorrectCount(0);
          setSkipCount(0);
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
        title="Reality Anchor"
        onBack={() => navigate('/games')}
        onReset={() => {
          setCurrentIndex(0);
          setCorrectCount(0);
        }}
        syncTrigger={syncTrigger}
      />

      <div className="flex-1 flex flex-col justify-between px-6 py-6 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <button
            onClick={() => speakPrompt(currentQ.prompt)}
            className="p-2 rounded-xl bg-stone-100 text-stone-600 active:scale-95 dark:bg-slate-800 dark:text-stone-300"
            title="Read question out loud"
          >
            <Volume2 className="w-5 h-5 text-violet-600" />
          </button>
        </div>

        {/* Question Prompt */}
        <div className="text-center space-y-3 my-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm dark:bg-emerald-950/30 dark:text-emerald-400">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 leading-snug dark:text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {currentQ.prompt}
          </h2>
        </div>

        {/* Option Buttons */}
        <div className="space-y-3 w-full">
          {currentQ.options.map(opt => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className="w-full py-4 px-5 rounded-2xl border-2 border-stone-200 bg-stone-50 font-extrabold text-base text-stone-900 hover:border-violet-500 hover:bg-violet-50/40 text-left transition-all active:scale-98 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              {opt}
            </button>
          ))}

          {/* Gentle "I'm not sure / Skip" escape target */}
          <button
            onClick={handleSkipOrUnknown}
            className="w-full py-3 rounded-2xl border border-dashed border-stone-300 bg-transparent font-bold text-xs text-stone-500 hover:bg-stone-100 transition-all dark:border-slate-700 dark:text-stone-400"
          >
            I'm not sure right now · Skip
          </button>
        </div>
      </div>
    </div>
  );
}
