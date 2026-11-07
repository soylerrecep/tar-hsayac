export interface TimeRemaining {
  totalSeconds: number;
  totalDays: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  formattedString: string;
}

/**
 * Calculates time remaining (or elapsed) from/to target date
 */
export function calculateTimeDifference(targetDateStr: string): TimeRemaining {
  const target = new Date(targetDateStr).getTime();
  const now = Date.now();
  const diffMs = target - now;

  const isPast = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const totalSeconds = Math.floor(absDiff / 1000);
  const totalDays = Math.floor(totalSeconds / 86400);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formattedString = '';
  if (days > 0) {
    formattedString = `${days} gün ${hours} saat`;
  } else if (hours > 0) {
    formattedString = `${hours} saat ${minutes} dak`;
  } else if (minutes > 0) {
    formattedString = `${minutes} dak ${seconds} sn`;
  } else {
    formattedString = `${seconds} saniye`;
  }

  return {
    totalSeconds,
    totalDays: isPast ? -totalDays : totalDays,
    days,
    hours,
    minutes,
    seconds,
    isPast,
    formattedString,
  };
}

/**
 * Calculates percentage completion if startDate is present
 */
export function calculateProgressPercentage(startDateStr?: string, targetDateStr?: string): number {
  if (!startDateStr || !targetDateStr) return 0;
  const start = new Date(startDateStr).getTime();
  const target = new Date(targetDateStr).getTime();
  const now = Date.now();

  if (target <= start) return 100;
  if (now <= start) return 0;
  if (now >= target) return 100;

  const total = target - start;
  const current = now - start;
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

/**
 * Formats ISO date to readable Turkish date format
 * e.g., "15 Ağustos 2026, Cumartesi"
 */
export function formatTurkishDate(dateStr: string, includeTime = false): string {
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'short',
    });

    if (includeTime) {
      const timeFormatted = d.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateFormatted} - ${timeFormatted}`;
    }

    return dateFormatted;
  } catch {
    return dateStr;
  }
}

/**
 * Gets urgency level: 'expired' | 'critical' | 'warning' | 'normal'
 */
export function getUrgencyLevel(totalDaysRemaining: number, isPast: boolean): 'expired' | 'critical' | 'warning' | 'normal' {
  if (isPast) return 'expired';
  if (totalDaysRemaining <= 3) return 'critical';
  if (totalDaysRemaining <= 15) return 'warning';
  return 'normal';
}

/**
 * Calculates next renewal date based on autoRenewYears or autoRenewMonths
 */
export function calculateNextRenewalDate(currentDateStr: string, years = 0, months = 0): string {
  const d = new Date(currentDateStr);
  if (years > 0) {
    d.setFullYear(d.getFullYear() + years);
  }
  if (months > 0) {
    d.setMonth(d.getMonth() + months);
  }
  return d.toISOString();
}
