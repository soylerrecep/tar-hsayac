import { CounterItem } from '../types';
import { calculateTimeDifference } from './dateUtils';

/**
 * Checks if browser supports Web Notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Requests Notification permissions from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Notification permission error:', error);
    return 'denied';
  }
}

/**
 * Gets current Notification permission state
 */
export function getNotificationPermissionState(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Triggers a Web Notification
 */
export function sendWebNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    const defaultOptions: NotificationOptions = {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      requireInteraction: false,
      ...options,
    };
    new Notification(title, defaultOptions);
  } catch (err) {
    console.error('Failed to display web notification', err);
  }
}

/**
 * Plays a pleasant audio reminder chime using Web Audio API
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();

    // Two-tone cheerful chime (E5 -> A5)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playNote(659.25, now, 0.25); // E5
    playNote(880.00, now + 0.15, 0.45); // A5
  } catch (err) {
    console.warn('Audio play hindered by browser autoplay policy', err);
  }
}

/**
 * Haptic feedback trigger for mobile Chrome
 */
export function triggerHaptic(pattern: number | number[] = 50): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

/**
 * Evaluates counters and returns items that require notification today or within reminder thresholds
 */
export function checkAndTriggerDueReminders(counters: CounterItem[]): {
  updatedCounters: CounterItem[];
  notifiedTitles: string[];
} {
  let updated = false;
  const notifiedTitles: string[] = [];

  const newCounters = counters.map((item) => {
    if (item.mode === 'elapsed') return item;

    const diff = calculateTimeDifference(item.targetDate);
    const daysRemaining = diff.totalDays;

    let itemUpdated = false;

    const updatedReminders = item.reminders.map((reminder) => {
      if (!reminder.enabled || reminder.notified) return reminder;

      // Check if daysRemaining matches or is lower than daysBefore threshold
      if (daysRemaining <= reminder.daysBefore && !diff.isPast) {
        // Trigger notification!
        const reminderText = reminder.daysBefore === 0 
          ? `Bugün son gün! "${item.title}"` 
          : `"${item.title}" için son ${daysRemaining} gün kaldı!`;
        
        sendWebNotification(`Sayaç Hatırlatıcısı`, {
          body: reminderText,
          tag: `${item.id}-${reminder.daysBefore}`,
        });

        notifiedTitles.push(reminderText);
        itemUpdated = true;
        return { ...reminder, notified: true };
      }
      return reminder;
    });

    if (itemUpdated) {
      updated = true;
      return { ...item, reminders: updatedReminders, updatedAt: new Date().toISOString() };
    }

    return item;
  });

  if (notifiedTitles.length > 0) {
    playNotificationSound();
    triggerHaptic([100, 50, 100, 50, 200]);
  }

  return {
    updatedCounters: updated ? newCounters : counters,
    notifiedTitles,
  };
}
