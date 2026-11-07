import React, { useState, useMemo } from 'react';
import {
  Car,
  Plus,
  Fuel,
  Wrench,
  Gauge,
  BarChart3,
  Calendar,
  Trash2,
  Edit3,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Droplet,
  Building2,
  Zap,
  Info,
  ArrowUpDown,
  FileText,
  Download,
  Component,
  Database,
  Scale,
  MoreVertical,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Vehicle, FuelLog, MaintenanceLog, OdometerLog, VehicleFuelType } from '../../types';
import { VehicleModal } from './VehicleModal';
import { FuelModal } from './FuelModal';
import { MaintenanceModal } from './MaintenanceModal';
import { OdometerModal } from './OdometerModal';
import { FuelTrendChart } from './FuelTrendChart';
import { VehicleProfitCalculator } from './VehicleProfitCalculator';
import { ConfirmModal } from '../ConfirmModal';
import { triggerHaptic } from '../../utils/notifications';
import { generateVehiclePdfReport } from '../../utils/pdfExport';

interface VehicleSectionProps {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  maintLogs: MaintenanceLog[];
  odometerLogs: OdometerLog[];
  onAddVehicle: (v: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onAddFuelLog: (f: Omit<FuelLog, 'id'>) => void;
  onUpdateFuelLog?: (f: FuelLog) => void;
  onDeleteFuelLog: (id: string) => void;
  onAddMaintLog: (m: Omit<MaintenanceLog, 'id'>, createCounter: boolean) => void;
  onUpdateMaintLog: (m: MaintenanceLog, createCounter: boolean) => void;
  onDeleteMaintLog: (id: string) => void;
  onAddOdometerLog: (vehicleId: string, odo: number, date: string, notes: string) => void;
  onOpenBackup?: () => void;
}

type SubTabType = 'fuel' | 'maint' | 'odometer' | 'stats' | 'profit';

const FUEL_TYPE_LABELS: Record<VehicleFuelType, { label: string; badge: string }> = {
  gasoline: { label: 'Benzin', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' },
  diesel: { label: 'Dizel', badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
  lpg: { label: 'LPG', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300' },
  hybrid: { label: 'Hibrit', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' },
  electric: { label: 'Elektrikli', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300' },
};

export const VehicleSection: React.FC<VehicleSectionProps> = ({
  vehicles,
  fuelLogs,
  maintLogs,
  odometerLogs,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddFuelLog,
  onUpdateFuelLog,
  onDeleteFuelLog,
  onAddMaintLog,
  onUpdateMaintLog,
  onDeleteMaintLog,
  onAddOdometerLog,
  onOpenBackup,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.id || ''
  );
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('fuel');
  const [showFuelChart, setShowFuelChart] = useState(false);

  // Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [editingFuelLog, setEditingFuelLog] = useState<FuelLog | null>(null);
  const [fuelToDelete, setFuelToDelete] = useState<string | null>(null);

  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [editingMaintLog, setEditingMaintLog] = useState<MaintenanceLog | null>(null);
  const [maintToDelete, setMaintToDelete] = useState<string | null>(null);

  const [isOdometerModalOpen, setIsOdometerModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Active Vehicle
  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;
  }, [vehicles, selectedVehicleId]);

  // Active Vehicle Logs
  const [maintSortOrder, setMaintSortOrder] = useState<'asc' | 'desc'>('asc');

  const activeFuelLogs = useMemo(() => {
    if (!activeVehicle) return [];
    return fuelLogs
      .filter((f) => f.vehicleId === activeVehicle.id)
      .sort((a, b) => {
        const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return b.odometer - a.odometer;
      });
  }, [fuelLogs, activeVehicle]);

  // Compute distance traveled since previous fuel fill-up (+ kaç km gidilmiş)
  const fuelLogsWithKmDiff = useMemo(() => {
    if (!activeVehicle || activeFuelLogs.length === 0) return [];
    // Sort chronologically ascending to calculate accurate delta between consecutive fill-ups
    const chronAsc = [...activeFuelLogs].sort((a, b) => {
      const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.odometer - b.odometer;
    });

    const diffMap = new Map<string, number | null>();
    for (let i = 0; i < chronAsc.length; i++) {
      if (i > 0) {
        const diff = chronAsc[i].odometer - chronAsc[i - 1].odometer;
        diffMap.set(chronAsc[i].id, diff > 0 ? diff : null);
      } else {
        // First recorded fuel fill-up: compare against purchase odometer if available
        const pOdo = activeVehicle.purchaseOdometer;
        if (pOdo && chronAsc[i].odometer > pOdo) {
          diffMap.set(chronAsc[i].id, chronAsc[i].odometer - pOdo);
        } else {
          diffMap.set(chronAsc[i].id, null);
        }
      }
    }

    return activeFuelLogs.map((log) => ({
      ...log,
      kmSincePrevFuel: diffMap.get(log.id) ?? null,
    }));
  }, [activeFuelLogs, activeVehicle]);

  const activeMaintLogs = useMemo(() => {
    if (!activeVehicle) return [];
    return maintLogs
      .filter((m) => m.vehicleId === activeVehicle.id)
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return maintSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
  }, [maintLogs, activeVehicle, maintSortOrder]);

  const activeOdoLogs = useMemo(() => {
    if (!activeVehicle) return [];
    return odometerLogs
      .filter((o) => o.vehicleId === activeVehicle.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [odometerLogs, activeVehicle]);

  // Calculated Stats
  const stats = useMemo(() => {
    if (!activeVehicle) {
      return {
        totalFuelCost: 0,
        calculatedFuelCost: 0,
        effectiveFuelCostPerKm: 0,
        totalMaintCost: 0,
        totalExpenses: 0,
        totalLiters: 0,
        avgConsumption: null as number | null,
        avgCostPerKm: null as number | null,
        nextServiceDue: null as { kmRemaining: number; isOverdue: boolean; nextKm?: number; date?: string } | null,
        distanceTraveled: 0,
        alternativeTotalExpense: 0,
        totalVehicleDirectCost: 0,
        operatingSavings: 0,
        isProfit: false,
        hasCapital: false,
        valueGain: 0,
        classicalAccounting: 0,
        realEconomicProfit: 0,
      };
    }

    const totalFuelCost = activeFuelLogs.reduce((acc, f) => acc + (f.totalCost || 0), 0);
    const totalLiters = activeFuelLogs.reduce((acc, f) => acc + (f.fuelLiters || 0), 0);
    const totalMaintCost = activeMaintLogs.reduce((acc, m) => acc + (m.cost || 0), 0);

    // Calculate consumption from consecutive full tanks
    const sortedFuelAsc = [...activeFuelLogs].sort((a, b) => a.odometer - b.odometer);
    const consumptionRates: number[] = [];
    const costPerKmRates: number[] = [];

    for (let i = 1; i < sortedFuelAsc.length; i++) {
      const prev = sortedFuelAsc[i - 1];
      const curr = sortedFuelAsc[i];
      const distance = curr.odometer - prev.odometer;

      if (distance > 0 && curr.isFullTank && curr.fuelLiters > 0) {
        const rate = (curr.fuelLiters / distance) * 100;
        const costRate = curr.totalCost / distance;
        if (rate > 2 && rate < 30) {
          consumptionRates.push(rate);
          costPerKmRates.push(costRate);
        }
      }
    }

    const avgConsumption =
      consumptionRates.length > 0
        ? consumptionRates.reduce((a, b) => a + b, 0) / consumptionRates.length
        : null;

    let avgCostPerKm =
      costPerKmRates.length > 0
        ? costPerKmRates.reduce((a, b) => a + b, 0) / costPerKmRates.length
        : null;

    // Fallback estimation if not enough full tank pairs yet
    if (avgCostPerKm === null && activeFuelLogs.length > 0 && totalLiters > 0 && totalFuelCost > 0) {
      const avgPricePerLiter = totalFuelCost / totalLiters;
      if (avgConsumption !== null) {
        avgCostPerKm = (avgConsumption * avgPricePerLiter) / 100;
      } else if (sortedFuelAsc.length >= 2) {
        const firstLog = sortedFuelAsc[0];
        const lastLog = sortedFuelAsc[sortedFuelAsc.length - 1];
        const totalDist = lastLog.odometer - firstLog.odometer;
        if (totalDist > 0) {
          avgCostPerKm = totalFuelCost / totalDist;
        }
      }
    }

    // Next service due calculation from maintenance logs
    let nextServiceDue = null;
    const maintWithNext = activeMaintLogs.find((m) => m.nextServiceKm || m.nextServiceDate);
    if (maintWithNext) {
      const currentKm = activeVehicle.currentOdometer;
      const targetKm = maintWithNext.nextServiceKm;
      const kmRemaining = targetKm ? targetKm - currentKm : 999999;
      nextServiceDue = {
        kmRemaining,
        isOverdue: targetKm ? kmRemaining <= 0 : false,
        nextKm: targetKm,
        date: maintWithNext.nextServiceDate,
      };
    }

    // Profit/Loss & Alternative Transit metrics
    const defaultFuelRates: Record<VehicleFuelType, number> = {
      gasoline: 3.10,
      diesel: 2.75,
      lpg: 1.95,
      hybrid: 2.10,
      electric: 1.15,
    };

    const effectiveFuelCostPerKm =
      activeVehicle.averageFuelCostPerKm && activeVehicle.averageFuelCostPerKm > 0
        ? activeVehicle.averageFuelCostPerKm
        : avgCostPerKm !== null && avgCostPerKm > 0
        ? avgCostPerKm
        : defaultFuelRates[activeVehicle.fuelType] || 2.75;

    const distanceTraveled = Math.max(0, activeVehicle.currentOdometer - (activeVehicle.purchaseOdometer || 0));
    const calculatedFuelCost = distanceTraveled * effectiveFuelCostPerKm;
    const altRate = activeVehicle.alternativeCostPerKm || 10;
    const alternativeTotalExpense = distanceTraveled * altRate;
    const totalVehicleDirectCost = calculatedFuelCost + totalMaintCost;
    const operatingSavings = alternativeTotalExpense - totalVehicleDirectCost;
    const isProfit = operatingSavings >= 0;

    // Gerçek Ekonomik Bilanço [A, B, C, D] Değişkenleri:
    const hasCapital = (activeVehicle.purchasePrice || 0) > 0 && (activeVehicle.currentMarketValue || 0) > 0;
    const valueGain = hasCapital ? (activeVehicle.currentMarketValue || 0) - (activeVehicle.purchasePrice || 0) : 0;
    const classicalAccounting = hasCapital ? valueGain - totalVehicleDirectCost : -totalVehicleDirectCost;
    const realEconomicProfit = hasCapital ? classicalAccounting + alternativeTotalExpense : operatingSavings;

    return {
      totalFuelCost,
      calculatedFuelCost,
      effectiveFuelCostPerKm,
      totalMaintCost,
      totalExpenses: totalMaintCost,
      totalLiters,
      avgConsumption,
      avgCostPerKm,
      nextServiceDue,
      distanceTraveled,
      alternativeTotalExpense,
      totalVehicleDirectCost,
      operatingSavings,
      isProfit,
      hasCapital,
      valueGain,
      classicalAccounting,
      realEconomicProfit,
    };
  }, [activeVehicle, activeFuelLogs, activeMaintLogs]);

  const handleExportPdf = () => {
    if (!activeVehicle) return;
    triggerHaptic(50);
    setIsMoreMenuOpen(false);
    generateVehiclePdfReport(activeVehicle, fuelLogs, maintLogs, odometerLogs, stats);
  };

  if (vehicles.length === 0) {
    return (
      <div id="no-vehicles-view" className="py-12 px-4 text-center space-y-4 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Car className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Henüz Garajınızda Araç Yok
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          Birden fazla araç ekleyebilir, her birinin yakıt alımını, kilometre ve periyodik bakım kayıtlarını detaylı takip edebilirsiniz.
        </p>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setIsVehicleModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>İlk Aracını Ekle</span>
        </button>

        <VehicleModal
          isOpen={isVehicleModalOpen}
          vehicle={editingVehicle}
          onClose={() => setIsVehicleModalOpen(false)}
          onSave={onAddVehicle}
        />
      </div>
    );
  }

  return (
    <div id="vehicle-section-root" className="space-y-4 sm:space-y-6">
      {/* 1. TOP VEHICLE SELECTOR & ADD BUTTON */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
          {vehicles.map((v) => {
            const isSelected = activeVehicle?.id === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  triggerHaptic(20);
                  setSelectedVehicleId(v.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: v.color || '#3b82f6' }}
                />
                <span className="font-extrabold truncate max-w-[120px] sm:max-w-none">
                  {v.brand} {v.model}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                  {v.plateNumber}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => {
              triggerHaptic(30);
              setEditingVehicle(null);
              setIsVehicleModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 transition-all shrink-0 cursor-pointer"
            title="Yeni Araç Ekle"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Yeni Araç</span>
          </button>
        </div>
      </div>

      {activeVehicle && (
        <>
          {/* 2. MODERN VEHICLE HERO CARD (Mobile-First, Streamlined, No Clutter) */}
          <div
            id="vehicle-hero-card"
            className="relative rounded-3xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4"
          >
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-10 blur-3xl pointer-events-none"
              style={{ backgroundColor: activeVehicle.color || '#3b82f6' }}
            />

            {/* TOP HEADER: Turkish Plate Badge + Brand Model + Fuel/Year + More Menu */}
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                {/* Authentic Turkish License Plate Badge */}
                <div className="inline-flex items-center rounded-lg overflow-hidden border border-slate-900 bg-slate-900 text-white font-mono shadow-xs shrink-0">
                  <span className="bg-blue-600 text-[10px] px-1.5 py-1 font-sans font-black tracking-tighter select-none">
                    TR
                  </span>
                  <span className="px-2.5 py-1 text-xs font-black tracking-wider text-amber-300">
                    {activeVehicle.plateNumber}
                  </span>
                </div>

                {/* Fuel & Year Tags */}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    FUEL_TYPE_LABELS[activeVehicle.fuelType]?.badge || 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {FUEL_TYPE_LABELS[activeVehicle.fuelType]?.label}
                </span>

                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {activeVehicle.year}
                </span>
              </div>

              {/* Three-Dot Actions Menu (Edit, PDF, Backup, Delete) */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Araç Seçenekleri"
                  aria-label="Araç İşlemleri"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {isMoreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsMoreMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-11 z-40 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 space-y-0.5 text-xs font-bold text-slate-700 dark:text-slate-300 animate-in fade-in zoom-in-95">
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setEditingVehicle(activeVehicle);
                          setIsVehicleModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <Edit3 className="w-4 h-4 text-slate-500" />
                        <span>Aracı Düzenle</span>
                      </button>

                      <button
                        onClick={handleExportPdf}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left text-rose-600 dark:text-rose-400"
                      >
                        <FileText className="w-4 h-4" />
                        <span>PDF Raporu İndir</span>
                      </button>

                      {onOpenBackup && (
                        <button
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            onOpenBackup();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left text-indigo-600 dark:text-indigo-400"
                        >
                          <Database className="w-4 h-4" />
                          <span>Verileri Yedekle</span>
                        </button>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setVehicleToDelete(activeVehicle);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Aracı Sil</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* VEHICLE TITLE & ODOMETER DISPLAY */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {activeVehicle.brand} {activeVehicle.model}
                </h2>
                {activeVehicle.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {activeVehicle.notes}
                  </p>
                )}
              </div>

              {/* Prominent Current KM Counter with Quick Update */}
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 sm:px-3.5 sm:py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                <Gauge className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Güncel Gösterge
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono leading-none mt-0.5">
                    {activeVehicle.currentOdometer.toLocaleString('tr-TR')}{' '}
                    <span className="text-xs text-slate-500 font-bold">KM</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOdometerModalOpen(true)}
                  className="ml-auto sm:ml-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Güncelle
                </button>
              </div>
            </div>

            {/* UNIFIED 4-METRIC DASHBOARD (2 cols on mobile, 4 cols on desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* 1. Yakıt Harcaması */}
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5" />
                    <span>Yakıt</span>
                  </span>
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                  ₺{stats.totalFuelCost.toLocaleString('tr-TR')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {stats.avgConsumption !== null
                    ? `${stats.avgConsumption.toFixed(1)} L/100km · ${activeFuelLogs.length} Alım`
                    : `${activeFuelLogs.length} Alım Kaydı`}
                </div>
              </div>

              {/* 2. Bakım & Servis Masrafı */}
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Bakım Masrafı</span>
                  </span>
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                  ₺{stats.totalExpenses.toLocaleString('tr-TR')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {activeMaintLogs.length} Servis Kaydı
                </div>
              </div>

              {/* 3. Ekonomik Kâr / Zarar */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setActiveSubTab('profit');
                }}
                className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.01] cursor-pointer ${
                  (stats.realEconomicProfit ?? stats.operatingSavings) >= 0
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-900/40'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/40'
                }`}
                title="Bilanço sekmesini aç"
              >
                <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Ekonomik Kâr</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div
                  className={`text-base sm:text-lg font-black font-mono ${
                    (stats.realEconomicProfit ?? stats.operatingSavings) >= 0
                      ? 'text-purple-700 dark:text-purple-300'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {(stats.realEconomicProfit ?? stats.operatingSavings) >= 0 ? '+' : '-'}₺
                  {Math.abs(stats.realEconomicProfit ?? stats.operatingSavings).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {(stats.realEconomicProfit ?? stats.operatingSavings) >= 0
                    ? 'Fırsat Tasarrufu'
                    : 'Zarar Durumu'}
                </div>
              </button>

              {/* 4. Gelecek Bakım Uyarısı */}
              <div
                className={`p-3 rounded-2xl border ${
                  stats.nextServiceDue?.isOverdue
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300/80 dark:border-rose-900/60'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <AlertCircle
                      className={`w-3.5 h-3.5 ${
                        stats.nextServiceDue?.isOverdue
                          ? 'text-rose-600 animate-pulse'
                          : 'text-slate-500'
                      }`}
                    />
                    <span>Sonraki Bakım</span>
                  </span>
                </div>
                <div
                  className={`text-base sm:text-lg font-black font-mono ${
                    stats.nextServiceDue?.isOverdue
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {stats.nextServiceDue
                    ? stats.nextServiceDue.isOverdue
                      ? 'Zamanı Geldi!'
                      : `${stats.nextServiceDue.kmRemaining.toLocaleString('tr-TR')} KM`
                    : 'Takipte'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {stats.nextServiceDue?.nextKm
                    ? `Hedef: ${stats.nextServiceDue.nextKm.toLocaleString('tr-TR')} KM`
                    : 'Periyodik Kontrol'}
                </div>
              </div>
            </div>

            {/* PRIMARY QUICK ACTION BUTTONS (The 2 main daily actions, clean and thumb-friendly) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setEditingFuelLog(null);
                  setIsFuelModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs text-white bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Fuel className="w-4 h-4 stroke-[2.5]" />
                <span>+ Yakıt Ekle</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setEditingMaintLog(null);
                  setIsMaintModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Wrench className="w-4 h-4 stroke-[2.5]" />
                <span>+ Bakım Ekle</span>
              </button>
            </div>
          </div>

          {/* 3. SUB-NAVIGATION TABS (Clean Segmented Control, Horizontal Scroll on Mobile) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                triggerHaptic(15);
                setActiveSubTab('fuel');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'fuel'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Yakıt ({activeFuelLogs.length})</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(15);
                setActiveSubTab('maint');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'maint'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Bakım ({activeMaintLogs.length})</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(15);
                setActiveSubTab('odometer');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'odometer'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>KM ({activeOdoLogs.length})</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(15);
                setActiveSubTab('stats');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'stats'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analiz</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(20);
                setActiveSubTab('profit');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'profit'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Gerçek Bilanço</span>
            </button>
          </div>

          {/* 4. SUB TAB CONTENTS */}

          {/* 4.1. FUEL LOGS TAB */}
          {activeSubTab === 'fuel' && (
            <div className="space-y-3">
              {/* Collapsible Fuel Trend Chart & Summary */}
              {activeFuelLogs.length >= 2 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                      Yakıt Tüketim Analizi
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFuelChart((prev) => !prev)}
                      className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      <span>{showFuelChart ? 'Grafiği Gizle' : 'Grafiği Göster'}</span>
                      {showFuelChart ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {showFuelChart && <FuelTrendChart logs={activeFuelLogs} />}
                </div>
              )}

              {/* Fuel List Header */}
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Son Yakıt Alımları ({activeFuelLogs.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFuelLog(null);
                    setIsFuelModalOpen(true);
                  }}
                  className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Yakıt Ekle</span>
                </button>
              </div>

              {activeFuelLogs.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <Fuel className="w-10 h-10 text-amber-500 mx-auto opacity-70" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Henüz kayıtlı yakıt alımı yok.
                  </p>
                  <button
                    onClick={() => {
                      setEditingFuelLog(null);
                      setIsFuelModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm cursor-pointer"
                  >
                    + İlk Yakıt Alımını Ekle
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {fuelLogsWithKmDiff.map((f) => (
                    <div
                      key={f.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 transition-all space-y-2"
                    >
                      {/* Top Row: Odometer + KM Delta Badge + Total Cost */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                            {f.odometer.toLocaleString('tr-TR')} KM
                          </span>

                          {/* + Kaç KM Gidildi Göstergesi */}
                          {f.kmSincePrevFuel !== null && (
                            <span
                              className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-mono border border-emerald-200/80 dark:border-emerald-800/60 inline-flex items-center gap-1 shadow-2xs"
                              title="Önceki yakıt alımına göre kat edilen mesafe"
                            >
                              <span>▲</span>
                              <span>+{f.kmSincePrevFuel.toLocaleString('tr-TR')} KM</span>
                            </span>
                          )}

                          {f.isFullTank && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Full Depo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                            ₺{f.totalCost.toLocaleString('tr-TR')}
                          </span>
                          <button
                            onClick={() => {
                              setEditingFuelLog(f);
                              setIsFuelModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                            title="Kaydı Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setFuelToDelete(f.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Kaydı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Row: Date · Station · Liters · Price/L */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap gap-1 pt-0.5 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{new Date(f.date).toLocaleDateString('tr-TR')}</span>
                          {f.station && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {f.station}
                              </span>
                            </>
                          )}
                          <span>·</span>
                          <span>{f.fuelLiters} Litre</span>
                          <span>·</span>
                          <span>₺{f.pricePerLiter}/L</span>
                        </div>
                      </div>

                      {f.notes && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic truncate">
                          {f.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4.2. MAINTENANCE LOGS TAB */}
          {activeSubTab === 'maint' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Bakım & Servis Kayıtları ({activeMaintLogs.length})
                </span>
                <div className="flex items-center gap-3">
                  {activeMaintLogs.length > 1 && (
                    <button
                      onClick={() => setMaintSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                      className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                    >
                      <ArrowUpDown className="w-3 h-3 text-emerald-500" />
                      <span>{maintSortOrder === 'asc' ? 'Eski-Yeni' : 'Yeni-Eski'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingMaintLog(null);
                      setIsMaintModalOpen(true);
                    }}
                    className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Bakım Ekle</span>
                  </button>
                </div>
              </div>

              {activeMaintLogs.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <Wrench className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Henüz kayıtlı bakım/servis işlemi yok.
                  </p>
                  <button
                    onClick={() => {
                      setEditingMaintLog(null);
                      setIsMaintModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                  >
                    + İlk Bakım Kaydını Ekle
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeMaintLogs.map((m) => {
                    const kmRemaining = m.nextServiceKm ? m.nextServiceKm - activeVehicle.currentOdometer : null;
                    const isOverdue = kmRemaining !== null && kmRemaining <= 0;

                    return (
                      <div
                        key={m.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all space-y-2.5"
                      >
                        {/* Title & Cost & Action Buttons */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                              {m.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                {m.odometer.toLocaleString('tr-TR')} KM
                              </span>
                              <span>·</span>
                              <span>{new Date(m.date).toLocaleDateString('tr-TR')}</span>
                              {m.provider && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                                    {m.provider}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              ₺{m.cost.toLocaleString('tr-TR')}
                            </span>
                            <button
                              onClick={() => {
                                setEditingMaintLog(m);
                                setIsMaintModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setMaintToDelete(m.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Future Service Reminder Alert */}
                        {(m.nextServiceKm || m.nextServiceDate) && (
                          <div
                            className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                              isOverdue
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Zap className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {m.nextServiceKm
                                  ? `Sonraki Hedef: ${m.nextServiceKm.toLocaleString('tr-TR')} KM`
                                  : 'Sonraki Servis Hedefi'}
                                {m.nextServiceDate ? ` (${new Date(m.nextServiceDate).toLocaleDateString('tr-TR')})` : ''}
                              </span>
                            </div>
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80">
                              {kmRemaining !== null
                                ? isOverdue
                                  ? 'Süresi Geldi!'
                                  : `${kmRemaining.toLocaleString('tr-TR')} KM Kaldı`
                                : 'Aktif'}
                            </span>
                          </div>
                        )}

                        {/* Replaced Parts or Notes */}
                        {(m.partsReplaced || m.notes) && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 whitespace-pre-line">
                            {[m.partsReplaced, m.notes].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4.3. ODOMETER HISTORY TAB */}
          {activeSubTab === 'odometer' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Gösterge Kilometresi: {activeVehicle.currentOdometer.toLocaleString('tr-TR')} KM
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Kilometrenizi düzenli güncelleyerek bakım aralıklarınızı doğru takip edin.
                  </div>
                </div>
                <button
                  onClick={() => setIsOdometerModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shrink-0 cursor-pointer"
                >
                  KM Güncelle
                </button>
              </div>

              {activeOdoLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Henüz manuel kilometre güncelleme kaydı yok.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {activeOdoLogs.map((o) => (
                    <div key={o.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Gauge className="w-4 h-4 text-blue-500" />
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {o.odometer.toLocaleString('tr-TR')} KM
                          </span>
                          {o.notes && (
                            <span className="text-slate-400 dark:text-slate-500 ml-2">
                              ({o.notes})
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(o.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4.4. STATS & ANALYTICS TAB */}
          {activeSubTab === 'stats' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-amber-500" />
                    <span>Toplam Yakıt Harcaması</span>
                  </h4>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                    ₺{stats.totalFuelCost.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• Fiş Kayıtları: ₺{stats.totalFuelCost.toLocaleString('tr-TR')} ({activeFuelLogs.length} alım)</p>
                  <p>• Mesafe Bazlı Yakıt: ₺{stats.calculatedFuelCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ({stats.distanceTraveled.toLocaleString('tr-TR')} KM × ₺{stats.effectiveFuelCostPerKm.toFixed(2)}/KM)</p>
                  <p>• Ortalama Tüketim: {stats.avgConsumption ? `${stats.avgConsumption.toFixed(1)} L/100km` : '---'}</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-500" />
                    <span>Toplam Bakım Harcaması</span>
                  </h4>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₺{stats.totalMaintCost.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• Servis/Bakım Sayısı: {activeMaintLogs.length} kayıt</p>
                  <p>• Toplam Bakım Masrafı: ₺{stats.totalExpenses.toLocaleString('tr-TR')}</p>
                </div>
              </div>

              {/* Profit & Alternative Travel Summary in Stats */}
              <div className="sm:col-span-2 p-4 sm:p-5 rounded-3xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-xs font-black text-purple-950 dark:text-purple-200 uppercase tracking-wider">
                      Gerçek Ekonomik Bilanço Özeti
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Alternatif Ulaşım Tasarrufu: <strong className="font-mono">₺{stats.alternativeTotalExpense.toLocaleString('tr-TR')}</strong> · 
                    Net Ekonomik Kâr: <strong className="font-mono text-purple-700 dark:text-purple-300">{(stats.realEconomicProfit ?? stats.operatingSavings) >= 0 ? '+' : '-'}₺{Math.abs(stats.realEconomicProfit ?? stats.operatingSavings).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    setActiveSubTab('profit');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-700 transition-all shrink-0 cursor-pointer"
                >
                  Detaylı Bilanço Tablosunu Gör
                </button>
              </div>
            </div>
          )}

          {/* 4.5. GERÇEK EKONOMİK BİLANÇO TABLOSU TAB */}
          {activeSubTab === 'profit' && (
            <VehicleProfitCalculator
              vehicle={activeVehicle}
              fuelLogs={activeFuelLogs}
              maintLogs={activeMaintLogs}
              onUpdateVehicle={onUpdateVehicle}
            />
          )}
        </>
      )}

      {/* MODALS */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        vehicle={editingVehicle}
        onClose={() => setIsVehicleModalOpen(false)}
        onSave={(v) => {
          if (editingVehicle) {
            onUpdateVehicle({ ...editingVehicle, ...v, updatedAt: new Date().toISOString() });
          } else {
            onAddVehicle(v);
          }
        }}
      />

      {activeVehicle && (
        <>
          <FuelModal
            isOpen={isFuelModalOpen}
            vehicleId={activeVehicle.id}
            currentOdometer={activeVehicle.currentOdometer}
            fuelLogs={activeFuelLogs}
            log={editingFuelLog}
            onClose={() => {
              setIsFuelModalOpen(false);
              setEditingFuelLog(null);
            }}
            onSave={(logData) => {
              if (editingFuelLog && onUpdateFuelLog) {
                onUpdateFuelLog({ ...editingFuelLog, ...logData });
              } else {
                onAddFuelLog(logData);
              }
              setEditingFuelLog(null);
            }}
          />

          <MaintenanceModal
            isOpen={isMaintModalOpen}
            vehicleId={activeVehicle.id}
            vehicleTitle={`${activeVehicle.brand} ${activeVehicle.model}`}
            currentOdometer={activeVehicle.currentOdometer}
            log={editingMaintLog}
            onClose={() => {
              setIsMaintModalOpen(false);
              setEditingMaintLog(null);
            }}
            onSave={(logData, createCounter) => {
              if (logData.id) {
                onUpdateMaintLog(logData as MaintenanceLog, createCounter);
              } else {
                onAddMaintLog(logData, createCounter);
              }
              setEditingMaintLog(null);
            }}
          />

          <OdometerModal
            isOpen={isOdometerModalOpen}
            vehicleTitle={`${activeVehicle.brand} ${activeVehicle.model}`}
            currentOdometer={activeVehicle.currentOdometer}
            onClose={() => setIsOdometerModalOpen(false)}
            onSave={(odo, date, notes) => onAddOdometerLog(activeVehicle.id, odo, date, notes)}
          />
        </>
      )}

      {/* Delete Vehicle Confirmation */}
      <ConfirmModal
        isOpen={!!vehicleToDelete}
        title="Aracı Sil"
        description={
          vehicleToDelete
            ? `"${vehicleToDelete.brand} ${vehicleToDelete.model}" (${vehicleToDelete.plateNumber}) aracını ve bağlı tüm yakıt/bakım kayıtlarını silmek istediğinize emin misiniz?`
            : ''
        }
        confirmText="Evet, Aracı Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={() => {
          if (vehicleToDelete) {
            onDeleteVehicle(vehicleToDelete.id);
            setVehicleToDelete(null);
          }
        }}
      />

      {/* Delete Fuel Log Confirmation */}
      <ConfirmModal
        isOpen={!!fuelToDelete}
        title="Yakıt Kaydını Sil"
        description="Bu yakıt alım kaydını silmek istediğinize emin misiniz?"
        confirmText="Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onClose={() => setFuelToDelete(null)}
        onConfirm={() => {
          if (fuelToDelete) {
            onDeleteFuelLog(fuelToDelete);
            setFuelToDelete(null);
          }
        }}
      />

      {/* Delete Maintenance Log Confirmation */}
      <ConfirmModal
        isOpen={!!maintToDelete}
        title="Bakım Kaydını Sil"
        description="Bu bakım/servis kaydını silmek istediğinize emin misiniz?"
        confirmText="Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onClose={() => setMaintToDelete(null)}
        onConfirm={() => {
          if (maintToDelete) {
            onDeleteMaintLog(maintToDelete);
            setMaintToDelete(null);
          }
        }}
      />
    </div>
  );
};
