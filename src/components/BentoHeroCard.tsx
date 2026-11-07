import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Calendar,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ArrowDown,
  ListOrdered,
} from 'lucide-react';
import { CounterItem } from '../types';
import { calculateTimeDifference, formatTurkishDate } from '../utils/dateUtils';
import { CategoryIcon, getCategoryLabel } from './CategoryIcon';

interface BentoHeroCardProps {
  counter: CounterItem;
  onSelect: (counter: CounterItem) => void;
  onRenew: (counter: CounterItem, e: React.MouseEvent) => void;
  onMoveDown?: (id: string, e: React.MouseEvent) => void;
  onOpenReorder?: () => void;
  hasMultiple?: boolean;
}

export const BentoHeroCard: React.FC<BentoHeroCardProps> = ({
  counter,
  onSelect,
  onRenew,
  onMoveDown,
  onOpenReorder,
  hasMultiple = false,
}) => {
  const [diff, setDiff] = useState(() => calculateTimeDifference(counter.targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(calculateTimeDifference(counter.targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [counter.targetDate]);

  return (
    <div
      id={`bento-hero-card-${counter.id}`}
      onClick={() => onSelect(counter)}
      className="group relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 rounded-[2.5rem] p-7 sm:p-9 text-white overflow-hidden shadow-2xl border border-indigo-800/50 cursor-pointer transition-all hover:scale-[1.01] mb-6"
    >
      {/* Background Decorative Ambient Circles */}
      <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -top-16 w-60 h-60 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Hero Badge Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1">
            <span>#1</span>
          </span>
          <span className="bg-indigo-800/70 text-indigo-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-700/80 backdrop-blur-md flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Öne Çıkan Takip</span>
          </span>
          <span className="bg-white/10 text-white/90 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md flex items-center gap-1.5">
            <CategoryIcon category={counter.category} className="w-3.5 h-3.5" />
            <span>{getCategoryLabel(counter.category)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-indigo-200 font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-300" />
            <span>{formatTurkishDate(counter.targetDate)}</span>
          </div>
        </div>
      </div>

      {/* Main Content & Ticker Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {counter.title}
          </h2>
          {counter.description && (
            <p className="text-sm text-indigo-200/90 line-clamp-2 max-w-xl">
              {counter.description}
            </p>
          )}

          {/* Action Row */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(counter);
              }}
              className="px-5 py-2.5 rounded-full bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <span>Detayları İncele</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {(counter.autoRenewYears || counter.autoRenewMonths || counter.mode === 'elapsed' || diff.isPast) && (
              <button
                onClick={(e) => onRenew(counter, e)}
                className="px-4 py-2.5 rounded-full bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 font-semibold text-xs border border-indigo-700/60 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yenile / Sıfırla</span>
              </button>
            )}

            {hasMultiple && onMoveDown && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(counter.id, e);
                }}
                title="Bu sayacı bir alt sıraya al"
                className="px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Aşağı Al</span>
              </button>
            )}

            {onOpenReorder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReorder();
                }}
                title="Sayaçların sırasını el ile düzenle"
                className="px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">El ile Sırala</span>
              </button>
            )}
          </div>
        </div>

        {/* Huge Big Number Display */}
        <div className="lg:col-span-5 flex flex-col justify-center items-start lg:items-end">
          {counter.mode === 'countdown' ? (
            diff.isPast ? (
              <div className="p-4 rounded-2xl bg-rose-900/60 border border-rose-700/80 text-rose-200 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block text-rose-300">Süresi Doldu</span>
                  <span className="text-lg font-black">{diff.days} Gün Geçti</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl sm:text-7xl lg:text-8xl font-black tabular-nums tracking-tighter text-white">
                    {diff.days}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-indigo-300 uppercase tracking-wider">
                    GÜN
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-indigo-200 tracking-wide">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-900/90 border border-indigo-700/80">
                    {String(diff.hours).padStart(2, '0')} Saat
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-900/90 border border-indigo-700/80">
                    {String(diff.minutes).padStart(2, '0')} Dak
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-900/90 border border-indigo-700/80 text-amber-300">
                    {String(diff.seconds).padStart(2, '0')} Sn
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 block">
                Geçen Süre
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-7xl lg:text-8xl font-black tabular-nums tracking-tighter text-white">
                  {diff.days}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-indigo-300 uppercase tracking-wider">
                  GÜN
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
