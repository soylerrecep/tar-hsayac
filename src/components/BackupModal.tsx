import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Car,
  Fuel,
  Wrench,
  Gauge,
  Clock,
} from 'lucide-react';
import { CounterItem, Vehicle, FuelLog, MaintenanceLog, OdometerLog } from '../types';
import { exportDataAsJSON, parseAndImportJSON } from '../utils/storage';
import { playNotificationSound, triggerHaptic } from '../utils/notifications';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  counters: CounterItem[];
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  maintLogs: MaintenanceLog[];
  odometerLogs: OdometerLog[];
  onImportAll: (data: {
    counters: CounterItem[];
    vehicles: Vehicle[];
    fuelLogs: FuelLog[];
    maintenanceLogs: MaintenanceLog[];
    odometerLogs: OdometerLog[];
  }) => void;
  onResetToDefaultSamples: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  counters,
  vehicles,
  fuelLogs,
  maintLogs,
  odometerLogs,
  onImportAll,
  onResetToDefaultSamples,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    triggerHaptic(50);
    exportDataAsJSON(counters, vehicles, fuelLogs, maintLogs, odometerLogs);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = parseAndImportJSON(content);
      if (result.success) {
        onImportAll({
          counters: result.items || [],
          vehicles: result.vehicles || [],
          fuelLogs: result.fuelLogs || [],
          maintenanceLogs: result.maintenanceLogs || [],
          odometerLogs: result.odometerLogs || [],
        });

        const detailParts: string[] = [];
        if (result.count > 0) detailParts.push(`${result.count} sayaç`);
        if (result.vehicleCount > 0) detailParts.push(`${result.vehicleCount} araç`);
        if (result.fuelCount > 0) detailParts.push(`${result.fuelCount} yakıt kaydı`);
        if (result.maintCount > 0) detailParts.push(`${result.maintCount} bakım kaydı`);
        if (result.odometerCount > 0) detailParts.push(`${result.odometerCount} KM kaydı`);

        const summaryText = detailParts.length > 0 ? detailParts.join(', ') : 'Tüm veriler';

        setImportStatus({
          message: `Yedek başarıyla yüklendi! (${summaryText})`,
          type: 'success',
        });
        playNotificationSound();
        triggerHaptic([100, 50, 100]);
      } else {
        setImportStatus({
          message: result.error || 'İçe aktarma başarısız.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Tam Veri Yedekleme & Geri Yükleme</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Sayaçlar ve Aracım modülünün eksiksiz yedeği</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Reassurance Status Badge */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">Çift Katmanlı Güvenli Kayıt Aktif</p>
              <p className="text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
                Tüm sayaçlarınız, araç profilleriniz, yakıt harcamalarınız, bakım/parça değişimleri ve kilometre loglarınız cihazınızda güvenle saklanmaktadır.
              </p>
            </div>
          </div>

          {/* Data Breakdown Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Yedekleme Kapsamındaki Veriler
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-xs font-black text-slate-900 dark:text-white">{counters.length}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Sayaç</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-xs font-black text-slate-900 dark:text-white">{vehicles.length}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Araç</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-xs font-black text-slate-900 dark:text-white">{fuelLogs.length}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Yakıt Fişi</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-xs font-black text-slate-900 dark:text-white">{maintLogs.length}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Bakım & Parça</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2 col-span-2 sm:col-span-2">
                <Gauge className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-xs font-black text-slate-900 dark:text-white">{odometerLogs.length}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Kilometre Logu</span>
                </div>
              </div>
            </div>
          </div>

          {importStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
              }`}
            >
              {importStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span className="leading-snug">{importStatus.message}</span>
            </div>
          )}

          {/* Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export JSON */}
            <button
              onClick={handleExport}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-left flex flex-col justify-between gap-3 group active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="block text-xs font-extrabold text-slate-900 dark:text-white">Tam Yedek Al (Dışa Aktar)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug block mt-0.5">
                  Sayaçlar ve tüm araç verilerini tek JSON dosyası olarak indir
                </span>
              </div>
            </button>

            {/* Import JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-left flex flex-col justify-between gap-3 group active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="block text-xs font-extrabold text-slate-900 dark:text-white">Yedekten Yükle (İçe Aktar)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug block mt-0.5">
                  Sayaç ve araç geçmişinizi dosyadan geri yükleyin
                </span>
              </div>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Reset sample data option */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onResetToDefaultSamples();
                setImportStatus({ message: 'Varsayılan örnek veriler başarıyla yüklendi.', type: 'success' });
              }}
              className="w-full py-2.5 px-3 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Varsayılan Örnek Sayaç & Araç Verilerini Geri Yükle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
