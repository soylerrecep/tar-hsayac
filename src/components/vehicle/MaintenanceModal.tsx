import React, { useState, useEffect } from 'react';
import { X, Wrench, Gauge, DollarSign, Calendar, Building2, BellRing, FileText, Tag, Component } from 'lucide-react';
import { MaintenanceLog, MaintenanceType } from '../../types';

interface MaintenanceModalProps {
  isOpen: boolean;
  vehicleId: string;
  vehicleTitle: string;
  currentOdometer: number;
  log?: MaintenanceLog | null;
  onClose: () => void;
  onSave: (
    logData: Omit<MaintenanceLog, 'id'> & { id?: string },
    createReminderCounter: boolean
  ) => void;
}

const SERVICE_TYPES: Record<MaintenanceType, { label: string; icon: string }> = {
  periyodik: { label: 'Periyodik Bakım', icon: '🔧' },
  yag: { label: 'Yağ & Filtreler', icon: '🛢️' },
  fren: { label: 'Fren & Balata', icon: '🛑' },
  lastik: { label: 'Lastik & Rot Balans', icon: '🛞' },
  aku: { label: 'Akü & Elektrik', icon: '⚡' },
  muayene: { label: 'TÜVTÜRK / Muayene', icon: '📋' },
  ariza: { label: 'Arıza & Tamir', icon: '⚠️' },
  diger: { label: 'Diğer İşlemler', icon: '🛠️' },
};

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  vehicleId,
  vehicleTitle,
  currentOdometer,
  log,
  onClose,
  onSave,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState(log?.title || 'Periyodik Bakım & Filtre Değişimi');
  const [serviceType, setServiceType] = useState<MaintenanceType>(log?.serviceType || 'periyodik');
  const [date, setDate] = useState(log?.date ? new Date(log.date).toISOString().slice(0, 10) : todayStr);
  const [odometer, setOdometer] = useState<string>(
    log?.odometer !== undefined && log.odometer !== null
      ? String(log.odometer)
      : (currentOdometer ? String(currentOdometer) : '')
  );
  const [cost, setCost] = useState<string>(log?.cost ? String(log.cost) : '');
  const [provider, setProvider] = useState<string>(log?.provider || '');

  // Reminder fields
  const [enableReminder, setEnableReminder] = useState<boolean>(
    log ? Boolean(log.nextServiceKm || log.nextServiceDate) : true
  );
  const [nextKmInterval, setNextKmInterval] = useState<string>(() => {
    if (log?.nextServiceKm && log?.odometer && log.nextServiceKm > log.odometer) {
      return String(log.nextServiceKm - log.odometer);
    }
    return log?.serviceType === 'yag' ? '6000' : '10000';
  });
  const [nextServiceKm, setNextServiceKm] = useState<string>(
    log?.nextServiceKm
      ? String(log.nextServiceKm)
      : String((Number(odometer) || currentOdometer || 0) + (log?.serviceType === 'yag' ? 6000 : 10000))
  );
  const [nextServiceDate, setNextServiceDate] = useState<string>(
    log?.nextServiceDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10)
  );
  const [createReminder, setCreateReminder] = useState<boolean>(log ? false : true);

  // Single unified notes field covering changed parts, description, & service notes
  const initialNotes = log
    ? (log.notes && log.partsReplaced
        ? `${log.partsReplaced}\n${log.notes}`
        : log.notes || log.partsReplaced || '')
    : '';
  const [notes, setNotes] = useState<string>(initialNotes);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setTitle(log?.title || 'Periyodik Bakım & Filtre Değişimi');
      setServiceType(log?.serviceType || 'periyodik');
      setDate(log?.date ? new Date(log.date).toISOString().slice(0, 10) : today);
      const currentOdoStr =
        log?.odometer !== undefined && log.odometer !== null
          ? String(log.odometer)
          : (currentOdometer ? String(currentOdometer) : '');
      setOdometer(currentOdoStr);
      setCost(log?.cost ? String(log.cost) : '');
      setProvider(log?.provider || '');
      setEnableReminder(log ? Boolean(log.nextServiceKm || log.nextServiceDate) : true);

      let initialInterval = '10000';
      if (log?.nextServiceKm && log?.odometer && log.nextServiceKm > log.odometer) {
        initialInterval = String(log.nextServiceKm - log.odometer);
      } else if (log?.serviceType === 'yag') {
        initialInterval = '6000';
      }
      setNextKmInterval(initialInterval);

      setNextServiceKm(
        log?.nextServiceKm
          ? String(log.nextServiceKm)
          : String((Number(currentOdoStr) || currentOdometer || 0) + Number(initialInterval))
      );
      setNextServiceDate(
        log?.nextServiceDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10)
      );
      setCreateReminder(log ? false : true);
      const combinedNotes = log
        ? (log.notes && log.partsReplaced
            ? `${log.partsReplaced}\n${log.notes}`
            : log.notes || log.partsReplaced || '')
        : '';
      setNotes(combinedNotes);
    }
  }, [isOpen, log, currentOdometer]);

  if (!isOpen) return null;

  const handleSelectServiceType = (type: MaintenanceType) => {
    setServiceType(type);
    const defaultTitles: Record<MaintenanceType, string> = {
      periyodik: 'Periyodik Bakım & Filtre Değişimi',
      yag: 'Yağ & Filtre Değişimi',
      fren: 'Fren & Balata Bakımı',
      lastik: 'Lastik Değişimi & Rot Balans',
      aku: 'Akü Değişimi & Elektrik Kontrolü',
      muayene: 'TÜVTÜRK Araç Muayenesi',
      ariza: 'Arıza Onarımı & Tamir',
      diger: 'Genel Bakım & Onarım',
    };
    // If current title is empty or matches one of the defaults, auto-fill standard title
    if (!title || Object.values(defaultTitles).includes(title)) {
      setTitle(defaultTitles[type]);
    }

    // If user selects oil change, suggest 6000 or 10000 KM interval if not already custom
    if (type === 'yag' && !log) {
      setNextKmInterval('6000');
      const baseKm = Number(odometer) || currentOdometer || 0;
      setNextServiceKm(String(baseKm + 6000));
    }
  };

  const handleOdometerChange = (val: string) => {
    setOdometer(val);
    const baseKm = parseFloat(val);
    const interval = parseFloat(nextKmInterval);
    if (!isNaN(baseKm) && !isNaN(interval) && interval > 0) {
      setNextServiceKm(String(baseKm + interval));
    }
  };

  const handleIntervalChange = (val: string) => {
    setNextKmInterval(val);
    const interval = parseFloat(val);
    const baseKm = Number(odometer) || currentOdometer || 0;
    if (!isNaN(interval) && interval > 0) {
      setNextServiceKm(String(baseKm + interval));
    }
  };

  const handleNextServiceKmChange = (val: string) => {
    setNextServiceKm(val);
    const targetKm = parseFloat(val);
    const baseKm = Number(odometer) || currentOdometer || 0;
    if (!isNaN(targetKm) && targetKm > baseKm) {
      setNextKmInterval(String(targetKm - baseKm));
    }
  };

  const handleAddKmTarget = (additionalKm: number) => {
    setNextKmInterval(String(additionalKm));
    const currentBaseKm = Number(odometer) || currentOdometer || 0;
    const targetKm = currentBaseKm + additionalKm;
    setNextServiceKm(String(targetKm));
    setEnableReminder(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        id: log?.id,
        vehicleId,
        date: new Date(date).toISOString(),
        odometer: Number(odometer) || 0,
        title: title.trim(),
        serviceType,
        cost: parseFloat(cost) || 0,
        provider: provider.trim(),
        partsReplaced: undefined,
        nextServiceKm: enableReminder && nextServiceKm ? Number(nextServiceKm) : undefined,
        nextServiceDate: enableReminder && nextServiceDate ? nextServiceDate : undefined,
        notes: notes.trim(),
      },
      enableReminder ? createReminder : false
    );
    onClose();
  };

  return (
    <div
      id="maint-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="maint-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {log ? 'Bakım Kaydını Düzenle' : 'Yeni Bakım & Onarım Ekle'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {vehicleTitle} için yapılan bakım ve servis kaydı
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
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bakım / İşlem Başlığı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: 90.000 KM Bakımı & Buji Değişimi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Service Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>İşlem Kategorisi</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(SERVICE_TYPES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectServiceType(key as MaintenanceType)}
                  className={`p-2 rounded-xl text-xs font-bold border text-left flex items-center gap-2 transition-all ${
                    serviceType === key
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bakım Tarihi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bakım Yapıldığı KM
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="85000"
                  value={odometer}
                  onChange={(e) => handleOdometerChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Cost & Service Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bakım Ücreti (₺)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="3500"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Servis / Usta Bilgisi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Bosch Car Service / Yetkili Servis"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Next Service Target (KM & Date) */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableReminder}
                  onChange={(e) => setEnableReminder(e.target.checked)}
                  className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sonraki Bakım İçin KM / Tarih Hatırlatıcısı Kur</span>
                </span>
              </label>
            </div>

            {enableReminder && (
              <div className="space-y-3 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/40">
                {/* Quick Add KM Preset Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Sonraki Bakım Kaç KM Sonra Yapılsın?
                    </span>
                    {Number(nextKmInterval) > 0 && (
                      <span className="text-[11px] font-black font-mono text-emerald-600 dark:text-emerald-400">
                        +{Number(nextKmInterval).toLocaleString('tr-TR')} KM sonra
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[5000, 6000, 7500, 10000, 15000, 20000].map((kmVal) => (
                      <button
                        key={kmVal}
                        type="button"
                        onClick={() => handleAddKmTarget(kmVal)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          Number(nextKmInterval) === kmVal
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        +{kmVal.toLocaleString('tr-TR')} KM
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Custom Interval Input (e.g. 6000 km) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kaç KM Sonra? (Özel Aralık)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={500}
                        step={500}
                        placeholder="Örn: 6000"
                        value={nextKmInterval}
                        onChange={(e) => handleIntervalChange(e.target.value)}
                        className="w-full px-3 py-2 pr-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                      <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400 pointer-events-none">
                        KM sonra
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Örn: <strong className="text-slate-600 dark:text-slate-300">6000</strong> yazarak bir sonraki bakımı tam 6.000 KM sonraya ayarlayabilirsiniz.
                    </p>
                  </div>

                  {/* Target Odometer KM */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Gelecek Bakım KM Hedefi (Gösterge)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        placeholder="Örn: 91000"
                        value={nextServiceKm}
                        onChange={(e) => handleNextServiceKmChange(e.target.value)}
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 text-xs font-black focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                      <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400 pointer-events-none">
                        KM
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Aracın göstergesindeki hedef kilometre
                    </p>
                  </div>
                </div>

                {/* Target KM Summary Badge */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Planlanan Bakım:
                  </span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {odometer ? `${Number(odometer).toLocaleString('tr-TR')} KM` : '0 KM'} +{' '}
                    {Number(nextKmInterval) ? `${Number(nextKmInterval).toLocaleString('tr-TR')} KM` : '0 KM'} ={' '}
                    {nextServiceKm ? `${Number(nextServiceKm).toLocaleString('tr-TR')} KM` : '-'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gelecek Bakım Tarihi
                  </label>
                  <input
                    type="date"
                    value={nextServiceDate}
                    onChange={(e) => setNextServiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createReminder}
                      onChange={(e) => setCreateReminder(e.target.checked)}
                      className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Ana Sayfa Sayaçlar bölümüne özel bakım hatırlatıcısı ekle
                    </span>
                  </label>

                  {createReminder && (
                    <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/40 border border-emerald-300/60 dark:border-emerald-700/60 flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      <span className="text-base">{SERVICE_TYPES[serviceType]?.icon || '🔧'}</span>
                      <span>
                        Hatırlatıcı Başlığı:{' '}
                        <strong className="underline decoration-emerald-500 underline-offset-2">
                          {SERVICE_TYPES[serviceType]?.label || 'Bakım'} Hatırlatıcı
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Unified Notes & Replaced Parts */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Değişen Parçalar, Açıklama & Servis Notları</span>
            </label>
            <textarea
              rows={3}
              placeholder="Örn: 5W-30 Castrol Motor Yağı, Yağ Filtresi, Hava Filtresi ve Polen Filtresi değişti. Ön fren balataları kontrol edildi, Antifriz tamamlandı."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-full text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              {log ? 'Kaydı Güncelle' : 'Bakımı Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
