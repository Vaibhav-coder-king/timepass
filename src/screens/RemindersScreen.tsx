import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  Bell,
  Calendar,
  X,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  BellRing,
} from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  checkScheduledReminders,
  syncRemindersToBackend,
  type NotificationPermissionState,
} from '../services/reminderNotificationService';

// ─── Types ───────────────────────────────────────────────────────────────────

type ReminderType = 'medicine' | 'appointment';

export interface Reminder {
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
    title: 'Morning Medicine (Blood Pressure & Memory)',
    time: '08:00',
    notes: 'Take with warm water after light breakfast',
    active: true,
    done_today: false,
    last_reset: getTodayStr(),
  },
  {
    id: uid(),
    type: 'medicine',
    title: 'Evening Medicine',
    time: '20:00',
    notes: 'Take after dinner',
    active: true,
    done_today: false,
    last_reset: getTodayStr(),
  },
  {
    id: uid(),
    type: 'appointment',
    title: 'Doctor Memory Check-up',
    time: '10:00',
    notes: 'Kamrup District Hospital, Guwahati',
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    syncRemindersToBackend(reminders).catch(() => {});
  } catch {
    /* ignore */
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RemindersScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('medicine');
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentHHMM);
  const [permState, setPermState] = useState<NotificationPermissionState>(getNotificationPermission);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Pending delete: id -> timer
  const deletePending = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // New reminder form state
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('08:00');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  // Periodic reminder scheduler check & clock update (every 10s)
  useEffect(() => {
    const check = () => {
      setCurrentTime(getCurrentHHMM());
      setPermState(getNotificationPermission());
      checkScheduledReminders(reminders, (r) => {
        showToast(`🔔 Reminder: ${r.title} is scheduled now!`);
      });
    };

    check();
    const interval = setInterval(check, 10_000);
    return () => clearInterval(interval);
  }, [reminders]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermState(getNotificationPermission());
    if (granted) {
      showToast('Notification permission enabled! You will receive scheduled alerts.');
    } else {
      showToast('Notifications blocked in browser. Gentle audio chime will play instead.');
    }
  };

  const handleTestAlert = async () => {
    setIsTesting(true);
    try {
      const res = await sendTestNotification();
      setPermState(getNotificationPermission());
      showToast(res.message);
    } finally {
      setIsTesting(false);
    }
  };

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
    showToast('Marked as done for today! 🌟');
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (pendingDeleteId === id) {
      setPendingDeleteId(null);
      const timer = deletePending.current.get(id);
      if (timer) clearTimeout(timer);
      deletePending.current.delete(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      showToast('Reminder deleted.');
    } else {
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
    showToast(`Added ${activeTab === 'medicine' ? 'medicine' : 'appointment'} reminder!`);
  }, [formTitle, formTime, formNotes, activeTab]);

  return (
    <div
      className="min-h-screen w-full flex flex-col pb-32"
      style={{
        backgroundColor: 'rgb(var(--color-surface-bg))',
        color: 'rgb(var(--color-text-primary))',
      }}
    >
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-2xl flex items-center gap-2 max-w-[90vw]"
          >
            <BellRing className="w-5 h-5 flex-shrink-0 animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-5 pb-3 border-b border-[rgba(var(--color-text-primary),0.08)] bg-[rgba(var(--color-surface-bg),0.96)] backdrop-blur-md">
        <button
          onClick={() => navigate('/')}
          aria-label={t('common.backToHome')}
          className="flex items-center justify-center rounded-2xl w-12 h-12 active:opacity-75 transition-all border border-[rgba(var(--color-text-primary),0.12)] bg-[rgb(var(--color-surface-card))]"
          style={{ color: 'rgb(var(--color-text-primary))' }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="font-extrabold text-[rgb(var(--color-text-primary))]" style={{ fontSize: 'var(--text-xl)' }}>
            {t('reminders.title')}
          </h1>
          <p className="text-xs text-[rgb(var(--color-text-secondary))]">
            Current time: <span className="font-bold text-[rgb(var(--color-primary))]">{currentTime}</span>
          </p>
        </div>
        <div className="w-12" aria-hidden="true" />
      </header>

      {/* Container */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 space-y-4">
        {/* ── NOTIFICATION PERMISSION & TEST CONTROL PANEL ── */}
        <section className="p-4 rounded-3xl border border-[rgba(var(--color-text-primary),0.12)] bg-[rgb(var(--color-surface-card))] shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              {permState === 'granted' ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : permState === 'denied' ? (
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-[rgb(var(--color-text-primary))]">
                  {permState === 'granted'
                    ? 'Scheduled Notifications: Active 🔔'
                    : permState === 'denied'
                    ? 'Notifications: Blocked in Browser ⚠️'
                    : 'Scheduled Reminders: Setup Required 🔔'}
                </p>
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                  {permState === 'granted'
                    ? 'Delivers gentle audio chimes and system notifications at due time'
                    : permState === 'denied'
                    ? 'Audio chime plays automatically as dementia-friendly fallback'
                    : 'Enable browser permission to receive alerts at your scheduled times'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0">
              {permState !== 'granted' && permState !== 'unsupported' && (
                <button
                  onClick={handleRequestPermission}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-[rgb(var(--color-primary))] text-white shadow-sm active:scale-95 transition-all"
                >
                  Enable Alerts
                </button>
              )}
              <button
                onClick={handleTestAlert}
                disabled={isTesting}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold border border-[rgba(var(--color-primary),0.3)] text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.06)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-4 h-4" />
                {isTesting ? 'Testing...' : 'Test Sound & Alert'}
              </button>
            </div>
          </div>
        </section>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[rgba(var(--color-text-primary),0.05)] border border-[rgba(var(--color-text-primary),0.08)]">
          {(['medicine', 'appointment'] as TabKey[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setShowAddForm(false);
                }}
                className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isSelected
                    ? 'bg-[rgb(var(--color-surface-card))] text-[rgb(var(--color-primary))] shadow-sm'
                    : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]'
                }`}
              >
                {tab === 'medicine' ? `💊 ${t('reminders.medicine')}` : `📅 ${t('reminders.appointment')}`}
              </button>
            );
          })}
        </div>

        {/* Reminder List */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {visibleReminders.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 px-4 rounded-3xl border border-dashed border-[rgba(var(--color-text-primary),0.15)]"
              >
                <p className="text-3xl mb-2">
                  {activeTab === 'medicine' ? '💊' : '📅'}
                </p>
                <p className="font-bold text-[rgb(var(--color-text-primary))]">
                  No {activeTab === 'medicine' ? 'medicine' : 'appointment'} reminders scheduled
                </p>
                <p className="text-xs text-[rgb(var(--color-text-secondary))] mt-1">
                  Tap the button below to add your first reminder
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 px-5 py-2.5 rounded-2xl bg-[rgb(var(--color-primary))] text-white text-sm font-bold shadow-md active:scale-95 transition-all"
                >
                  + Add Reminder
                </button>
              </motion.div>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-3xl border-2 border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-card))] shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-[rgb(var(--color-text-primary))]" style={{ fontSize: 'var(--text-lg)' }}>
                  Add {activeTab === 'medicine' ? 'Medicine Reminder 💊' : 'Appointment Reminder 📅'}
                </span>
                <button
                  onClick={() => setShowAddForm(false)}
                  aria-label="Close add reminder form"
                  className="p-2 rounded-xl text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-text-primary),0.06)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[rgb(var(--color-text-secondary))]">
                  Reminder Title *
                </label>
                <input
                  autoFocus
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={activeTab === 'medicine' ? 'e.g. Memory & Blood pressure pills' : 'e.g. Memory Clinic Check-up'}
                  className="w-full px-4 py-3 rounded-2xl border border-[rgba(var(--color-text-primary),0.15)] bg-[rgb(var(--color-surface-bg))] text-[rgb(var(--color-text-primary))] text-base outline-none focus:border-[rgb(var(--color-primary))]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[rgb(var(--color-text-secondary))]">
                  Scheduled Time (HH:MM) *
                </label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[rgba(var(--color-text-primary),0.15)] bg-[rgb(var(--color-surface-bg))] text-[rgb(var(--color-text-primary))] text-base outline-none focus:border-[rgb(var(--color-primary))]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[rgb(var(--color-text-secondary))]">
                  Notes & Instructions (Optional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Take with warm water after eating"
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-[rgba(var(--color-text-primary),0.15)] bg-[rgb(var(--color-surface-bg))] text-[rgb(var(--color-text-primary))] text-sm outline-none resize-none focus:border-[rgb(var(--color-primary))]"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3.5 rounded-2xl font-bold border border-[rgba(var(--color-text-primary),0.15)] text-[rgb(var(--color-text-secondary))] active:scale-95 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formTitle.trim()}
                  className="flex-1 py-3.5 rounded-2xl font-bold bg-[rgb(var(--color-primary))] text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button — Positioned safely above bottom navigation */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          aria-label="Add reminder"
          className="fixed right-5 rounded-full w-14 h-14 bg-[rgb(var(--color-primary))] text-white flex items-center justify-center shadow-xl active:scale-90 transition-all z-30 hover:opacity-95"
          style={{
            bottom: 'calc(80px + var(--safe-bottom, 0px) + 16px)',
          }}
        >
          <Plus className="w-7 h-7" />
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
  const { t } = useLanguage();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.18 }}
      className={`relative p-5 rounded-3xl border transition-all ${
        isDueNow
          ? 'border-2 border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.06)] shadow-md animate-pulse'
          : 'border-[rgba(var(--color-text-primary),0.1)] bg-[rgb(var(--color-surface-card))] shadow-sm'
      } ${reminder.active ? 'opacity-100' : 'opacity-60'}`}
    >
      {isDueNow && (
        <span className="absolute top-3 right-4 bg-[rgb(var(--color-primary))] text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Bell className="w-3.5 h-3.5" /> Due Now!
        </span>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[rgba(var(--color-primary),0.12)] flex items-center justify-center flex-shrink-0 text-[rgb(var(--color-primary))]">
          {reminder.type === 'medicine' ? <Bell className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-16 sm:pr-20">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-bold text-base leading-snug ${
                reminder.done_today
                  ? 'line-through text-[rgb(var(--color-text-secondary))]'
                  : 'text-[rgb(var(--color-text-primary))]'
              }`}
            >
              {reminder.title}
            </span>
            {reminder.done_today && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                ✓ {t('common.done')}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[rgb(var(--color-primary))] mt-1 flex items-center gap-1">
            ⏰ {reminder.time}
          </p>
          {reminder.notes ? (
            <p className="text-xs text-[rgb(var(--color-text-secondary))] mt-1 leading-relaxed">
              {reminder.notes}
            </p>
          ) : null}
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(var(--color-text-primary),0.07)] gap-2">
        {/* Active toggle */}
        <button
          onClick={onToggleActive}
          aria-label={reminder.active ? 'Disable reminder' : 'Enable reminder'}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all min-h-[38px] ${
            reminder.active
              ? 'border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]'
              : 'border-[rgba(var(--color-text-primary),0.2)] text-[rgb(var(--color-text-secondary))]'
          }`}
        >
          {reminder.active ? 'Active' : 'Muted'}
        </button>

        <div className="flex items-center gap-2">
          {/* Mark done */}
          {!reminder.done_today && reminder.active && (
            <button
              onClick={onMarkDone}
              aria-label="Mark as done today"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all min-h-[38px]"
            >
              <Check className="w-4 h-4 stroke-[3]" /> {t('common.done')}
            </button>
          )}

          {/* Delete */}
          <button
            onClick={onDelete}
            aria-label={isPendingDelete ? 'Confirm delete reminder' : 'Delete reminder'}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all min-h-[38px] ${
              isPendingDelete
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {isPendingDelete ? 'Confirm?' : t('common.delete')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
