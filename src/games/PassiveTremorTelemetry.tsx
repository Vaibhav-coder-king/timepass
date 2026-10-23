import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { saveSession } from '../utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'instructions' | 'permission' | 'measuring' | 'results' | 'unsupported';

interface TremorSample {
  x: number;
  y: number;
  z: number;
}

interface ResultData {
  rmsValue: number;
  sampleCount: number;
  permissionGranted: boolean;
  sensorAvailable: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEASURE_DURATION_MS = 5000;
const MEASURE_DURATION_S = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeRMS(samples: TremorSample[]): number {
  if (samples.length === 0) return 0;
  const sumSq = samples.reduce((acc, s) => acc + s.x * s.x + s.y * s.y + s.z * s.z, 0);
  return Math.sqrt(sumSq / samples.length);
}

/** Clamp jiggle radius to [0, 40] pixels for visual indicator */
function jiggleRadius(rms: number): number {
  return Math.min(40, rms * 8);
}

// DeviceMotionEvent.requestPermission is only available on iOS 13+
function canRequestMotionPermission(): boolean {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function'
  );
}

function isDeviceMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PassiveTremorTelemetry() {
  const navigate = useNavigate();

  const [screen, setScreen] = useState<Screen>(() =>
    isDeviceMotionSupported() ? 'instructions' : 'unsupported'
  );

  const [countdown, setCountdown] = useState<number>(MEASURE_DURATION_S);
  const [liveRMS, setLiveRMS] = useState<number>(0);
  const [result, setResult] = useState<ResultData | null>(null);

  const samplesRef = useRef<TremorSample[]>([]);
  const listenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const measureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveRMSIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up all timers/listeners on unmount
  useEffect(() => {
    return () => {
      stopMeasurement();
    };
  }, []);

  // ── Permission ──────────────────────────────────────────────────────────────

  async function requestPermission() {
    if (canRequestMotionPermission()) {
      try {
        const permission = await (
          DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        if (permission === 'granted') {
          startMeasurement(true);
        } else {
          setResult({
            rmsValue: 0,
            sampleCount: 0,
            permissionGranted: false,
            sensorAvailable: true,
          });
          setScreen('results');
        }
      } catch {
        setResult({
          rmsValue: 0,
          sampleCount: 0,
          permissionGranted: false,
          sensorAvailable: true,
        });
        setScreen('results');
      }
    } else {
      // Android / desktop — no explicit permission needed
      startMeasurement(true);
    }
  }

  // ── Measurement ─────────────────────────────────────────────────────────────

  function startMeasurement(permissionGranted: boolean) {
    samplesRef.current = [];
    setCountdown(MEASURE_DURATION_S);
    setLiveRMS(0);
    setScreen('measuring');

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.acceleration ?? e.accelerationIncludingGravity;
      if (!acc) return;
      samplesRef.current.push({
        x: acc.x ?? 0,
        y: acc.y ?? 0,
        z: acc.z ?? 0,
      });
    };

    listenerRef.current = handler;
    window.addEventListener('devicemotion', handler);

    // Countdown timer
    let remaining = MEASURE_DURATION_S;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
    }, 1000);

    // Live RMS update (~10Hz for visual smoothness)
    liveRMSIntervalRef.current = setInterval(() => {
      setLiveRMS(computeRMS(samplesRef.current));
    }, 100);

    // Stop after 5 seconds
    measureTimeoutRef.current = setTimeout(() => {
      stopMeasurement();
      const rmsValue = computeRMS(samplesRef.current);
      setResult({
        rmsValue,
        sampleCount: samplesRef.current.length,
        permissionGranted,
        sensorAvailable: true,
      });
      setScreen('results');
    }, MEASURE_DURATION_MS);
  }

  function stopMeasurement() {
    if (listenerRef.current) {
      window.removeEventListener('devicemotion', listenerRef.current);
      listenerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (liveRMSIntervalRef.current) {
      clearInterval(liveRMSIntervalRef.current);
      liveRMSIntervalRef.current = null;
    }
    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
      measureTimeoutRef.current = null;
    }
  }

  // ── Session saving ──────────────────────────────────────────────────────────

  function handleDone(data: ResultData) {
    saveSession({
      game: 'TREMOR_TELEMETRY',
      game_type: 'TREMOR_TELEMETRY',
      time_taken_sec: 5,
      error_count: 0,
      level: 1,
      score: Math.round(data.rmsValue * 100),
      max_score: 100,
      duration_seconds: 5,
      completed: true,
      difficulty: 'EASY',
      metrics: {
        rms_tremor: data.rmsValue,
        sample_count: data.sampleCount,
        duration_ms: 5000,
        sensor_available: data.sensorAvailable,
        permission_granted: data.permissionGranted,
      },
    });
    navigate('/games');
  }

  function handleSkip() {
    saveSession({
      game: 'TREMOR_TELEMETRY',
      game_type: 'TREMOR_TELEMETRY',
      time_taken_sec: 0,
      error_count: 0,
      level: 1,
      score: 0,
      max_score: 100,
      duration_seconds: 0,
      completed: true,
      difficulty: 'EASY',
      metrics: {
        rms_tremor: 0,
        sample_count: 0,
        duration_ms: 5000,
        sensor_available: false,
        permission_granted: false,
      },
    });
    navigate('/games');
  }

  function handlePlayAgain() {
    setResult(null);
    setScreen('instructions');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'rgb(var(--color-surface-bg))',
        color: 'rgb(var(--color-text-primary))',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgb(var(--color-border))',
          background: 'rgb(var(--color-surface-card))',
        }}
      >
        <button
          onClick={() => navigate('/games')}
          aria-label="Back to games"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgb(var(--color-text-primary))',
            display: 'flex',
            alignItems: 'center',
            padding: 8,
          }}
        >
          <ArrowLeft size={28} />
        </button>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>
          Steadiness Check
        </h1>
      </div>

      {/* Screens */}
      <AnimatePresence mode="wait">
        {screen === 'instructions' && (
          <ScreenInstructions
            key="instructions"
            onNext={() => setScreen('permission')}
          />
        )}

        {screen === 'permission' && (
          <ScreenPermission
            key="permission"
            onAllow={requestPermission}
            onSkip={handleSkip}
          />
        )}

        {screen === 'measuring' && (
          <ScreenMeasuring
            key="measuring"
            countdown={countdown}
            liveRMS={liveRMS}
          />
        )}

        {screen === 'results' && result && (
          <ScreenResults
            key="results"
            result={result}
            onPlayAgain={handlePlayAgain}
            onDone={() => handleDone(result)}
          />
        )}

        {screen === 'unsupported' && (
          <ScreenUnsupported key="unsupported" onSkip={handleSkip} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-screens ──────────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35, ease: 'easeOut' },
} as const;

