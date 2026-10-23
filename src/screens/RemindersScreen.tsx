import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Check, Trash2, Bell, Calendar, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ReminderType = 'medicine' | 'appointment';

interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  time: string; // HH:MM
  notes: string;
  active: boolean;
  done_today: boolean;
  last_reset: string; // YYYY-MM-DD
}

type TabKey = 'medicine' | 'appointment';

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cogniva_reminders';

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: uid(),
    type: 'medicine',
    title: 'Morning Medicine',
    time: '08:00',
    notes: '',
    active: true,
    done_today: false,
    last_reset: getTodayStr(),
  },
  {
    id: uid(),
    type: 'medicine',
    title: 'Evening Medicine',
    time: '20:00',
    notes: '',
    active: true,
    done_today: false,
    last_reset: getTodayStr(),
  },
  {
    id: uid(),
    type: 'appointment',
    title: 'Doctor Check-up',
    time: '10:00',
    notes: 'Govt Hospital, Guwahati',
    active: true,
    done_today: false,
    last_reset: getTodayStr(),
  },
];

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Reminder[];
      const today = getTodayStr();
      // Reset done_today if last_reset < today
      return parsed.map((r) =>
        r.last_reset < today ? { ...r, done_today: false, last_reset: today } : r
      );
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_REMINDERS;
}

function saveReminders(reminders: Reminder[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RemindersScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('medicine');
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentHHMM);

  // Pending delete: id -> tap count
  const deletePending = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // New reminder form state
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('08:00');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getCurrentHHMM()), 15_000);
    return () => clearInterval(interval);
  }, []);

  const visibleReminders = reminders
    .filter((r) => r.type === activeTab)
    .sort((a, b) => a.time.localeCompare(b.time));

  const toggleActive = useCallback((id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  }, []);

  const markDone = useCallback((id: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, done_today: true, last_reset: getTodayStr() } : r
      )
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (pendingDeleteId === id) {
      // Second tap — actually delete
      setPendingDeleteId(null);
      const timer = deletePending.current.get(id);
      if (timer) clearTimeout(timer);
      deletePending.current.delete(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } else {
      // First tap — set pending
      if (pendingDeleteId) {
        const old = deletePending.current.get(pendingDeleteId);
        if (old) clearTimeout(old);
      }
      setPendingDeleteId(id);
      const timer = setTimeout(() => {
        setPendingDeleteId(null);
        deletePending.current.delete(id);
      }, 3000);
      deletePending.current.set(id, timer);
    }
  }, [pendingDeleteId]);

  const handleSave = useCallback(() => {
    const trimmedTitle = formTitle.trim();
    if (!trimmedTitle) return;
    const newReminder: Reminder = {
      id: uid(),
      type: activeTab,
      title: trimmedTitle,
      time: formTime,
      notes: formNotes.trim(),
      active: true,
      done_today: false,
      last_reset: getTodayStr(),
    };
    setReminders((prev) => [...prev, newReminder]);
    setFormTitle('');
    setFormTime('08:00');
    setFormNotes('');
    setShowAddForm(false);
  }, [formTitle, formTime, formNotes, activeTab]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'rgb(var(--color-surface-bg))',
        color: 'rgb(var(--color-text-primary))',
        paddingBottom: '5rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1.25rem 1rem 0.875rem',
          backgroundColor: 'rgb(var(--color-surface-card))',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          style={backBtnStyle}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700, flex: 1 }}>
          Reminders
        </h1>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgb(var(--color-surface-card))',
          borderBottom: '1px solid rgba(var(--color-text-primary), 0.07)',
        }}
      >
        {(['medicine', 'appointment'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setShowAddForm(false);
            }}
            style={{
              flex: 1,
              padding: '0.625rem 0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              fontWeight: activeTab === tab ? 700 : 400,
              borderBottom: activeTab === tab
                ? '3px solid rgb(var(--color-primary))'
                : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab
                ? 'rgb(var(--color-primary))'
                : 'rgb(var(--color-text-secondary))',
              transition: 'all 0.15s ease',
            }}
          >
            {tab === 'medicine' ? '💊 Medicines' : '📅 Appointments'}
          </button>
        ))}
      </div>

      {/* Reminder list */}
      <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <AnimatePresence initial={false}>
          {visibleReminders.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                color: 'rgb(var(--color-text-secondary))',
                fontSize: 'var(--text-base)',
                marginTop: '2rem',
              }}
            >
              No {activeTab === 'medicine' ? 'medicines' : 'appointments'} yet. Tap + to add one!
            </motion.p>
          )}
          {visibleReminders.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              isDueNow={r.active && !r.done_today && r.time === currentTime}
              isPendingDelete={pendingDeleteId === r.id}
              onToggleActive={() => toggleActive(r.id)}
              onMarkDone={() => markDone(r.id)}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Inline Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2 }}
            style={{
              margin: '0 1rem',
              padding: '1rem',
              backgroundColor: 'rgb(var(--color-surface-card))',
              borderRadius: 16,
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Add {activeTab === 'medicine' ? 'Medicine 💊' : 'Appointment 📅'}
              </span>
              <button
                onClick={() => setShowAddForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--color-text-secondary))' }}
              >
                <X size={20} />
              </button>
            </div>

            <label style={labelStyle}>Title *</label>
            <input
              autoFocus
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Blood pressure pill"
              style={inputStyle}
            />

            <label style={labelStyle}>Time</label>
            <input
              type="time"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g., Take with food"
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />

            <button
              onClick={handleSave}
              disabled={!formTitle.trim()}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: formTitle.trim() ? 'rgb(var(--color-primary))' : 'rgba(var(--color-text-secondary), 0.3)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                cursor: formTitle.trim() ? 'pointer' : 'not-allowed',
                marginTop: '0.25rem',
              }}
            >
              Save Reminder
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          aria-label="Add reminder"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'rgb(var(--color-primary))',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 100,
          }}
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
}

