import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Undo2, CheckCircle2, Info } from 'lucide-react';
import { GameHeader, CompletionScreen } from './GameShared';
import { saveSession } from '../utils/storage';
import { syncPendingSessions } from '../services/syncService';

interface StrokePoint {
  x: number;
  y: number;
  time: number;
}

export function CanvasClockDraw() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<StrokePoint[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [phase, setPhase] = useState<'drawing' | 'complete'>('drawing');
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    redrawAll(ctx, strokes, rect.width, rect.height);
  }, []);

  const redrawAll = (
    ctx: CanvasRenderingContext2D,
    allStrokes: StrokePoint[][],
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Subtle guide circle
    ctx.strokeStyle = 'rgba(124, 92, 252, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    const radius = Math.min(width, height) * 0.42;
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center dot guide
    ctx.fillStyle = 'rgba(124, 92, 252, 0.3)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Redraw user strokes
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    allStrokes.forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
  };

  const getCanvasCoords = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startStroke = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    const newPoint: StrokePoint = { x: coords.x, y: coords.y, time: Date.now() };
    setCurrentStroke([newPoint]);
  };

  const moveStroke = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newPoint: StrokePoint = { x: coords.x, y: coords.y, time: Date.now() };
    const updated = [...currentStroke, newPoint];
    setCurrentStroke(updated);

    // Draw segment in real-time
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (updated.length >= 2) {
      const prev = updated[updated.length - 2];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const endStroke = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    setUndoCount(u => u + 1);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    redrawAll(ctx, updated, rect.width, rect.height);
  };

  const handleClear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    redrawAll(ctx, [], rect.width, rect.height);
  };

  const handleSubmit = () => {
    const elapsed = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    setTimeTaken(elapsed);

    // Compute visuospatial indicators
    const strokeCount = strokes.length;
    const totalPoints = strokes.reduce((acc, s) => acc + s.length, 0);

    saveSession({
      game: 'CLOCK_DRAW',
      time_taken_sec: elapsed,
      error_count: undoCount,
      difficulty: 'MEDIUM',
      level: 2,
      metrics: {
        stroke_count: strokeCount,
        total_points: totalPoints,
        undo_count: undoCount,
        visuospatial_index: Math.min(100, Math.max(40, 100 - undoCount * 8)),
      },
    });

    syncPendingSessions();
    setSyncTrigger(t => t + 1);
    setPhase('complete');
  };

  if (phase === 'complete') {
    return (
      <CompletionScreen
        title="Clock Drawing Saved"
        miraMessage="Splendid effort! Drawing the clock face engages both visual construction and concentration."
        timeLabel={`${timeTaken}s`}
        errorCount={undoCount}
        onPlayAgain={() => {
          setPhase('drawing');
          setStrokes([]);
          setUndoCount(0);
          setStartTime(Date.now());
        }}
        onHome={() => navigate('/games')}
        syncTrigger={syncTrigger}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <GameHeader
        title="Canvas Clock Draw"
        onBack={() => navigate('/games')}
        onReset={handleClear}
        syncTrigger={syncTrigger}
      />

      <div className="flex-1 flex flex-col px-4 py-3 max-w-lg mx-auto w-full space-y-3">
        {/* Instruction Banner */}
        <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-100 dark:bg-violet-950/40 dark:border-violet-900/50">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-violet-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-violet-900 dark:text-violet-200">
              Draw the numbers 1 to 12 on the clock, then draw hands pointing to <strong>11:10</strong>.
            </p>
          </div>
        </div>

        {/* Drawing Canvas Area */}
        <div className="flex-1 flex items-center justify-center relative touch-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startStroke}
            onMouseMove={moveStroke}
            onMouseUp={endStroke}
            onMouseLeave={endStroke}
            onTouchStart={startStroke}
            onTouchMove={moveStroke}
            onTouchEnd={endStroke}
            className="w-full aspect-square max-w-[340px] rounded-3xl border-2 border-stone-200 bg-amber-50/20 shadow-inner cursor-crosshair dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Drawing Controls */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex-1 py-3 px-3 rounded-2xl border border-stone-200 bg-stone-50 font-bold text-xs text-stone-700 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 dark:bg-slate-800 dark:border-slate-700 dark:text-stone-300"
          >
            <Undo2 className="w-4 h-4" />
            <span>Undo</span>
          </button>

          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="flex-1 py-3 px-3 rounded-2xl border border-stone-200 bg-stone-50 font-bold text-xs text-stone-700 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 dark:bg-slate-800 dark:border-slate-700 dark:text-stone-300"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={strokes.length === 0}
            className="flex-[1.5] py-3.5 px-4 rounded-2xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-700 shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Clock</span>
          </button>
        </div>
      </div>
    </div>
  );
}