function ScreenInstructions({ onNext }: { onNext: () => void }) {
  return (
    <motion.div {...fadeSlide} style={centeredPane}>
      <span style={{ fontSize: 72 }}>🤲</span>
      <h2 style={headingStyle}>Let's check your steadiness</h2>
      <p style={bodyStyle}>
        Hold your phone still — either lay it on a flat surface or hold it gently in your hand.
        We'll measure how steady you are for just 5 seconds.
      </p>
      <p style={{ ...bodyStyle, fontStyle: 'italic', fontSize: 'var(--text-sm)' }}>
        ⚠️ This is <strong>not</strong> a medical test. It's just a fun activity!
      </p>
      <button style={primaryBtn} onClick={onNext}>
        I'm Ready
      </button>
    </motion.div>
  );
}

function ScreenPermission({
  onAllow,
  onSkip,
}: {
  onAllow: () => void;
  onSkip: () => void;
}) {
  return (
    <motion.div {...fadeSlide} style={centeredPane}>
      <span style={{ fontSize: 72 }}>📡</span>
      <h2 style={headingStyle}>Allow sensor access</h2>
      <p style={bodyStyle}>
        To measure steadiness, we need access to your phone's motion sensors. No data leaves your
        device.
      </p>
      <button style={primaryBtn} onClick={onAllow}>
        Allow Sensor Access
      </button>
      <button style={secondaryBtn} onClick={onSkip}>
        Skip this activity
      </button>
    </motion.div>
  );
}

