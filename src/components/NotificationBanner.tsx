import React from 'react';
import { AlertCircle, ChevronRight, Clock, ShieldAlert } from 'lucide-react';
import { CounterItem } from '../types';
import { calculateTimeDifference, formatTurkishDate } from '../utils/dateUtils';

interface NotificationBannerProps {
  urgentCounters: CounterItem[];
  onSelectCounter: (counter: CounterItem) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ urgentCounters, onSelectCounter }) => {
  if (urgentCounters.length === 0) return null;

  const topUrgent = urgentCounters[0];
  const diff = calculateTimeDifference(topUrgent.targetDate);

  let message = '';
  if (diff.isPast) {
    message = `"${topUrgent.title}" süresi geçti! (${formatTurkishDate(topUrgent.targetDate)})`;
  } else if (diff.totalDays === 0) {
    message = `🚨 "${topUrgent.title}" İÇİN SON GÜN! (Bugün)`;
  } else {
    message = `⚠️ "${topUrgent.title}" için son ${diff.totalDays} gün kaldı!`;
  }

  return (
    <div
      id="urgent-notification-banner"
      onClick={() => onSelectCounter(topUrgent)}
      className="mb-6 p-4 rounded-[2rem] bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-rose-500/15 border border-amber-500/30 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-amber-500/50 transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 animate-bounce" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
              Süresi Yaklaşan
            </span>
            {urgentCounters.length > 1 && (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                +{urgentCounters.length - 1} diğer uyarı
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-extrabold truncate mt-1">{message}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs font-extrabold text-amber-700 dark:text-amber-300 group-hover:translate-x-0.5 transition-transform shrink-0">
        <span>İncele</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
};
