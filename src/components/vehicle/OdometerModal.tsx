import React, { useState, useEffect } from 'react';
import { X, Gauge, Calendar, FileText } from 'lucide-react';

interface OdometerModalProps {
  isOpen: boolean;
  vehicleTitle: string;
  currentOdometer: number;
  onClose: () => void;
  onSave: (newOdometer: number, date: string, notes: string) => void;
}

export const OdometerModal: React.FC<OdometerModalProps> = ({
  isOpen,
  vehicleTitle,
  currentOdometer,
  onClose,
  onSave,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [odometer, setOdometer] = useState<string>(currentOdometer ? String(currentOdometer) : '');
  const [date, setDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setOdometer(currentOdometer ? String(currentOdometer) : '');
      setDate(today);
      setNotes('');
    }
  }, [isOpen, currentOdometer]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(odometer);
    if (isNaN(val) || val <= 0) return;
    onSave(val, date, notes.trim());
    onClose();
  };

  return (
    <div
      id="odometer-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="odometer-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scale-up"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Kilometre Güncelle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[180px]">
                {vehicleTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Güncel Kilometre (KM) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Gauge className="w-4 h-4" />
              </div>
              <input
                type="number"
                required
                min={1}
                placeholder="85000"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-base font-black tracking-wide focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tarih
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Not (Opsiyonel)</span>
            </label>
            <input
              type="text"
              placeholder="Örn: Hafta sonu uzun yol dönüşü"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-full text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              KM Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
