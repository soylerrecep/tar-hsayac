import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Fuel, Gauge, DollarSign, Droplet, Calendar, Building2, Check, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { FuelLog } from '../../types';

interface FuelModalProps {
  isOpen: boolean;
  vehicleId: string;
  currentOdometer: number;
  fuelLogs?: FuelLog[];
  log?: FuelLog | null;
  onClose: () => void;
  onSave: (log: Omit<FuelLog, 'id'>) => void;
}

const COMMON_STATIONS = ['Opet', 'Shell', 'BP', 'Petrol Ofisi', 'TotalEnergies', 'TP', 'Aytemiz', 'Lukoil'];

export const FuelModal: React.FC<FuelModalProps> = ({
  isOpen,
  vehicleId,
  currentOdometer,
  fuelLogs = [],
  log,
  onClose,
  onSave,
}) => {
  const nowString = new Date().toISOString().slice(0, 16);

  const [date, setDate] = useState(log?.date ? new Date(log.date).toISOString().slice(0, 16) : nowString);
  const [odometer, setOdometer] = useState<string>(
    log?.odometer !== undefined && log.odometer !== null
      ? String(log.odometer)
      : (currentOdometer ? String(currentOdometer) : '')
  );
  const [fuelLiters, setFuelLiters] = useState<string>(log?.fuelLiters ? String(log.fuelLiters) : '');
  const [pricePerLiter, setPricePerLiter] = useState<string>(log?.pricePerLiter ? String(log.pricePerLiter) : '');
  const [totalCost, setTotalCost] = useState<string>(log?.totalCost ? String(log.totalCost) : '');
  const [isFullTank, setIsFullTank] = useState<boolean>(log ? log.isFullTank : true);
  const [station, setStation] = useState<string>(log?.station || 'Opet');
  const [notes, setNotes] = useState<string>(log?.notes || '');

  // Helper to parse odometer cleanly removing any thousand dots, commas, or spaces (e.g. "88.500" -> 88500)
  const parseOdometer = (val: string): number => {
    if (!val) return 0;
    const clean = String(val).replace(/[^\d]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  // Track opening transition so we ONLY initialize fields when the modal opens
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const now = new Date().toISOString().slice(0, 16);
      setDate(log?.date ? new Date(log.date).toISOString().slice(0, 16) : now);
      setOdometer(
        log?.odometer !== undefined && log.odometer !== null
          ? String(log.odometer)
          : (currentOdometer ? String(currentOdometer) : '')
      );
      setFuelLiters(log?.fuelLiters ? String(log.fuelLiters) : '');
      setPricePerLiter(log?.pricePerLiter ? String(log.pricePerLiter) : '');
      setTotalCost(log?.totalCost ? String(log.totalCost) : '');
      setIsFullTank(log ? log.isFullTank : true);
      setStation(log?.station || 'Opet');
      setNotes(log?.notes || '');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, log]);

  // Find the previous fuel fill-up to compare odometer distance
  const previousLog = useMemo(() => {
    if (!fuelLogs || fuelLogs.length === 0) return null;
    const others = log ? fuelLogs.filter((f) => f.id !== log.id) : fuelLogs;
    if (others.length === 0) return null;
    return [...others].sort((a, b) => b.odometer - a.odometer)[0];
  }, [fuelLogs, log]);

  const cleanOdo = parseOdometer(odometer);
  const prevOdo = previousLog?.odometer;
  const diffKm =
    prevOdo !== undefined && cleanOdo > prevOdo
      ? cleanOdo - prevOdo
      : null;

  if (!isOpen) return null;

  // Auto-calculate Total Cost or Price Per Liter
  const handleLitersChange = (val: string) => {
    setFuelLiters(val);
    const l = parseFloat(val);
    const p = parseFloat(pricePerLiter);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setTotalCost((l * p).toFixed(2));
    }
  };

  const handlePriceChange = (val: string) => {
    setPricePerLiter(val);
    const p = parseFloat(val);
    const l = parseFloat(fuelLiters);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setTotalCost((l * p).toFixed(2));
    }
  };

  const handleTotalCostChange = (val: string) => {
    setTotalCost(val);
    const t = parseFloat(val);
    const l = parseFloat(fuelLiters);
    if (!isNaN(t) && !isNaN(l) && l > 0 && t > 0) {
      setPricePerLiter((t / l).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(fuelLiters) || 0;
    const t = parseFloat(totalCost) || 0;
    const p = parseFloat(pricePerLiter) || (l > 0 ? t / l : 0);
    const finalOdo = parseOdometer(odometer);

    if (l <= 0 || t <= 0) return;

    onSave({
      vehicleId,
      date: new Date(date).toISOString(),
      odometer: finalOdo,
      fuelLiters: l,
      totalCost: t,
      pricePerLiter: Number(p.toFixed(2)),
      isFullTank,
      station: station.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div
      id="fuel-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="fuel-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {log ? 'Yakıt Kaydını Düzenle' : 'Yeni Yakıt Alımı Ekle'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Alınan yakıtı ve tutarı kaydedin, tüketiminizin takibini yapın
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
          {/* Date & Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tarih & Saat
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Yakıt Anındaki KM <span className="text-rose-500">*</span>
                </label>
                {previousLog && (
                  <button
                    type="button"
                    onClick={() => setOdometer(String(previousLog.odometer))}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Son KM: {previousLog.odometer.toLocaleString('tr-TR')}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder={previousLog ? `örn. ${(previousLog.odometer + 600).toLocaleString('tr-TR')}` : '85000'}
                  value={odometer}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Live parsed odometer helper */}
              {cleanOdo > 0 && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Kaydedilecek KM:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {cleanOdo.toLocaleString('tr-TR')} KM
                  </span>
                </div>
              )}

              {/* Previous Fuel Fill-up Distance Comparison (+ kaç km gidildi) */}
              {previousLog && (
                <div className="mt-2 text-xs">
                  {diffKm !== null && diffKm > 0 ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Önceki yakıt alımına (<strong className="font-mono">{previousLog.odometer.toLocaleString('tr-TR')} KM</strong>) göre:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60">
                          +{diffKm.toLocaleString('tr-TR')} KM
                        </strong>{' '}
                        yol gidildi.
                      </span>
                    </div>
                  ) : cleanOdo > 0 && prevOdo !== undefined && cleanOdo <= prevOdo ? (
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Girdiğiniz KM ({cleanOdo.toLocaleString('tr-TR')} KM), önceki alımdan ({prevOdo.toLocaleString('tr-TR')} KM) küçük veya eşit.
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Önceki yakıt alımı: <strong className="font-mono text-slate-600 dark:text-slate-300">{previousLog.odometer.toLocaleString('tr-TR')} KM</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fuel Amount & Price & Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Miktar (Litre) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Droplet className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="45.0"
                  value={fuelLiters}
                  onChange={(e) => handleLitersChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Litre Fiyatı (₺)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="46.50"
                value={pricePerLiter}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Toplam Tutar (₺) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="2000"
                  value={totalCost}
                  onChange={(e) => handleTotalCostChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-amber-600 dark:text-amber-400 text-xs font-extrabold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Station Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>İstasyon / Akaryakıt Markası</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {COMMON_STATIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStation(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    station === s
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Diğer / Özel istasyon adı"
              value={station}
              onChange={(e) => setStation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Is Full Tank Checkbox */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFullTank}
                onChange={(e) => setIsFullTank(e.target.checked)}
                className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Depoyu Tamamıyla Doldurdum (Full Depo)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  100 KM ortalama yakıt tüketiminizin hatasız hesaplanması için gereklidir.
                </p>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Not</span>
            </label>
            <input
              type="text"
              placeholder="Şehir dışı seyahat, uzun yol sonrası vb."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
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
              className="flex-1 py-3 px-4 rounded-full text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 active:scale-95 transition-all"
            >
              {log ? 'Kaydı Güncelle' : 'Yakıt Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
