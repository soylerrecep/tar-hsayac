import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Gauge,
  DollarSign,
  Car,
  Bus,
  Save,
  Fuel,
  Calculator,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Lightbulb,
  Compass,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Vehicle, FuelLog, MaintenanceLog, VehicleFuelType } from '../../types';
import { triggerHaptic } from '../../utils/notifications';

interface VehicleProfitCalculatorProps {
  vehicle: Vehicle;
  fuelLogs: FuelLog[];
  maintLogs: MaintenanceLog[];
  onUpdateVehicle: (updated: Vehicle) => void;
}

interface TransportPreset {
  id: string;
  name: string;
  rate: number; // ₺/KM
  icon: string;
  description: string;
}

const PRESETS: TransportPreset[] = [
  {
    id: 'balanced',
    name: 'Dengeli Ortalama Ulaşım',
    rate: 10,
    icon: '⚖️',
    description: 'Taksi, kiralık araç ve toplu taşımanın harmanlandığı gerçekçi ortalama (Önerilen)',
  },
  {
    id: 'rental',
    name: 'Kiralık / Paylaşımlı Araç',
    rate: 14,
    icon: '🚗',
    description: 'TikTak, Moov veya günlük araç kiralama ve yakıt masrafı',
  },
  {
    id: 'taxi',
    name: 'Taksi / Özel Transfer',
    rate: 26,
    icon: '🚕',
    description: 'Şehir içi taksi ve özel şoförlü transfer birim maliyeti',
  },
  {
    id: 'transit',
    name: 'Yalnızca Toplu Taşıma',
    rate: 4.5,
    icon: '🚌',
    description: 'Metro, metrobüs, otobüs ve tren biletleri ortalaması',
  },
];

const DEFAULT_FUEL_COST_BY_TYPE: Record<VehicleFuelType, number> = {
  gasoline: 3.10, // ~7.0 L/100km @ ~44.5 ₺
  diesel: 2.75,   // ~5.8 L/100km @ ~46.5 ₺
  lpg: 1.95,      // ~8.5 L/100km @ ~23.0 ₺
  hybrid: 2.10,   // ~4.7 L/100km @ ~44.5 ₺
  electric: 1.15, // ~18 kWh/100km @ ~6.4 ₺
};