// ─── ReminderCard ─────────────────────────────────────────────────────────────

interface ReminderCardProps {
  reminder: Reminder;
  isDueNow: boolean;
  isPendingDelete: boolean;
  onToggleActive: () => void;
  onMarkDone: () => void;
  onDelete: () => void;
}

function ReminderCard({
  reminder,
  isDueNow,
  isPendingDelete,
  onToggleActive,
  onMarkDone,
  onDelete,
}: ReminderCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.18 }}
      style={{
        backgroundColor: 'rgb(var(--color-surface-card))',
        borderRadius: 16,
        padding: '0.875rem 1rem',
        boxShadow: isDueNow ? '0 0 0 2px rgb(var(--color-primary))' : '0 1px 6px rgba(0,0,0,0.06)',
        opacity: reminder.active ? 1 : 0.55,
        position: 'relative',
      }}
    >
      {isDueNow && (
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            backgroundColor: 'rgb(var(--color-primary))',
            color: '#fff',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            borderRadius: 8,
            padding: '2px 8px',
          }}
        >
          Due now!
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(var(--color-primary), 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'rgb(var(--color-primary))',
          }}
        >
          {reminder.type === 'medicine' ? <Bell size={20} /> : <Calendar size={20} />}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                textDecoration: reminder.done_today ? 'line-through' : 'none',
                color: reminder.done_today
                  ? 'rgb(var(--color-text-secondary))'
                  : 'rgb(var(--color-text-primary))',
              }}
            >
              {reminder.title}
            </span>
            {reminder.done_today && (
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: '#22c55e',
                  fontWeight: 600,
                }}
              >
                ✓ Done
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'rgb(var(--color-text-secondary))',
            }}
          >
            ⏰ {reminder.time}
          </span>
          {reminder.notes ? (
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: 'var(--text-sm)',
                color: 'rgb(var(--color-text-secondary))',
              }}
            >
              {reminder.notes}
            </p>
          ) : null}
        </div>
      </div>

      {/* Actions row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.75rem',
          paddingTop: '0.625rem',
          borderTop: '1px solid rgba(var(--color-text-primary), 0.06)',
          gap: '0.5rem',
        }}
      >
        {/* Active toggle */}
        <button
          onClick={onToggleActive}
          aria-label={reminder.active ? 'Disable reminder' : 'Enable reminder'}
          style={{
            padding: '0.4rem 0.875rem',
            borderRadius: 10,
            border: '1.5px solid rgba(var(--color-text-secondary), 0.3)',
            backgroundColor: reminder.active ? 'rgba(var(--color-primary), 0.1)' : 'transparent',
            color: reminder.active ? 'rgb(var(--color-primary))' : 'rgb(var(--color-text-secondary))',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          {reminder.active ? 'Active' : 'Off'}
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Mark done */}
          {!reminder.done_today && reminder.active && (
            <button
              onClick={onMarkDone}
              aria-label="Mark as done today"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: 'none',
                backgroundColor: '#22c55e',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={22} strokeWidth={3} />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={onDelete}
            aria-label={isPendingDelete ? 'Tap again to confirm delete' : 'Delete reminder'}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: isPendingDelete ? '2px solid #ef4444' : 'none',
              backgroundColor: isPendingDelete ? '#fee2e2' : 'rgba(var(--color-text-secondary), 0.1)',
              color: isPendingDelete ? '#ef4444' : 'rgb(var(--color-text-secondary))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {isPendingDelete && (
        <p
          style={{
            margin: '0.375rem 0 0',
            fontSize: 'var(--text-sm)',
            color: '#ef4444',
            textAlign: 'right',
          }}
        >
          Tap again to delete
        </p>
      )}
    </motion.div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const backBtnStyle: React.CSSProperties = {
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
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'rgb(var(--color-text-secondary))',
  marginBottom: '0.3rem',
  marginTop: '0.625rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  borderRadius: 10,
  border: '1.5px solid rgba(var(--color-text-secondary), 0.25)',
  fontSize: 'var(--text-base)',
  backgroundColor: 'rgb(var(--color-surface-bg))',
  color: 'rgb(var(--color-text-primary))',
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: '0.125rem',
};
