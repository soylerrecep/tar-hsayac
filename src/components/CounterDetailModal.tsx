import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, RefreshCw, Bell, Edit2, Trash2, CheckCircle2, AlertTriangle, Sparkles, FileText, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CounterItem } from '../types';
import { calculateTimeDifference, calculateProgressPercentage, formatTurkishDate, calculateNextRenewalDate } from '../utils/dateUtils';
import { CategoryIcon, getCategoryLabel, getCategoryColor } from './CategoryIcon';
import { playNotificationSound, sendWebNotification, triggerHaptic } from '../utils/notifications';

interface CounterDetailModalProps {
  counter: CounterItem | null;
  onClose: () => void;
  onEdit: (counter: CounterItem) => void;
  onDelete: (id: string) => void;
  onUpdateCounter: (updated: CounterItem) => void;
}

export const CounterDetailModal: React.FC<CounterDetailModalProps> = ({
  counter,
  onClose,
  onEdit,
  onDelete,
  onUpdateCounter,
}) => {
  const [diff, setDiff] = useState(() => calculateTimeDifference(counter?.targetDate || ''));
  const [progress, setProgress] = useState(() => calculateProgressPercentage(counter?.startDate, counter?.targetDate || ''));

  useEffect(() => {
    if (!counter) return;
    setDiff(calculateTimeDifference(counter.targetDate));
    setProgress(calculateProgressPercentage(counter.startDate, counter.targetDate));

    const timer = setInterval(() => {
      setDiff(calculateTimeDifference(counter.targetDate));
      if (counter.startDate) {
        setProgress(calculateProgressPercentage(counter.startDate, counter.targetDate));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [counter]);

  if (!counter) return null;

  // Handle Quick Renewal (e.g. +1 Year or Reset Elapsed to Today)
  const handleRenew = () => {
    triggerHaptic([100, 50, 150]);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    playNotificationSound();

    let newTarget = counter.targetDate;
    if (counter.mode === 'elapsed') {
      newTarget = new Date().toISOString();
    } else {
      const years = counter.autoRenewYears || 1;
      const months = counter.autoRenewMonths || 0;
      newTarget = calculateNextRenewalDate(counter.targetDate, years, months);
    }

    const updated: CounterItem = {
      ...counter,
      targetDate: newTarget,
      startDate: new Date().toISOString(),
      completedCycles: (counter.completedCycles || 0) + 1,
      reminders: counter.reminders.map((r) => ({ ...r, notified: false })),
      updatedAt: new Date().toISOString(),
    };

    onUpdateCounter(updated);
  };

  const handleTestReminder = () => {
    sendWebNotification(`Hatırlatıcı Testi: ${counter.title}`, {
      body: counter.mode === 'countdown' ? `Hedef Tarih: ${formatTurkishDate(counter.targetDate)}` : `Başlangıç: ${formatTurkishDate(counter.targetDate)}`,
    });
    playNotificationSound();
  };

  const categoryBadgeClass = getCategoryColor(counter.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${categoryBadgeClass}`}>
              <CategoryIcon category={counter.category} className="w-4 h-4" />
              <span>{getCategoryLabel(counter.category)}</span>
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {counter.mode === 'countdown' ? 'Kalan Süre Takibi' : 'Geçen Süre Takibi'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Main Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {counter.title}
            </h2>
            {counter.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {counter.description}
              </p>
            )}
          </div>

          {/* Main Timer Display Hero */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Hedef Tarih: {formatTurkishDate(counter.targetDate, true)}</span>
              </div>
              {counter.completedCycles ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {counter.completedCycles} kez yenilendi
                </span>
              ) : null}
            </div>

            {counter.mode === 'countdown' ? (
              diff.isPast ? (
                <div className="text-center py-4">
                  <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2 animate-bounce" />
                  <h3 className="text-lg font-bold text-rose-300">Süresi Doldu!</h3>
                  <p className="text-xs text-slate-300 mt-1">Hedef tarihten {diff.days} gün geçti.</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-4 gap-2 text-center my-2">
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                      <span className="block text-2xl sm:text-3xl font-black text-white">{diff.days}</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">GÜN</span>
                    </div>
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                      <span className="block text-2xl sm:text-3xl font-black text-white">
                        {String(diff.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">SAAT</span>
                    </div>
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                      <span className="block text-2xl sm:text-3xl font-black text-white">
                        {String(diff.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">DAKİKA</span>
                    </div>
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                      <span className="block text-2xl sm:text-3xl font-black text-blue-400 animate-pulse">
                        {String(diff.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">SANİYE</span>
                    </div>
                  </div>

                  {counter.startDate && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                        <span>Süreç İlerlemesi</span>
                        <span>%{progress} tamamlandı</span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="py-2">
                <span className="text-xs text-slate-400 block mb-1">Geçen Süre Detayı:</span>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {diff.days} Gün <span className="text-blue-400">{diff.hours} Saat</span>
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  ({diff.totalSeconds.toLocaleString('tr-TR')} saniye geçti)
                </p>
              </div>
            )}
          </div>

          {/* Notes Card if any */}
          {counter.notes && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Özel Notlar</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {counter.notes}
              </p>
            </div>
          )}

          {/* Active Reminders List */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Hatırlatma Kuralları</span>
              </div>
              <button
                onClick={handleTestReminder}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Bildirim Test Et
              </button>
            </div>

            {counter.reminders.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {counter.reminders.map((r, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      r.notified
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <CheckCircle2 className={`w-3 h-3 ${r.notified ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {r.daysBefore === 0 ? 'Tam O Gün' : `${r.daysBefore} Gün Kala`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Bu sayaç için önceden tanımlı bildirim bulunmuyor. Düzenle kısmından ekleyebilirsiniz.
              </p>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          {/* Renew / Complete button */}
          <button
            onClick={handleRenew}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              {counter.mode === 'elapsed'
                ? 'Bugün Yapıldı İşaretle'
                : counter.autoRenewYears
                ? `+${counter.autoRenewYears} Yıl Yenile`
                : counter.autoRenewMonths
                ? `+${counter.autoRenewMonths} Ay Yenile`
                : 'Süreyi Yenile'}
            </span>
          </button>

          {/* Edit */}
          <button
            onClick={() => {
              onClose();
              onEdit(counter);
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            title="Düzenle"
          >
            <Edit2 className="w-4.5 h-4.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              onClose();
              onDelete(counter.id);
            }}
            className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition-all"
            title="Sil"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
