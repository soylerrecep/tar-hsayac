import React, { useEffect, useState } from 'react';
import {
  Clock,
  Calendar,
  RefreshCw,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
} from 'lucide-react';
import { CounterItem } from '../types';
import { calculateTimeDifference, calculateProgressPercentage, formatTurkishDate, getUrgencyLevel } from '../utils/dateUtils';
import { CategoryIcon, getCategoryColor, getCategoryLabel } from './CategoryIcon';

interface CounterCardProps {
  counter: CounterItem;
  onSelect: (counter: CounterItem) => void;
  onEdit: (counter: CounterItem, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onRenew: (counter: CounterItem, e: React.MouseEvent) => void;
  onMoveUp?: (id: string, e: React.MouseEvent) => void;
  onMoveDown?: (id: string, e: React.MouseEvent) => void;
  onMoveToTop?: (id: string, e: React.MouseEvent) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  positionNumber?: number;
}

export const CounterCard: React.FC<CounterCardProps> = ({
  counter,
  onSelect,
  onEdit,
  onDelete,
  onRenew,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  canMoveUp = false,
  canMoveDown = false,
  positionNumber,
}) => {
  const [diff, setDiff] = useState(() => calculateTimeDifference(counter.targetDate));
  const [progress, setProgress] = useState(() => calculateProgressPercentage(counter.startDate, counter.targetDate));

  // Update live timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(calculateTimeDifference(counter.targetDate));
      if (counter.startDate) {
        setProgress(calculateProgressPercentage(counter.startDate, counter.targetDate));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [counter.targetDate, counter.startDate]);

  const urgency = getUrgencyLevel(diff.totalDays, diff.isPast);
  const categoryBadgeClass = getCategoryColor(counter.category);

  return (
    <div
      id={`counter-card-${counter.id}`}
      onClick={() => onSelect(counter)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-1 rounded-full transition-all"
        style={{
          backgroundColor:
            counter.mode === 'countdown' && diff.isPast
              ? '#ef4444' // Red if expired
              : counter.mode === 'countdown' && diff.totalDays <= 7
              ? '#f59e0b' // Amber if urgent
              : counter.color || '#4f46e5',
        }}
      />

      <div>
        {/* Header row: Category & Mode Tag + Position & Reorder & Quick Action Buttons */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {positionNumber !== undefined && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                #{positionNumber}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${categoryBadgeClass}`}>
              <CategoryIcon category={counter.category} className="w-3.5 h-3.5" />
              <span>{getCategoryLabel(counter.category)}</span>
            </span>

            {counter.mode === 'elapsed' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Geçen Süre
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                Kalan Süre
              </span>
            )}

            {(counter.autoRenewYears || counter.autoRenewMonths) && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Döngüsel
              </span>
            )}
          </div>

          {/* Quick Menu & Reorder Buttons */}
          <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {onMoveToTop && (
              <button
                type="button"
                onClick={(e) => onMoveToTop(counter.id, e)}
                title="1. Sıraya Al (Öne Çıkar)"
                className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-500 hover:text-amber-600 transition-colors"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
              </button>
            )}
            {onMoveUp && (
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={(e) => onMoveUp(counter.id, e)}
                title="Yukarı / Öne Taşı"
                className={`p-1.5 rounded-lg transition-colors ${
                  canMoveUp
                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300'
                    : 'opacity-30 cursor-not-allowed text-slate-300 dark:text-slate-700'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={(e) => onMoveDown(counter.id, e)}
                title="Aşağı / Arkaya Taşı"
                className={`p-1.5 rounded-lg transition-colors ${
                  canMoveDown
                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300'
                    : 'opacity-30 cursor-not-allowed text-slate-300 dark:text-slate-700'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
            <button
              onClick={(e) => onEdit(counter, e)}
              title="Düzenle"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onDelete(counter.id, e)}
              title="Sil"
              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 dark:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {counter.title}
        </h3>
        {counter.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-medium">
            {counter.description}
          </p>
        )}

        {/* Target Date Label */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatTurkishDate(counter.targetDate)}</span>
        </div>

        {/* Counter Display Bento Box */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          {counter.mode === 'countdown' ? (
            diff.isPast ? (
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Süresi Doldu ({diff.days} gün geçti)</span>
                </div>
                {(counter.autoRenewYears || counter.autoRenewMonths) && (
                  <button
                    onClick={(e) => onRenew(counter, e)}
                    className="px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Yenile
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
                  <span className="block text-xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                    {diff.days}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GÜN</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
                  <span className="block text-xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                    {String(diff.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SAAT</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
                  <span className="block text-xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                    {String(diff.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DAK</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
                  <span className="block text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none tabular-nums">
                    {String(diff.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SN</span>
                </div>
              </div>
            )
          ) : (
            // Elapsed mode
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Geçen Zaman:</span>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-tight tabular-nums">
                  {diff.days} Gün <span className="text-xs font-semibold text-slate-500">{diff.hours}s {diff.minutes}dk</span>
                </p>
              </div>
              <button
                onClick={(e) => onRenew(counter, e)}
                title="Bugüne Sıfırla"
                className="px-3 py-1.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 active:scale-95 transition-all flex items-center gap-1 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bugün Yapıldı</span>
              </button>
            </div>
          )}

          {/* Progress bar */}
          {counter.mode === 'countdown' && counter.startDate && !diff.isPast && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                <span>İlerleme Süreci</span>
                <span>%{progress} Tamamlandı</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer info & Urgency status pill */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {urgency === 'expired' ? (
          <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Yenileme Gerekiyor
          </span>
        ) : urgency === 'critical' ? (
          <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            {diff.days === 0 ? 'Son Gün (Bugün!)' : `${diff.days} Gün Kaldı (Acil)`}
          </span>
        ) : urgency === 'warning' ? (
          <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Süresi Yaklaşıyor
          </span>
        ) : (
          <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {counter.mode === 'countdown' ? 'Zaman Var' : 'Takip Ediliyor'}
          </span>
        )}

        <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          <span>Detay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