function ScreenMeasuring({
  countdown,
  liveRMS,
}: {
  countdown: number;
  liveRMS: number;
}) {
  const offset = jiggleRadius(liveRMS);
  // Animate circle position gently based on live RMS
  const cx = 50 + (Math.sin(Date.now() / 80) * offset) / 2;
  const cy = 50 + (Math.cos(Date.now() / 60) * offset) / 2;

  return (
    <motion.div {...fadeSlide} style={centeredPane}>
      <h2 style={headingStyle}>Hold steady…</h2>

      {/* Countdown */}
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          lineHeight: 1,
          color: 'rgb(var(--color-primary))',
        }}
      >
        {countdown}
      </div>

      {/* Jiggle indicator */}
      <div
        aria-hidden="true"
        style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: '3px solid rgb(var(--color-border))',
          position: 'relative',
          overflow: 'hidden',
          background: 'rgb(var(--color-surface-card))',
        }}
      >
        <motion.div
          animate={{ x: cx - 50, y: cy - 50 }}
          transition={{ duration: 0.1, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgb(var(--color-primary))',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      <p style={bodyStyle}>Keep your phone as still as possible.</p>
    </motion.div>
  );
}

function ScreenResults({
  result,
  onPlayAgain,
  onDone,
}: {
  result: ResultData;
  onPlayAgain: () => void;
  onDone: () => void;
}) {
  return (
    <motion.div {...fadeSlide} style={centeredPane}>
      <span style={{ fontSize: 72 }}>🌟</span>
      <h2 style={headingStyle}>
        {result.permissionGranted ? 'Great job holding steady!' : 'No worries!'}
      </h2>

      {result.permissionGranted && result.sensorAvailable ? (
        <>
          <div
            style={{
              background: 'rgb(var(--color-surface-card))',
              borderRadius: 16,
              padding: '20px 32px',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'rgb(var(--color-text-secondary))' }}>
              Steadiness reading
            </p>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'rgb(var(--color-primary))',
              }}
            >
              {result.rmsValue.toFixed(2)}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)', color: 'rgb(var(--color-text-secondary))' }}>
              Samples collected: {result.sampleCount}
            </p>
          </div>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              fontStyle: 'italic',
              color: 'rgb(var(--color-text-secondary))',
              textAlign: 'center',
              maxWidth: 340,
            }}
          >
            ⚠️ This is not a medical measurement.
          </p>
        </>
      ) : (
        <p style={bodyStyle}>
          {result.permissionGranted === false
            ? "Sensor access was not granted — that's okay! You can still enjoy other activities."
            : ''}
        </p>
      )}

      <button style={primaryBtn} onClick={onPlayAgain}>
        Play Again
      </button>
      <button style={secondaryBtn} onClick={onDone}>
        Done
      </button>
    </motion.div>
  );
}

function ScreenUnsupported({ onSkip }: { onSkip: () => void }) {
  return (
    <motion.div {...fadeSlide} style={centeredPane}>
      <span style={{ fontSize: 72 }}>💻</span>
      <h2 style={headingStyle}>Best on mobile!</h2>
      <p style={bodyStyle}>
        This activity works best on a mobile phone — it uses your device's motion sensor.
        Would you like to skip it for now?
      </p>
      <button style={primaryBtn} onClick={onSkip}>
        Skip this activity
      </button>
    </motion.div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const centeredPane: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 20,
  padding: '32px 24px',
  maxWidth: 480,
  margin: '0 auto',
  width: '100%',
};

const headingStyle: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  textAlign: 'center',
  margin: 0,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  textAlign: 'center',
  lineHeight: 1.6,
  color: 'rgb(var(--color-text-secondary))',
  maxWidth: 360,
  margin: 0,
};

const primaryBtn: React.CSSProperties = {
  background: 'rgb(var(--color-primary))',
  color: 'rgb(var(--color-text-on-primary, 255 255 255))',
  border: 'none',
  borderRadius: 16,
  padding: '18px 40px',
  fontSize: 'var(--text-lg)',
  fontWeight: 700,
  cursor: 'pointer',
  minWidth: 220,
  minHeight: 64,
};

const secondaryBtn: React.CSSProperties = {
  background: 'transparent',
  color: 'rgb(var(--color-text-secondary))',
  border: '2px solid rgb(var(--color-border))',
  borderRadius: 16,
  padding: '16px 40px',
  fontSize: 'var(--text-lg)',
  cursor: 'pointer',
  minWidth: 220,
  minHeight: 64,
};
