import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, RefreshCw, Bell, Sparkles, Tag, FileText, Check, Plus, AlertCircle } from 'lucide-react';
import { CounterItem, CategoryType, CounterMode, ReminderSetting } from '../types';
import { POPULAR_TEMPLATES } from '../data/templates';
import { CategoryIcon, getCategoryLabel } from './CategoryIcon';

interface CounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (counter: Partial<CounterItem>) => void;
  editingCounter?: CounterItem | null;
}

export const CounterModal: React.FC<CounterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCounter,
}) => {
  const [mode, setMode] = useState<CounterMode>('countdown');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType>('car');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('09:00');
  const [startDate, setStartDate] = useState('');
  const [autoRenewYears, setAutoRenewYears] = useState<number>(0);
  const [autoRenewMonths, setAutoRenewMonths] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#3b82f6');

  // Reminders setup
  const [reminders, setReminders] = useState<{ days: number; enabled: boolean }[]>([
    { days: 30, enabled: true },
    { days: 15, enabled: true },
    { days: 7, enabled: true },
    { days: 1, enabled: true },
  ]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingCounter) {
      setMode(editingCounter.mode);
      setTitle(editingCounter.title);
      setDescription(editingCounter.description || '');
      setCategory(editingCounter.category);

      const d = new Date(editingCounter.targetDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');

      setTargetDate(`${year}-${month}-${day}`);
      setTargetTime(`${hours}:${mins}`);

      if (editingCounter.startDate) {
        const sd = new Date(editingCounter.startDate);
        const sYear = sd.getFullYear();
        const sMonth = String(sd.getMonth() + 1).padStart(2, '0');
        const sDay = String(sd.getDate()).padStart(2, '0');
        setStartDate(`${sYear}-${sMonth}-${sDay}`);
      } else {
        setStartDate('');
      }

      setAutoRenewYears(editingCounter.autoRenewYears || 0);
      setAutoRenewMonths(editingCounter.autoRenewMonths || 0);
      setNotes(editingCounter.notes || '');
      setColor(editingCounter.color || '#3b82f6');

      if (editingCounter.reminders && editingCounter.reminders.length > 0) {
        const existingDays = editingCounter.reminders.map((r) => r.daysBefore);
        setReminders([
          { days: 60, enabled: existingDays.includes(60) },
          { days: 30, enabled: existingDays.includes(30) },
          { days: 15, enabled: existingDays.includes(15) },
          { days: 7, enabled: existingDays.includes(7) },
          { days: 3, enabled: existingDays.includes(3) },
          { days: 1, enabled: existingDays.includes(1) },
          { days: 0, enabled: existingDays.includes(0) },
        ]);
      }
    } else {
      // Reset form with default future date
      const defaultTarget = new Date();
      defaultTarget.setDate(defaultTarget.getDate() + 30);
      const year = defaultTarget.getFullYear();
      const month = String(defaultTarget.getMonth() + 1).padStart(2, '0');
      const day = String(defaultTarget.getDate()).padStart(2, '0');

      setMode('countdown');
      setTitle('');
      setDescription('');
      setCategory('car');
      setTargetDate(`${year}-${month}-${day}`);
      setTargetTime('09:00');
      setStartDate(new Date().toISOString().split('T')[0]);
      setAutoRenewYears(1);
      setAutoRenewMonths(0);
      setNotes('');
      setColor('#3b82f6');

      setReminders([
        { days: 30, enabled: true },
        { days: 15, enabled: true },
        { days: 7, enabled: true },
        { days: 1, enabled: true },
      ]);
    }
  }, [editingCounter, isOpen]);

  if (!isOpen) return null;

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const tmpl = POPULAR_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setCategory(tmpl.category);
    setMode(tmpl.mode);

    const now = new Date();
    if (tmpl.defaultYearsAhead) {
      now.setFullYear(now.getFullYear() + tmpl.defaultYearsAhead);
    } else if (tmpl.defaultMonthsAhead) {
      now.setMonth(now.getMonth() + tmpl.defaultMonthsAhead);
    } else {
      now.setDate(now.getDate() + 30);
    }

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setTargetDate(`${year}-${month}-${day}`);

    if (tmpl.autoRenewYears) setAutoRenewYears(tmpl.autoRenewYears);
    else setAutoRenewYears(0);

    if (tmpl.autoRenewMonths) setAutoRenewMonths(tmpl.autoRenewMonths);
    else setAutoRenewMonths(0);

    if (tmpl.suggestedReminders) {
      setReminders((prev) =>
        prev.map((r) => ({
          ...r,
          enabled: tmpl.suggestedReminders.includes(r.days),
        }))
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const fullIsoDate = `${targetDate}T${targetTime}:00`;

    const activeReminders: ReminderSetting[] = reminders
      .filter((r) => r.enabled)
      .map((r) => ({
        enabled: true,
        daysBefore: r.days,
        notified: false,
      }));

    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      mode,
      targetDate: fullIsoDate,
      startDate: startDate ? `${startDate}T00:00:00` : undefined,
      autoRenewYears: autoRenewYears > 0 ? autoRenewYears : undefined,
      autoRenewMonths: autoRenewMonths > 0 ? autoRenewMonths : undefined,
      reminders: activeReminders,
      notes: notes.trim(),
      color,
    });

    onClose();
  };

  const categoriesList: CategoryType[] = ['car', 'health', 'home', 'finance', 'personal', 'work', 'other'];

  const colorOptions = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span>{editingCounter ? 'Sayacı Düzenle' : 'Yeni Sayaç & Hatırlatıcı Ekle'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Quick Presets Bar (only on new) */}
          {!editingCounter && (
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                ⚡ Hızlı Şablon Seç (Tek Tıkla Doldur):
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {POPULAR_TEMPLATES.map((tmpl) => (
                  <button
                    type="button"
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap transition-all border border-slate-200/60 dark:border-slate-700/60 shrink-0 text-xs"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode Selector: Countdown vs Elapsed */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Sayaç Türü
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('countdown')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'countdown'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Gelecek Tarih (Kalan Süre)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('elapsed')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'elapsed'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5 rotate-180" />
                <span>Geçmiş Tarih (Geçen Süre)</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Başlık <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Arabamın Trafik Sigortası veya Yağ Bakımı"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Target Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {mode === 'countdown' ? 'Son / Hedef Tarih' : 'Yapıldığı / Başlangıç Tarihi'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Hatırlatma Saati
              </label>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Kategori
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categoriesList.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium text-xs transition-all border ${
                    category === cat
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CategoryIcon category={cat} className="w-3.5 h-3.5" />
                  <span>{getCategoryLabel(cat)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Renew Cycle */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
              <span>Otomatik Döngüsel Yenileme</span>
              <span className="text-[10px] text-slate-400 font-normal">Süre dolunca tek tıkla ileriye atanır</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Döngü Yok', y: 0, m: 0 },
                { label: 'Her 1 Yıl', y: 1, m: 0 },
                { label: 'Her 2 Yıl', y: 2, m: 0 },
                { label: 'Her 6 Ay', y: 0, m: 6 },
              ].map((cycle, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setAutoRenewYears(cycle.y);
                    setAutoRenewMonths(cycle.m);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                    autoRenewYears === cycle.y && autoRenewMonths === cycle.m
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cycle.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Reminders Checklist */}
          {mode === 'countdown' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Bildirim Uyarı Zamanları
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {reminders.map((r, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => {
                      setReminders((prev) =>
                        prev.map((item, idx) => (idx === i ? { ...item, enabled: !item.enabled } : item))
                      );
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      r.enabled
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <Check className={`w-3 h-3 ${r.enabled ? 'opacity-100' : 'opacity-0'}`} />
                    <span>{r.days === 0 ? 'Son Gün' : `${r.days} Gün Önce`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color accent selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Vurgu Rengi
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-slate-900 dark:border-white shadow-xs' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Custom Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Özel Notlar veya Acente / Randevu Bilgileri
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: Sigorta Acentesi Tel: 05xx..., Muayene Randevu No: 123456..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              {editingCounter ? 'Kaydet' : 'Sayacı Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