export const VehicleProfitCalculator: React.FC<VehicleProfitCalculatorProps> = ({
  vehicle,
  fuelLogs,
  maintLogs,
  onUpdateVehicle,
}) => {
  // Input states for odometer & vehicle valuation
  const [purchaseOdo, setPurchaseOdo] = useState<string>(
    vehicle.purchaseOdometer !== undefined ? String(vehicle.purchaseOdometer) : ''
  );
  const [currentVal, setCurrentVal] = useState<string>(
    vehicle.currentMarketValue !== undefined ? String(vehicle.currentMarketValue) : ''
  );
  const [purchasePr, setPurchasePr] = useState<string>(
    vehicle.purchasePrice !== undefined ? String(vehicle.purchasePrice) : ''
  );

  // Alternative transit rate state
  const [customRate, setCustomRate] = useState<number>(
    vehicle.alternativeCostPerKm || 10
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>('balanced');
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Auto-detect average fuel cost per KM from logs or vehicle defaults
  const autoDetectedFuelCostPerKm = useMemo(() => {
    if (fuelLogs.length === 0) {
      return DEFAULT_FUEL_COST_BY_TYPE[vehicle.fuelType] || 2.75;
    }
    const sorted = [...fuelLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 1. Try full tank intervals
    const fullTankRates: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const dist = curr.odometer - prev.odometer;
      if (dist > 0 && curr.isFullTank && prev.isFullTank) {
        fullTankRates.push(curr.totalCost / dist);
      }
    }
    if (fullTankRates.length > 0) {
      return fullTankRates.reduce((a, b) => a + b, 0) / fullTankRates.length;
    }

    // 2. Try totalCost / total distance between first & last log
    if (sorted.length >= 2) {
      const firstLog = sorted[0];
      const lastLog = sorted[sorted.length - 1];
      const totalDist = lastLog.odometer - firstLog.odometer;
      const totalCost = fuelLogs.reduce((acc, f) => acc + f.totalCost, 0);
      if (totalDist > 0 && totalCost > 0) {
        return totalCost / totalDist;
      }
    }

    // 3. Try average price per liter * default consumption
    const totalCost = fuelLogs.reduce((acc, f) => acc + f.totalCost, 0);
    const totalLiters = fuelLogs.reduce((acc, f) => acc + f.fuelLiters, 0);
    if (totalCost > 0 && totalLiters > 0) {
      const avgPricePerLiter = totalCost / totalLiters;
      const defaultConsumptions: Record<VehicleFuelType, number> = {
        gasoline: 7.0,
        diesel: 5.8,
        lpg: 8.5,
        hybrid: 4.8,
        electric: 18.0,
      };
      const cons = defaultConsumptions[vehicle.fuelType] || 6.5;
      return (avgPricePerLiter * cons) / 100;
    }

    return DEFAULT_FUEL_COST_BY_TYPE[vehicle.fuelType] || 2.75;
  }, [fuelLogs, vehicle.fuelType]);

  // Average Fuel Cost per KM state (editable by user)
  const [fuelCostRate, setFuelCostRate] = useState<number>(() => {
    if (vehicle.averageFuelCostPerKm && vehicle.averageFuelCostPerKm > 0) {
      return vehicle.averageFuelCostPerKm;
    }
    return autoDetectedFuelCostPerKm;
  });

  // Quick helper calculator: Liter Price & Consumption
  const [showQuickFuelCalc, setShowQuickFuelCalc] = useState(false);
  const [showAdvice, setShowAdvice] = useState(true);
  const [calcPricePerLiter, setCalcPricePerLiter] = useState<string>('45.0');
  const [calcConsumption, setCalcConsumption] = useState<string>(
    vehicle.fuelType === 'diesel' ? '5.8' : vehicle.fuelType === 'lpg' ? '8.5' : vehicle.fuelType === 'hybrid' ? '4.8' : vehicle.fuelType === 'electric' ? '18' : '7.0'
  );

  // Sync state if active vehicle changes
  useEffect(() => {
    setPurchaseOdo(vehicle.purchaseOdometer !== undefined ? String(vehicle.purchaseOdometer) : '');
    setCurrentVal(vehicle.currentMarketValue !== undefined ? String(vehicle.currentMarketValue) : '');
    setPurchasePr(vehicle.purchasePrice !== undefined ? String(vehicle.purchasePrice) : '');
    const rate = vehicle.alternativeCostPerKm || 10;
    setCustomRate(rate);

    const effectiveFuel =
      vehicle.averageFuelCostPerKm && vehicle.averageFuelCostPerKm > 0
        ? vehicle.averageFuelCostPerKm
        : autoDetectedFuelCostPerKm;
    setFuelCostRate(effectiveFuel);

    const matchPreset = PRESETS.find((p) => p.rate === rate);
    if (matchPreset) {
      setSelectedPresetId(matchPreset.id);
    } else {
      setSelectedPresetId('custom');
    }
  }, [
    vehicle.id,
    vehicle.purchaseOdometer,
    vehicle.currentMarketValue,
    vehicle.purchasePrice,
    vehicle.alternativeCostPerKm,
    vehicle.averageFuelCostPerKm,
    autoDetectedFuelCostPerKm,
  ]);

  // Handle Alternative Preset Select
  const handleSelectPreset = (preset: TransportPreset) => {
    triggerHaptic(20);
    setSelectedPresetId(preset.id);
    setCustomRate(preset.rate);
  };

  // Apply Quick Liter/Consumption calculation
  const handleApplyQuickCalc = () => {
    triggerHaptic(20);
    const pL = parseFloat(calcPricePerLiter) || 0;
    const cL = parseFloat(calcConsumption) || 0;
    if (pL > 0 && cL > 0) {
      const calculatedRate = (pL * cL) / 100;
      setFuelCostRate(Number(calculatedRate.toFixed(2)));
      setShowQuickFuelCalc(false);
    }
  };

  // Reset to auto-detected fuel price
  const handleResetToAutoDetected = () => {
    triggerHaptic(20);
    setFuelCostRate(Number(autoDetectedFuelCostPerKm.toFixed(2)));
  };

  // Quick Save Back to Vehicle
  const handleSaveToVehicle = () => {
    triggerHaptic(50);
    onUpdateVehicle({
      ...vehicle,
      purchaseOdometer: purchaseOdo ? Number(purchaseOdo) : undefined,
      currentMarketValue: currentVal ? Number(currentVal) : undefined,
      purchasePrice: purchasePr ? Number(purchasePr) : undefined,
      alternativeCostPerKm: customRate,
      averageFuelCostPerKm: fuelCostRate > 0 ? Number(fuelCostRate.toFixed(2)) : undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  // Main Profit / Loss Calculations
  const calcData = useMemo(() => {
    const pOdo = Number(purchaseOdo) || 0;
    const cOdo = vehicle.currentOdometer || 0;
    const pPrice = Number(purchasePr) || 0;
    const cVal = Number(currentVal) || 0;
    const ratePerKm = customRate > 0 ? customRate : 10;
    const effectiveFuelRate = fuelCostRate > 0 ? fuelCostRate : autoDetectedFuelCostPerKm;

    // Total distance traveled with vehicle since purchase
    const distanceTraveled = Math.max(0, cOdo - pOdo);

    // FUEL CALCULATION: Total distance multiplied by average fuel cost per KM
    const totalFuelCost = distanceTraveled * effectiveFuelRate;

    // Actual fuel receipts entered into the system (for informational reference)
    const loggedFuelReceiptsCost = fuelLogs.reduce((acc, f) => acc + f.totalCost, 0);

    // Total maintenance logged for this vehicle
    const totalMaintCost = maintLogs.reduce((acc, m) => acc + m.cost, 0);

    // Total Vehicle Operating Cost = Calculated Fuel Cost + Maintenance Cost
    const totalVehicleOperatingCost = totalFuelCost + totalMaintCost;

    // What if we covered this distance WITHOUT a car? (Alternative transit cost)
    const alternativeTotalExpense = distanceTraveled * ratePerKm;

    // Direct Operating Profit / Savings (Arabasız Alternatif Masrafı - Araç İşletme Masrafı)
    const operatingSavings = alternativeTotalExpense - totalVehicleOperatingCost;
    const isOperatingInProfit = operatingSavings >= 0;

    // Own Vehicle Cost Per KM
    const vehicleCostPerKm =
      distanceTraveled > 0 ? totalVehicleOperatingCost / distanceTraveled : 0;
    const savingsPerKm = ratePerKm - vehicleCostPerKm;

    // Vehicle Capital Change (if purchase price and current value both entered)
    const hasCapitalData = pPrice > 0 && cVal > 0;
    const capitalAppreciation = cVal - pPrice; // positive if vehicle gained value in TL

    // Comprehensive Financial Profit/Loss (including car equity change + travel savings)
    const netOverallProfitLoss = hasCapitalData
      ? capitalAppreciation + operatingSavings
      : operatingSavings;

    // Break-even and profit recovery analysis
    const marginPerKm = ratePerKm - effectiveFuelRate;
    let breakEvenTotalKm = 0;
    let neededAdditionalKm = 0;
    let canBreakEvenByDriving = false;

    if (marginPerKm > 0 && totalMaintCost > 0) {
      breakEvenTotalKm = Math.ceil(totalMaintCost / marginPerKm);
      neededAdditionalKm = Math.max(0, breakEvenTotalKm - distanceTraveled);
      canBreakEvenByDriving = true;
    }

    const fuelSavingsWith10PercentEco = distanceTraveled * (effectiveFuelRate * 0.10);

    // Explicit 4-variable economic bilanço breakdown requested by user:
    // [A] Aracın Alış Fiyatı
    // [B] Aracın Güncel Değeri
    // [C] Araca Yapılan Toplam Harcama (Yakıt + Bakım)
    // [D] Fırsat Maliyeti (Alternatif Ulaşım Bedeli)
    const A_purchasePrice = pPrice;
    const B_currentMarketValue = cVal;
    const C_totalExpenses = totalVehicleOperatingCost;
    const D_opportunityCost = alternativeTotalExpense;
    const step1_valueGain = B_currentMarketValue - A_purchasePrice;
    const step2_classicalAccounting = step1_valueGain - C_totalExpenses;
    const step3_realEconomicProfit = step2_classicalAccounting + D_opportunityCost;

    return {
      distanceTraveled,
      totalFuelCost,
      loggedFuelReceiptsCost,
      effectiveFuelRate,
      totalMaintCost,
      totalVehicleOperatingCost,
      alternativeTotalExpense,
      operatingSavings,
      isOperatingInProfit,
      vehicleCostPerKm,
      savingsPerKm,
      hasCapitalData,
      capitalAppreciation,
      netOverallProfitLoss,
      ratePerKm,
      marginPerKm,
      breakEvenTotalKm,
      neededAdditionalKm,
      canBreakEvenByDriving,
      fuelSavingsWith10PercentEco,
      A_purchasePrice,
      B_currentMarketValue,
      C_totalExpenses,
      D_opportunityCost,
      step1_valueGain,
      step2_classicalAccounting,
      step3_realEconomicProfit,
    };
  }, [
    purchaseOdo,
    vehicle.currentOdometer,
    purchasePr,
    currentVal,
    customRate,
    fuelCostRate,
    autoDetectedFuelCostPerKm,
    fuelLogs,
    maintLogs,
  ]);

  return (
    <div id="vehicle-profit-calculator" className="space-y-6">
      {/* Introduction Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-7 text-white shadow-xl border border-indigo-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Finansal Kâr / Zarar & Alternatif Ulaşım Analizi</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Aracınız Sizi Kâra mı Geçirdi, Zarara mı?
            </h3>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Satın aldığınız ilk günden bu yana kat ettiğiniz <strong className="text-white font-mono">{calcData.distanceTraveled.toLocaleString('tr-TR')} KM</strong> yolun yakıt harcaması, ortalama yakıt fiyatınıza göre hesaplanır ve arabasız alternatif ulaşım masrafınızla karşılaştırılır.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={handleSaveToVehicle}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-950 hover:bg-indigo-50 font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4 text-indigo-600" />
              <span>Değerleri Kaydet</span>
            </button>
          </div>
        </div>

        {isSavedToast && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hesaplama parametreleri araca başarıyla kaydedildi!</span>
          </div>
        )}
      </div>

      {/* Inputs Configuration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {/* 1. Araç Değer ve Kilometre Bilgileri */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              <Gauge className="w-4 h-4 text-indigo-500" />
              <span>1. Araç Değer ve Kilometre Bilgileri</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Güncel KM: <strong className="text-slate-800 dark:text-slate-200 font-mono">{vehicle.currentOdometer.toLocaleString('tr-TR')} KM</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Purchase KM */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Satın Alma Kilometresi (İlk KM) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="Örn: 65000"
                  value={purchaseOdo}
                  onChange={(e) => setPurchaseOdo(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Aracı aldığınız andaki gösterge kilometresi
              </p>
            </div>

            {/* Purchase Price [A] */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-indigo-600 dark:text-indigo-400 font-mono mr-1">[A]</span>
                Satın Alma Fiyatı (₺) <span className="text-[10px] text-slate-400 font-normal">(alış bedeli)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="Örn: 580000"
                  value={purchasePr}
                  onChange={(e) => setPurchasePr(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Aracı satın aldığınızdaki nakit maliyet
              </p>
            </div>

            {/* Current Market Value [B] */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono mr-1">[B]</span>
                Aracın Güncel Değeri (₺) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="Örn: 850000"
                  value={currentVal}
                  onChange={(e) => setCurrentVal(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Piyasadaki bugünkü yaklaşık satış değeri
              </p>
            </div>
          </div>
        </div>

        {/* 2. Ortalama Yakıt Fiyatı & KM Harcaması Parametresi */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                <span className="text-rose-600 dark:text-rose-400 font-mono mr-1">[C Harcama Bileşeni]</span>
                Ortalama Yakıt Fiyatı / KM Maliyeti (₺ / KM)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {fuelLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetToAutoDetected}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  title="Kayıtlı yakıt fişlerinizden hesaplanan değere dön"
                >
                  Fişlerden Al (₺{autoDetectedFuelCostPerKm.toFixed(2)}/KM)
                </button>
              )}
              <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                ₺{fuelCostRate.toFixed(2)} / KM
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Kâr / zarar hesabında, aracı satın aldığınızdan bu yana kat ettiğiniz <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">{calcData.distanceTraveled.toLocaleString('tr-TR')} KM</strong> yolun toplam yakıt harcaması bu birim fiyat ile hesaplanır.
          </p>

          {/* Slider and direct input */}
          <div className="flex items-center gap-4 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/40">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 shrink-0 flex items-center gap-1.5">
              <span>KM Yakıtı:</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={8.0}
              step={0.05}
              value={fuelCostRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFuelCostRate(val);
              }}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-bold text-slate-400">₺</span>
              <input
                type="number"
                min={0.1}
                max={20}
                step={0.05}
                value={fuelCostRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0.1;
                  setFuelCostRate(val);
                }}
                className="w-18 px-2 py-1 text-xs font-black rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-center font-mono text-amber-700 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <span className="text-[11px] font-bold text-slate-500">/KM</span>
            </div>
          </div>

          {/* Quick Helper Toggle: Litre Price & Consumption */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowQuickFuelCalc(!showQuickFuelCalc)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{showQuickFuelCalc ? 'Hesaplayıcıyı Gizle' : 'Litre Fiyatı ve 100 KM Tüketim ile Hızlı Belirle'}</span>
              {showQuickFuelCalc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showQuickFuelCalc && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ort. Yakıt Litre Fiyatı (₺/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    value={calcPricePerLiter}
                    onChange={(e) => setCalcPricePerLiter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ort. Tüketim (Litre / 100 KM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.5}
                    value={calcConsumption}
                    onChange={(e) => setCalcConsumption(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleApplyQuickCalc}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    KM Fiyatına Uygula (₺{((parseFloat(calcPricePerLiter) || 0) * (parseFloat(calcConsumption) || 0) / 100).toFixed(2)}/KM)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Fuel Result Callout */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">
                Hesaplanan Yakıt: <strong className="text-slate-900 dark:text-white font-mono">{calcData.distanceTraveled.toLocaleString('tr-TR')} KM</strong> × <strong className="text-amber-600 dark:text-amber-400 font-mono">₺{calcData.effectiveFuelRate.toFixed(2)} / KM</strong> =
              </span>
            </div>
            <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
              ₺{calcData.totalFuelCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} Toplam Yakıt
            </span>
          </div>
        </div>

        {/* 3. Arabasız Alternatif Ulaşım Birim Maliyeti [D Fırsat Maliyeti] */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Bus className="w-4 h-4 text-indigo-500" />
              <span>
                <span className="text-amber-600 dark:text-amber-400 font-mono mr-1">[D Fırsat Maliyeti]</span>
                Arabasız Alternatif Ulaşım Birim Maliyeti (₺ / KM)
              </span>
            </label>
            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
              ₺{customRate.toFixed(1)} / KM
            </span>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id && customRate === p.rate;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-xs font-black font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      ₺{p.rate} / KM
                    </span>
                  </div>
                  <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {p.name}
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight line-clamp-2">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Custom Slider / Fine Tune */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
              Özel Ayarla:
            </span>
            <input
              type="range"
              min={2}
              max={40}
              step={0.5}
              value={customRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCustomRate(val);
                setSelectedPresetId('custom');
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-bold text-slate-400">₺</span>
              <input
                type="number"
                min={1}
                max={100}
                step={0.5}
                value={customRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1;
                  setCustomRate(val);
                  setSelectedPresetId('custom');
                }}
                className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="text-[11px] font-bold text-slate-500">/KM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Big Result Verdict Card */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border transition-all shadow-xl relative overflow-hidden ${
          calcData.isOperatingInProfit
            ? 'bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-emerald-500/30'
            : 'bg-linear-to-br from-rose-500/10 via-rose-500/5 to-amber-500/10 border-rose-500/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                  calcData.isOperatingInProfit
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                }`}
              >
                {calcData.isOperatingInProfit ? (
                  <>
                    <TrendingUp className="w-4 h-4 stroke-[3]" />
                    <span>ARAÇ KÂRDA (TASARRUFLU)</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 stroke-[3]" />
                    <span>ALTERNATİFE GÖRE DAHA MASRAFLI</span>
                  </>
                )}
              </span>

              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Sahiplik Süresince: <strong className="font-mono text-slate-800 dark:text-slate-200">{calcData.distanceTraveled.toLocaleString('tr-TR')} KM</strong>
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {calcData.isOperatingInProfit ? '+' : '-'}₺
              {Math.abs(calcData.operatingSavings).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-xl leading-relaxed">
              {calcData.isOperatingInProfit ? (
                <>
                  Tebrikler! Kat ettiğiniz <strong className="font-bold">{calcData.distanceTraveled.toLocaleString('tr-TR')} KM</strong> yolu arabasız alternatif ulaşımla kat etseydiniz tahmini <strong className="font-bold text-emerald-600 dark:text-emerald-400">₺{calcData.alternativeTotalExpense.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> harcayacaktınız. Kendi aracınızın ortalama yakıt fiyatına göre hesaplanan yakıt masrafı (<strong className="font-bold">₺{calcData.totalFuelCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong>) ve bakım giderleri (<strong className="font-bold">₺{calcData.totalMaintCost.toLocaleString('tr-TR')}</strong>) ile toplam harcamanız <strong className="font-bold">₺{calcData.totalVehicleOperatingCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> tuttu ve net <strong className="font-bold text-emerald-600 dark:text-emerald-400">₺{calcData.operatingSavings.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kâr/tasarruf</strong> sağladınız.
                </>
              ) : (
                <>
                  Kat ettiğiniz <strong className="font-bold">{calcData.distanceTraveled.toLocaleString('tr-TR')} KM</strong> yolu alternatif ulaşımla kat etseydiniz yaklaşık <strong className="font-bold">₺{calcData.alternativeTotalExpense.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> masrafınız olurdu. Kendi aracınızın ortalama yakıt ve bakım giderleri toplamı <strong className="font-bold text-rose-600 dark:text-rose-400">₺{calcData.totalVehicleOperatingCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> tutarak <strong className="font-bold">₺{Math.abs(calcData.operatingSavings).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> daha fazla harcamaya yol açtı.
                </>
              )}
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                KM Başı Tasarruf
              </span>
              <p
                className={`text-lg font-black font-mono ${
                  calcData.savingsPerKm >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {calcData.savingsPerKm >= 0 ? '+' : ''}₺{calcData.savingsPerKm.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ml-1">/KM</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Kendi Araç KM Maliyeti
              </span>
              <p className="text-lg font-black font-mono text-slate-900 dark:text-white">
                ₺{calcData.vehicleCostPerKm.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ml-1">/KM</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kâra Geçiş ve Başabaş (Break-Even) Strateji Rehberi */}
      <div
        className={`rounded-3xl p-5 sm:p-6 border transition-all ${
          !calcData.isOperatingInProfit
            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60 shadow-sm'
            : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              !calcData.isOperatingInProfit ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
            }`}>
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {!calcData.isOperatingInProfit ? 'Aracı Kâra Geçirmek İçin Ne Yapılmalı?' : 'Kârlılığı Artırma & Verimlilik Rehberi'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {!calcData.isOperatingInProfit
                  ? 'Matematiksel başabaş (amortisman) analizi ve maliyeti kâra çevirme adımları'
                  : 'Aracınız şu anda kârda; kârlılığınızı ve tasarrufunuzu daha da artıracak adımlar'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvice(!showAdvice)}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{showAdvice ? 'Gizle' : 'Göster'}</span>
            {showAdvice ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showAdvice && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-in fade-in">
            {/* 1. Amortisman & Mesafe (Başabaş KM) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                <Target className="w-4 h-4 shrink-0" />
                <span>1. Mesafe ile Sabit Masrafları Amorti Etme</span>
              </div>
              {calcData.canBreakEvenByDriving ? (
                calcData.neededAdditionalKm > 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aracınız için yapılan bakım ve servis harcamaları (<strong>₺{calcData.totalMaintCost.toLocaleString('tr-TR')}</strong>) toplu sabit giderlerdir. Arabasız alternatife kıyasla KM başına <strong>₺{calcData.marginPerKm.toFixed(2)}</strong> brüt avantajınız var. Bu bakım masrafını tamamen amorti edip kâra geçmek için aracınızla toplam <strong>{calcData.breakEvenTotalKm.toLocaleString('tr-TR')} KM</strong> (yani şu andan itibaren <strong className="text-indigo-600 dark:text-indigo-400 font-black">+{calcData.neededAdditionalKm.toLocaleString('tr-TR')} KM daha</strong>) yol yapmanız yeterlidir. Araçla yol yaptıkça KM başı bakım payı erir ve araç kâra geçer.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed font-medium">
                    Tebrikler! Kat ettiğiniz {calcData.distanceTraveled.toLocaleString('tr-TR')} KM yol ile bakım masraflarınızın tamamı amorti edilmiş ve başabaş noktası aşılmıştır.
                  </p>
                )
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Alternatif ulaşım birim fiyatınız (₺{calcData.ratePerKm}/KM), araç yakıt birim fiyatınızdan (₺{calcData.effectiveFuelRate.toFixed(2)}/KM) yüksek olmalıdır. Alternatif ulaşım oranını gerçekçi taksi/araç kiralama maliyetlerine (10-14 ₺/KM) güncelleyiniz.
                </p>
              )}
            </div>

            {/* 2. Eko-Sürüş & Yakıt Optimizasyonu */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                <Zap className="w-4 h-4 shrink-0" />
                <span>2. Yakıt Tüketimini %10-15 Düşürmek</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Doğru lastik hava basıncı, ani kalkış/frenlemelerden kaçınma ve uygun devirde sürüş ile tüketimi sadece %10 düşürürseniz kat ettiğiniz yolda net <strong className="text-amber-600 dark:text-amber-400 font-bold">₺{calcData.fuelSavingsWith10PercentEco.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> tasarruf sağlarsınız.
              </p>
            </div>

            {/* 3. Önleyici Bakım & Ağır Masraf Engelleme */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>3. Önleyici Periyodik Bakım</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Zamanında yapılan motor yağı, filtre ve periyodik kontroller; motor ve şanzıman gibi 50.000 ₺ üzeri ağır hasar risklerini ortadan kaldırır. Uygulamadaki sayaçlarla bakımları geciktirmeden takip etmek en büyük tasarruftur.
              </p>
            </div>

            {/* 4. Sermaye / Piyasa Değeri Koruması */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold">
                <Compass className="w-4 h-4 shrink-0" />
                <span>4. Araç Değeri & Varlık Kârı Dengesi</span>
              </div>
              {calcData.hasCapitalData ? (
                calcData.capitalAppreciation > 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aracınızın güncel piyasa değeri alış bedelinize göre <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+₺{calcData.capitalAppreciation.toLocaleString('tr-TR')}</strong> artmış durumda. İşletme masraflarındaki açığınız, aracınızın sermaye kârı ile fazlasıyla karşılanmaktadır.
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aracın temiz kullanılması, bakım faturalarının eksiksiz tutulması satış anındaki ikinci el değer kaybını en aza indirir.
                  </p>
                )
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Satın alma fiyatınızı ve güncel piyasa değerinizi yukarıdaki alana girerek sermaye kârı/zararı dengesini de genel bilançoda görebilirsiniz.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Kendi Aracınız */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Kendi Aracınızla Masraflar
              </h4>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
              {calcData.distanceTraveled.toLocaleString('tr-TR')} KM
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Total Fuel Cost based on distance & average fuel price */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Toplam Yakıt Harcaması
                </span>
                <strong className="font-mono font-extrabold text-amber-600 dark:text-amber-400">
                  ₺{calcData.totalFuelCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </strong>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{calcData.distanceTraveled.toLocaleString('tr-TR')} KM × ₺{calcData.effectiveFuelRate.toFixed(2)}/KM</span>
                {fuelLogs.length > 0 && (
                  <span>Kayıtlı fişler: ₺{calcData.loggedFuelReceiptsCost.toLocaleString('tr-TR')} ({fuelLogs.length} alım)</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Toplam Bakım & Servis ({maintLogs.length} Kayıt)
              </span>
              <strong className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                ₺{calcData.totalMaintCost.toLocaleString('tr-TR')}
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 font-bold">
              <span className="text-blue-900 dark:text-blue-200">
                Toplam Yapılan Harcama
              </span>
              <span className="font-mono text-base font-black text-blue-700 dark:text-blue-300">
                ₺{calcData.totalVehicleOperatingCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 px-1">
              <span>Gerçekleşen Araç KM Maliyeti:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                ₺{calcData.vehicleCostPerKm.toFixed(2)} / KM
              </span>
            </div>
          </div>
        </div>

        {/* Right: Arabasız Alternatif */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Bus className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Arabasız Alternatif Senaryo
              </h4>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
              ₺{calcData.ratePerKm.toFixed(1)} / KM
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Katedilen Eşdeğer Mesafe
              </span>
              <strong className="font-mono font-extrabold text-slate-900 dark:text-white">
                {calcData.distanceTraveled.toLocaleString('tr-TR')} KM
              </strong>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Alternatif Birim Maliyet
              </span>
              <strong className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                ₺{calcData.ratePerKm.toFixed(2)} / KM
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 font-bold">
              <span className="text-amber-900 dark:text-amber-200">
                Arabasız Alternatif Toplam Fatura
              </span>
              <span className="font-mono text-base font-black text-amber-700 dark:text-amber-300">
                ₺{calcData.alternativeTotalExpense.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 px-1">
              <span>Fark (Kendi Aracınız vs Alternatif):</span>
              <span
                className={`font-mono font-bold ${
                  calcData.isOperatingInProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {calcData.isOperatingInProfit
                  ? '₺' + Math.abs(calcData.operatingSavings).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' Tasarruf'
                  : '₺' + Math.abs(calcData.operatingSavings).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' Fazla'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gerçek Ekonomik Bilanço Tablosu (Fırsat Maliyeti & 4 Değişken Analizi) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-700/50 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-800/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-200">
                4. Gerçek Ekonomik Bilanço Tablosu (4 Değişken Analizi)
              </h4>
              <p className="text-[11px] text-slate-400">
                Klasik muhasebe nakit akışı yerine Fırsat Maliyeti (Alternatif Ulaşım) odaklı net bilanço
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            [A, B, C, D] Modeli
          </span>
        </div>

        {/* 4 Variables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">
              [A] Aracın Alış Fiyatı
            </span>
            <p className="text-base font-black font-mono text-white">
              {calcData.A_purchasePrice > 0 ? `₺${calcData.A_purchasePrice.toLocaleString('tr-TR')}` : 'Girilmedi'}
            </p>
            <span className="text-[10px] text-slate-400 block">İlk nakit çıkışı</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 block uppercase">
              [B] Aracın Güncel Değeri
            </span>
            <p className="text-base font-black font-mono text-emerald-400">
              {calcData.B_currentMarketValue > 0 ? `₺${calcData.B_currentMarketValue.toLocaleString('tr-TR')}` : 'Girilmedi'}
            </p>
            <span className="text-[10px] text-slate-400 block">Piyasa satış değeri</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-rose-400 block uppercase">
              [C] Toplam Harcama
            </span>
            <p className="text-base font-black font-mono text-rose-300">
              ₺{calcData.C_totalExpenses.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[10px] text-slate-400 block">Yakıt + Bakım</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-amber-400 block uppercase">
              [D] Fırsat Maliyeti
            </span>
            <p className="text-base font-black font-mono text-amber-300">
              ₺{calcData.D_opportunityCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[10px] text-slate-400 block">Arabasız alternatif</span>
          </div>
        </div>

        {/* 3 Step Calculation Pipeline */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-indigo-900/40 space-y-3 font-mono text-xs">
          {/* Step 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-white/5">
            <span className="text-slate-300 font-sans font-medium flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold font-mono">1</span>
              <span>Değer Kazancı [B - A]:</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">
                {calcData.hasCapitalData ? `(₺${calcData.B_currentMarketValue.toLocaleString('tr-TR')} - ₺${calcData.A_purchasePrice.toLocaleString('tr-TR')}) =` : 'Alış fiyatı girilmedi'}
              </span>
              <span className={`font-bold ${calcData.step1_valueGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {calcData.hasCapitalData ? `${calcData.step1_valueGain >= 0 ? '+' : ''}₺${calcData.step1_valueGain.toLocaleString('tr-TR')}` : '₺0'}
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-white/5">
            <span className="text-slate-300 font-sans font-medium flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold font-mono">2</span>
              <span>Klasik Muhasebe Bilançosu [Değer Kazancı - C]:</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">
                (₺{calcData.step1_valueGain.toLocaleString('tr-TR')} - ₺{calcData.C_totalExpenses.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}) =
              </span>
              <span className={`font-bold ${calcData.step2_classicalAccounting >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {calcData.step2_classicalAccounting >= 0 ? '+' : ''}₺{calcData.step2_classicalAccounting.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                <span className="text-[10px] font-normal text-slate-400 ml-1 font-sans">(Kağıt üzerinde nakit kaybı)</span>
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
            <span className="text-white font-sans font-bold flex items-center gap-1.5 text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold font-mono">3</span>
              <span>Gerçek Ekonomik Kâr [Klasik Bilanço + D Fırsat Maliyeti]:</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">
                (₺{calcData.step2_classicalAccounting.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} + ₺{calcData.D_opportunityCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}) =
              </span>
              <span className={`text-base font-black ${calcData.step3_realEconomicProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {calcData.step3_realEconomicProfit >= 0 ? '+' : ''}₺{calcData.step3_realEconomicProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Step 4: Executive Financial Commentary */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200/90 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wider text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>4. Adım: Finansal Sonuç & Yorum</span>
          </div>
          <p>
            Klasik muhasebe mantığıyla bakıldığında araç işletmesi için toplam <strong className="text-white">₺{calcData.C_totalExpenses.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> harcanmış ve kağıt üzerinde <strong className="text-rose-300">{calcData.step2_classicalAccounting < 0 ? `-₺${Math.abs(calcData.step2_classicalAccounting).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} zarar` : `+₺${calcData.step2_classicalAccounting.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kâr`}</strong> görünmektedir.
          </p>
          <p>
            Ancak bu araç olmasaydı, aynı <strong className="text-white">{calcData.distanceTraveled.toLocaleString('tr-TR')} KM</strong> mesafeyi kat etmek için başkalarına (taksi, otobüs, kiralık araç) ödenecek olan <strong className="text-amber-300 font-bold">₺{calcData.D_opportunityCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> tutarındaki <strong>Fırsat Maliyeti</strong> doğrudan cebinizde kalmıştır. Kağıt üzerindeki nakit kaybı, havaya gidecek olan bu ulaşım masrafından kurtarıldığı için <strong className="text-white font-bold">Gerçek Ekonomik Bilançonuz</strong>:
          </p>
          <div className="pt-1 flex items-center gap-2 font-mono font-black text-sm">
            <span className={calcData.step3_realEconomicProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {calcData.step3_realEconomicProfit >= 0
                ? `NET +₺${calcData.step3_realEconomicProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} GERÇEK EKONOMİK KÂR / SERVET KAZANCI`
                : `NET -₺${Math.abs(calcData.step3_realEconomicProfit).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} GERÇEK EKONOMİK ZARAR`}
            </span>
          </div>
        </div>
      </div>

      {/* Asset Valuation Balance Sheet (Aracın Güncel Değeri & Sermaye Değişimi) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              5. Varlık Değerleme ve Net Sermaye Durumu
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Eldeki Aracın Güncel Nakit Karşılığı
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Market Value Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
              Aracın Güncel Değeri
            </span>
            <p className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              {Number(currentVal) > 0 ? `₺${Number(currentVal).toLocaleString('tr-TR')}` : 'Belirtilmedi'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Bugün satsanız elde edeceğiniz tahmini tutar
            </p>
          </div>

          {/* Capital Gain Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nominal Değer Değişimi
            </span>
            {calcData.hasCapitalData ? (
              <>
                <p
                  className={`text-xl font-black font-mono ${
                    calcData.capitalAppreciation >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {calcData.capitalAppreciation >= 0 ? '+' : ''}₺
                  {calcData.capitalAppreciation.toLocaleString('tr-TR')}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Alış: ₺{Number(purchasePr).toLocaleString('tr-TR')} → Güncel: ₺{Number(currentVal).toLocaleString('tr-TR')}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-400 font-mono mt-1">
                  Alış fiyatı girilmedi
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Alış fiyatı girildiğinde sermaye kârı hesaplanır
                </p>
              </>
            )}
          </div>

          {/* Net Asset After Operating Expenses */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 block mb-1">
              Net Varlık Değeri (Masraflar Sonrası)
            </span>
            <p className="text-xl font-black font-mono text-indigo-700 dark:text-indigo-300">
              {Number(currentVal) > 0
                ? `₺${Math.max(0, Number(currentVal) - calcData.totalVehicleOperatingCost).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`
                : '---'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Güncel Değer - Toplam Masraflar
            </p>
          </div>
        </div>
      </div>

      {/* Explanatory Formula & Methodology Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Bu Hesaplama Nasıl Yapılıyor?</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
          <p>
            <strong>1. Katedilen Yol:</strong> Aracınızın mevcut kilometresinden ilk satın aldığınızdaki kilometre çıkarılarak araçla kat ettiğiniz gerçek toplam mesafe ({calcData.distanceTraveled.toLocaleString('tr-TR')} KM) belirlenir.
          </p>
          <p>
            <strong>2. Yakıt Harcaması:</strong> Kat edilen toplam mesafe, belirlediğiniz ortalama yakıt birim fiyatı (₺{calcData.effectiveFuelRate.toFixed(2)}/KM) ile çarpılarak tüm yolun gerçekçi yakıt gideri (₺{calcData.totalFuelCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}) hesaplanır.
          </p>
          <p>
            <strong>3. Bakım & Masraflar:</strong> Servis ve onarım faturaları yakıt harcamasına eklenerek toplam araç gideriniz bulunur.
          </p>
          <p>
            <strong>4. Arabasız Alternatif:</strong> Aynı mesafeyi kendi aracınız olmadan taksi, paylaşımlı araç veya toplu taşıma ile kat etseydiniz ortaya çıkacak alternatif fatura ile karşılaştırılıp kâr/zarar belirlenir.
          </p>
        </div>
      </div>
    </div>
  );
};
