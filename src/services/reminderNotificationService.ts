/**
 * COGNIVA — Scheduled Reminder & Notification Service
 *
 * Implements real notifications with:
 * 1. Web Notifications API with permission management & fallback
 * 2. Service Worker push/showNotification integration
 * 3. Dementia-friendly Web Audio chime (calming harmonic bell)
 * 4. Haptic vibration feedback
 * 5. Instant Test Notification capability
 * 6. Local & remote backend synchronization (/api/reminders)
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface ReminderItem {
  id: string;
  type: 'medicine' | 'appointment';
  title: string;
  time: string; // HH:MM
  notes: string;
  active: boolean;
  done_today: boolean;
  last_reset: string; // YYYY-MM-DD
}

// Track fired reminders in current minute: Set of `${reminderId}_${date}_${time}`
const firedReminders = new Set<string>();

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (err) {
    console.warn('Notification permission error:', err);
    return false;
  }
}

/**
 * Synthesize a gentle, calming, dementia-friendly chime using Web Audio API.
 * Warm two-tone major third bell (C5 -> E5 -> G5) designed to be soothing rather than alarming.
 */
export function playGentleChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.8 }, // C5
      { freq: 659.25, time: 0.15, dur: 0.9 }, // E5
      { freq: 783.99, time: 0.3, dur: 1.2 },  // G5
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Smooth attack and natural exponential decay
      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.25, now + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // Cleanup audio context after notes play
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 2000);
  } catch (e) {
    console.warn('Web Audio chime could not play:', e);
  }
}

/**
 * Trigger haptic vibration if supported
 */
export function triggerVibration(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // ignore
  }
}

/**
 * Deliver a system notification
 */
export async function showSystemNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  // Always trigger sound & haptics regardless of OS notification status
  playGentleChime();
  triggerVibration();

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOpts: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'cogniva-reminder',
    ...options,
  };

  try {
    // Try service worker registration first for reliable background delivery
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, defaultOpts);
        return true;
      }
    }
    // Fallback to standard window Notification
    new Notification(title, defaultOpts);
    return true;
  } catch (err) {
    console.warn('Direct notification failed, falling back:', err);
    try {
      new Notification(title, defaultOpts);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Send an immediate test reminder notification
 */
export async function sendTestNotification(): Promise<{ success: boolean; message: string }> {
  const perm = getNotificationPermission();

  if (perm === 'unsupported') {
    playGentleChime();
    triggerVibration();
    return {
      success: true,
      message: 'Web Audio chime tested! (System notifications not supported on this browser)',
    };
  }

  if (perm !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) {
      playGentleChime();
      return {
        success: false,
        message: 'Notification permission is blocked. Chime was played as fallback.',
      };
    }
  }

  const delivered = await showSystemNotification('🔔 COGNIVA Reminder Test', {
    body: 'Test reminder delivered! Audio, vibration, and alert are fully operational.',
    tag: 'test-reminder-' + Date.now(),
  });

  return {
    success: delivered,
    message: delivered
      ? 'Test reminder notification delivered with gentle audio chime!'
      : 'Audio chime played. System notification pending browser permission.',
  };
}

/**
 * Evaluates active reminders against the current local time (HH:MM).
 * If a reminder is active, not done today, and matches current time, fires notification.
 */
export function checkScheduledReminders(
  reminders: ReminderItem[],
  onTriggered?: (reminder: ReminderItem) => void
): ReminderItem[] {
  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const triggered: ReminderItem[] = [];

  reminders.forEach((r) => {
    if (!r.active || r.done_today) return;

    if (r.time === currentHHMM) {
      const fireKey = `${r.id}_${todayStr}_${r.time}`;
      if (!firedReminders.has(fireKey)) {
        firedReminders.add(fireKey);
        triggered.push(r);

        const icon = r.type === 'medicine' ? '💊' : '📅';
        const title = `${icon} COGNIVA: ${r.title}`;
        const body = r.notes
          ? `${r.notes} • Scheduled for ${r.time}`
          : `It is now ${r.time}. Time for your ${r.title.toLowerCase()}!`;

        showSystemNotification(title, {
          body,
          tag: `reminder-${r.id}`,
        });

        if (onTriggered) {
          onTriggered(r);
        }
      }
    }
  });

  return triggered;
}

/**
 * Backend synchronization helper: sync reminders list to Flask backend /api/reminders
 */
export async function syncRemindersToBackend(reminders: ReminderItem[]): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    for (const r of reminders.slice(0, 10)) {
      await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: r.type,
          title: r.title,
          time: r.time,
          notes: r.notes,
          days: 'Daily',
          active: r.active ? 1 : 0,
        }),
        signal: controller.signal,
      }).catch(() => {});
    }

    clearTimeout(timeout);
  } catch {
    // Non-blocking offline fallback
  }
}
