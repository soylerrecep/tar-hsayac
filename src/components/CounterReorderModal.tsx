import React, { useState, useEffect } from 'react';
import {
  X,
  ListOrdered,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Sparkles,
  Calendar,
  Clock,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CounterItem } from '../types';
import { CategoryIcon, getCategoryLabel } from './CategoryIcon';
import { calculateTimeDifference, formatTurkishDate } from '../utils/dateUtils';

interface CounterReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  counters: CounterItem[];
  onSaveOrder: (reordered: CounterItem[]) => void;
}

export const CounterReorderModal: React.FC<CounterReorderModalProps> = ({
  isOpen,
  onClose,
  counters,
  onSaveOrder,
}) => {
  const [items, setItems] = useState<CounterItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItems([...counters]);
      setHasChanges(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  }, [isOpen, counters]);

  if (!isOpen) return null;

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setItems(updated);
    setHasChanges(true);
  };

  const moveToTop = (index: number) => {
    moveItem(index, 0);
  };

  const moveToBottom = (index: number) => {
    moveItem(index, items.length - 1);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or ghost image
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {
      // fallback
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    moveItem(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Preset quick sorts
  const applyPresetUrgency = () => {
    const sorted = [...items].sort((a, b) => {
      const diffA = calculateTimeDifference(a.targetDate);
      const diffB = calculateTimeDifference(b.targetDate);
      if (a.mode === 'countdown' && b.mode === 'countdown') {
        return diffA.totalDays - diffB.totalDays;
      }
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });
    setItems(sorted);
    setHasChanges(true);
  };

  const applyPresetDate = () => {
    const sorted = [...items].sort(
      (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    );
    setItems(sorted);
    setHasChanges(true);
  };

  const applyPresetTitle = () => {
    const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title, 'tr-TR'));
    setItems(sorted);
    setHasChanges(true);
  };

  const applyReverse = () => {
    setItems([...items].reverse());
    setHasChanges(true);
  };

  const handleSave = () => {
    const reorderedWithIndices = items.map((item, index) => ({
      ...item,
      order: index,
      updatedAt: new Date().toISOString(),
    }));
    onSaveOrder(reorderedWithIndices);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Sayaçları El İle Sırala
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Sürükleyin veya ok butonlarıyla dilediğiniz sıraya dizin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100/60 dark:border-indigo-900/40 flex items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>1. sıradaki sayaç</strong> ana sayfada <em>"Öne Çıkan"</em> büyük kart olarak görünür.
            </span>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
            {items.length} Sayaç
          </span>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 shrink-0">
            Hızlı Diz:
          </span>
          <button
            onClick={applyPresetUrgency}
            className="px-2.5 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-2xs"
          >
            🚨 Aciliyete Göre
          </button>
          <button
            onClick={applyPresetDate}
            className="px-2.5 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-2xs"
          >
            📅 Tarihe Göre
          </button>
          <button
            onClick={applyPresetTitle}
            className="px-2.5 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-2xs"
          >
            🔤 A-Z Alfabetik
          </button>
          <button
            onClick={applyReverse}
            className="px-2.5 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-2xs flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Ters Çevir</span>
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 min-h-[240px]">
          {items.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === items.length - 1;
            const isDragging = draggedIndex === index;
            const isOver = dragOverIndex === index;
            const diff = calculateTimeDifference(item.targetDate);

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all select-none ${
                  isDragging
                    ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : isOver
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 scale-[1.01]'
                    : isFirst
                    ? 'bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border-amber-300 dark:border-amber-600/50 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Drag Handle & Order Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                    title="Sürüklemek için tutun"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isFirst
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-300 dark:ring-amber-500/40'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Counter Content Preview */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    {isFirst && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Öne Çıkan</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <CategoryIcon category={item.category} className="w-3 h-3" />
                      <span>{getCategoryLabel(item.category)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatTurkishDate(item.targetDate)}</span>
                    </span>
                    <span>•</span>
                    <span
                      className={`font-bold ${
                        item.mode === 'countdown' && diff.isPast
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {item.mode === 'countdown'
                        ? diff.isPast
                          ? `${diff.days}g geçti`
                          : `${diff.days}g kaldı`
                        : `${diff.days}g geçti`}
                    </span>
                  </div>
                </div>

                {/* Tactical Move Control Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Jump to top */}
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => moveToTop(index)}
                    title="En başa al (Öne çıkar)"
                    className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold transition-all ${
                      isFirst
                        ? 'opacity-30 cursor-not-allowed border-transparent text-slate-300'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 active:scale-95'
                    }`}
                  >
                    <ChevronsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  {/* Move up */}
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => moveItem(index, index - 1)}
                    title="Bir yukarı taşı"
                    className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold transition-all ${
                      isFirst
                        ? 'opacity-30 cursor-not-allowed border-transparent text-slate-300'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 active:scale-95'
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  {/* Move down */}
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => moveItem(index, index + 1)}
                    title="Bir aşağı taşı"
                    className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold transition-all ${
                      isLast
                        ? 'opacity-30 cursor-not-allowed border-transparent text-slate-300'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 active:scale-95'
                    }`}
                  >
                    <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  {/* Jump to bottom */}
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => moveToBottom(index)}
                    title="En sona al"
                    className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold transition-all ${
                      isLast
                        ? 'opacity-30 cursor-not-allowed border-transparent text-slate-300'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 active:scale-95'
                    }`}
                  >
                    <ChevronsDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Sıralamayı Kaydet ve Uygula</span>
          </button>
        </div>
      </div>
    </div>
  );
};
