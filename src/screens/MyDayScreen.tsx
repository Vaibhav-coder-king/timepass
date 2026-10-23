import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Check, X } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type SlotKey = 'morning' | 'afternoon' | 'evening';

interface ActivitiesStore {
  morning: string[];
  afternoon: string[];
  evening: string[];
}

interface DailyCompletion {
  morning: boolean[];
  afternoon: boolean[];
  evening: boolean[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_ACTIVITIES: ActivitiesStore = {
  morning: ['Take morning medicine 💊', 'Morning walk 🚶', 'Breakfast 🍳'],
  afternoon: ['Lunch 🍽️', 'Rest time 😴', 'Afternoon medicine 💊'],
  evening: ['Evening tea ☕', 'Family time 👨‍👩‍👧', 'Dinner 🍲'],
};

const SLOT_LABELS: Record<SlotKey, string> = {
  morning: 'Morning 🌄',
  afternoon: 'Afternoon ☀️',
  evening: 'Evening 🌙',
};

const SLOT_KEYS: SlotKey[] = ['morning', 'afternoon', 'evening'];

const ACTIVITIES_KEY = 'cogniva_myday_activities';

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `cogniva_myday_${yyyy}-${mm}-${dd}`;
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function loadActivities(): ActivitiesStore {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    if (raw) return JSON.parse(raw) as ActivitiesStore;
  } catch {
    /* ignore */
  }
  return DEFAULT_ACTIVITIES;
}

function saveActivities(activities: ActivitiesStore): void {
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

function loadCompletion(activities: ActivitiesStore): DailyCompletion {
  const key = getTodayKey();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyCompletion;
      // Ensure arrays match current activity count (activities may have grown)
      SLOT_KEYS.forEach((slot) => {
        while (parsed[slot].length < activities[slot].length) {
          parsed[slot].push(false);
        }
      });
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return {
    morning: activities.morning.map(() => false),
    afternoon: activities.afternoon.map(() => false),
    evening: activities.evening.map(() => false),
  };
}

function saveCompletion(completion: DailyCompletion): void {
  localStorage.setItem(getTodayKey(), JSON.stringify(completion));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MyDayScreen() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState<ActivitiesStore>(loadActivities);
  const [completion, setCompletion] = useState<DailyCompletion>(() =>
    loadCompletion(loadActivities())
  );
  const [addingSlot, setAddingSlot] = useState<SlotKey | null>(null);
  const [newActivity, setNewActivity] = useState('');

  // Persist whenever state changes
  useEffect(() => {
    saveActivities(activities);
  }, [activities]);

  useEffect(() => {
    saveCompletion(completion);
  }, [completion]);

  const totalDone = SLOT_KEYS.reduce(
    (acc, slot) => acc + completion[slot].filter(Boolean).length,
    0
  );
  const totalAll = SLOT_KEYS.reduce(
    (acc, slot) => acc + activities[slot].length,
    0
  );

  const toggleCheck = useCallback(
    (slot: SlotKey, index: number) => {
      setCompletion((prev) => {
        const updated = { ...prev, [slot]: [...prev[slot]] };
        updated[slot][index] = !updated[slot][index];
        return updated;
      });
    },
    []
  );

  const handleAddActivity = useCallback(
    (slot: SlotKey) => {
      const trimmed = newActivity.trim();
      if (!trimmed) return;
      setActivities((prev) => ({
        ...prev,
        [slot]: [...prev[slot], trimmed],
      }));
      setCompletion((prev) => ({
        ...prev,
        [slot]: [...prev[slot], false],
      }));
      setNewActivity('');
      setAddingSlot(null);
    },
    [newActivity]
  );

  const progressPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'rgb(var(--color-surface-bg))',
        color: 'rgb(var(--color-text-primary))',
        paddingBottom: '2rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1.25rem 1rem 0.75rem',
          backgroundColor: 'rgb(var(--color-surface-card))',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgb(var(--color-primary))',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700 }}>
            My Day 🌅
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'rgb(var(--color-text-secondary))',
            }}
          >
            {getTodayLabel()}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '1rem 1rem 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.4rem',
          }}
        >
          <span style={{ fontSize: 'var(--text-sm)', color: 'rgb(var(--color-text-secondary))' }}>
            Progress
          </span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            {totalDone} of {totalAll} done today
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 10,
            borderRadius: 5,
            backgroundColor: 'rgba(var(--color-primary), 0.15)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            style={{
              height: '100%',
              borderRadius: 5,
              backgroundColor: 'rgb(var(--color-primary))',
            }}
          />
        </div>
      </div>

      {/* Slots */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {SLOT_KEYS.map((slot) => (
          <SlotSection
            key={slot}
            slotKey={slot}
            label={SLOT_LABELS[slot]}
            activities={activities[slot]}
            checked={completion[slot]}
            onToggle={(i) => toggleCheck(slot, i)}
            isAdding={addingSlot === slot}
            newActivity={newActivity}
            onNewActivityChange={setNewActivity}
            onStartAdd={() => {
              setAddingSlot(slot);
              setNewActivity('');
            }}
            onCancelAdd={() => {
              setAddingSlot(null);
              setNewActivity('');
            }}
            onConfirmAdd={() => handleAddActivity(slot)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── SlotSection ─────────────────────────────────────────────────────────────

interface SlotSectionProps {
  slotKey: SlotKey;
  label: string;
  activities: string[];
  checked: boolean[];
  onToggle: (index: number) => void;
  isAdding: boolean;
  newActivity: string;
  onNewActivityChange: (val: string) => void;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onConfirmAdd: () => void;
}

function SlotSection({
  label,
  activities,
  checked,
  onToggle,
  isAdding,
  newActivity,
  onNewActivityChange,
  onStartAdd,
  onCancelAdd,
  onConfirmAdd,
}: SlotSectionProps) {
  return (
    <div
      style={{
        backgroundColor: 'rgb(var(--color-surface-card))',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}
    >
      {/* Slot header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          borderBottom: '1px solid rgba(var(--color-text-primary), 0.07)',
        }}
      >
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{label}</span>
        <button
          onClick={onStartAdd}
          aria-label={`Add activity to ${label}`}
          style={{
            background: 'rgb(var(--color-primary))',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Activity rows */}
      <div>
        <AnimatePresence initial={false}>
          {activities.map((act, i) => (
            <motion.div
              key={act + i}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <button
                onClick={() => onToggle(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  width: '100%',
                  minHeight: 56,
                  padding: '0.75rem 1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: i < activities.length - 1 ? '1px solid rgba(var(--color-text-primary), 0.05)' : 'none',
                  textAlign: 'left',
                }}
              >
                {/* Checkbox */}
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: checked[i]
                      ? '2px solid rgb(var(--color-primary))'
                      : '2px solid rgba(var(--color-text-secondary), 0.4)',
                    backgroundColor: checked[i] ? 'rgb(var(--color-primary))' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {checked[i] && <Check size={16} color="#fff" strokeWidth={3} />}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-base)',
                    color: checked[i]
                      ? 'rgb(var(--color-text-secondary))'
                      : 'rgb(var(--color-text-primary))',
                    textDecoration: checked[i] ? 'line-through' : 'none',
                    transition: 'all 0.15s ease',
                    flex: 1,
                  }}
                >
                  {act}
                </span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add-activity inline form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderTop: '1px solid rgba(var(--color-text-primary), 0.07)',
                backgroundColor: 'rgba(var(--color-primary), 0.04)',
              }}
            >
              <input
                autoFocus
                value={newActivity}
                onChange={(e) => onNewActivityChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirmAdd();
                  if (e.key === 'Escape') onCancelAdd();
                }}
                placeholder="Type activity..."
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: 10,
                  border: '1.5px solid rgba(var(--color-primary), 0.4)',
                  fontSize: 'var(--text-base)',
                  backgroundColor: 'rgb(var(--color-surface-bg))',
                  color: 'rgb(var(--color-text-primary))',
                  outline: 'none',
                }}
              />
              <button
                onClick={onConfirmAdd}
                aria-label="Save activity"
                style={{
                  background: 'rgb(var(--color-primary))',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '0 0.875rem',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  minHeight: 44,
                }}
              >
                Add
              </button>
              <button
                onClick={onCancelAdd}
                aria-label="Cancel"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgb(var(--color-text-secondary))',
                  borderRadius: 10,
                  padding: '0 0.5rem',
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
