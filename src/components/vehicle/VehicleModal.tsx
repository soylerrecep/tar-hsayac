import React, { useState, useEffect } from 'react';
import { X, Car, Hash, Calendar, Gauge, Fuel, Palette, FileText, Check, DollarSign, TrendingUp } from 'lucide-react';
import { Vehicle, VehicleFuelType } from '../../types';

interface VehicleModalProps {
  isOpen: boolean;
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSave: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const COLOR_OPTIONS = [
  { name: 'Mavi', hex: '#3b82f6' },
  { name: 'Kırmızı', hex: '#ef4444' },
  { name: 'Yeşil', hex: '#10b981' },
  { name: 'Mor', hex: '#8b5cf6' },
  { name: 'Sarı/Kehribar', hex: '#f59e0b' },
  { name: 'Siyah/Koyu', hex: '#334155' },
  { name: 'Turkuaz', hex: '#06b6d4' },
];

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  vehicle,
  onClose,
  onSave,
}) => {
  const [brand, setBrand] = useState(vehicle?.brand || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [year, setYear] = useState<string>(vehicle?.year ? String(vehicle.year) : String(new Date().getFullYear()));
  const [plateNumber, setPlateNumber] = useState(vehicle?.plateNumber || '');
  const [fuelType, setFuelType] = useState<VehicleFuelType>(vehicle?.fuelType || 'gasoline');
  const [currentOdometer, setCurrentOdometer] = useState<string>(
    vehicle?.currentOdometer !== undefined && vehicle.currentOdometer !== null
      ? String(vehicle.currentOdometer)
      : ''
  );
  const [purchaseOdometer, setPurchaseOdometer] = useState<string>(
    vehicle?.purchaseOdometer !== undefined && vehicle.purchaseOdometer !== null
      ? String(vehicle.purchaseOdometer)
      : ''
  );
  const [purchasePrice, setPurchasePrice] = useState<string>(
    vehicle?.purchasePrice !== undefined && vehicle.purchasePrice !== null
      ? String(vehicle.purchasePrice)
      : ''
  );
  const [currentMarketValue, setCurrentMarketValue] = useState<string>(
    vehicle?.currentMarketValue !== undefined && vehicle.currentMarketValue !== null
      ? String(vehicle.currentMarketValue)
      : ''
  );
  const [averageFuelCostPerKm, setAverageFuelCostPerKm] = useState<string>(
    vehicle?.averageFuelCostPerKm !== undefined && vehicle.averageFuelCostPerKm !== null
      ? String(vehicle.averageFuelCostPerKm)
      : ''
  );
  const [color, setColor] = useState(vehicle?.color || '#3b82f6');
  const [notes, setNotes] = useState(vehicle?.notes || '');

  useEffect(() => {
    if (isOpen) {
      setBrand(vehicle?.brand || '');
      setModel(vehicle?.model || '');
      setYear(vehicle?.year ? String(vehicle.year) : String(new Date().getFullYear()));
      setPlateNumber(vehicle?.plateNumber || '');
      setFuelType(vehicle?.fuelType || 'gasoline');
      setCurrentOdometer(
        vehicle?.currentOdometer !== undefined && vehicle.currentOdometer !== null
          ? String(vehicle.currentOdometer)
          : ''
      );
      setPurchaseOdometer(
        vehicle?.purchaseOdometer !== undefined && vehicle.purchaseOdometer !== null
          ? String(vehicle.purchaseOdometer)
          : ''
      );
      setPurchasePrice(
        vehicle?.purchasePrice !== undefined && vehicle.purchasePrice !== null
          ? String(vehicle.purchasePrice)
          : ''
      );
      setCurrentMarketValue(
        vehicle?.currentMarketValue !== undefined && vehicle.currentMarketValue !== null
          ? String(vehicle.currentMarketValue)
          : ''
      );
      setAverageFuelCostPerKm(
        vehicle?.averageFuelCostPerKm !== undefined && vehicle.averageFuelCostPerKm !== null
          ? String(vehicle.averageFuelCostPerKm)
          : ''
      );
      setColor(vehicle?.color || '#3b82f6');
      setNotes(vehicle?.notes || '');
    }
  }, [isOpen, vehicle]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim() || !plateNumber.trim()) return;

    onSave({
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year) || new Date().getFullYear(),
      plateNumber: plateNumber.trim().toUpperCase(),
      fuelType,
      currentOdometer: Number(currentOdometer) || 0,
      purchaseOdometer: purchaseOdometer ? Number(purchaseOdometer) : undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      currentMarketValue: currentMarketValue ? Number(currentMarketValue) : undefined,
      averageFuelCostPerKm: averageFuelCostPerKm ? Number(averageFuelCostPerKm) : undefined,
      color,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div
      id="vehicle-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="vehicle-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {vehicle ? 'Aracı Düzenle' : 'Yeni Araç Ekle'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Garaajınıza araç ekleyip yakıt ve bakımlarını takip edin
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
          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Marka <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Renault, Toyota, VW"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Model / Versiyon <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Megane 1.5 dCi"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Plate & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Plaka <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="34 ABC 123"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Model Yılı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={1970}
                  max={2030}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Fuel Type & Current Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Yakıt Tipi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Fuel className="w-4 h-4" />
                </div>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as VehicleFuelType)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="gasoline">Benzin</option>
                  <option value="diesel">Dizel / Motorin</option>
                  <option value="lpg">LPG & Benzin</option>
                  <option value="hybrid">Hibrit (Hybrid)</option>
                  <option value="electric">Elektrikli (EV)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Güncel Kilometre (KM)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="85000"
                  value={currentOdometer}
                  onChange={(e) => setCurrentOdometer(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Kâr / Zarar & Finansal Değerleme Bilgileri */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950 dark:text-indigo-200">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Finansal & Kâr / Zarar Hesaplama Bilgileri</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alış Kilometresi (KM)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Gauge className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    placeholder="Örn: 50000"
                    value={purchaseOdometer}
                    onChange={(e) => setPurchaseOdometer(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alış Fiyatı (₺) <span className="text-[10px] text-slate-400 font-normal">(opsiyonel)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    placeholder="Örn: 600000"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Güncel Değeri (₺)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    placeholder="Örn: 850000"
                    value={currentMarketValue}
                    onChange={(e) => setCurrentMarketValue(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ort. Yakıt (₺/KM) <span className="text-[10px] text-slate-400 font-normal">(opsiyonel)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Fuel className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    placeholder="Örn: 2.80"
                    value={averageFuelCostPerKm}
                    onChange={(e) => setAverageFuelCostPerKm(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold text-amber-600 dark:text-amber-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Aracı satın aldığınızdaki KM, güncel piyasa değeri ve ortalama yakıt maliyeti (₺/KM) ile kat edilen tüm yolun kâr/zarar ve arabasız alternatif ulaşım hesabı yapılır.
            </p>
          </div>

          {/* Color Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Araç Vurgu Rengi</span>
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    color === c.hex ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {color === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Notlar / Şasi No / Detaylar</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ruhsat, şasi numarası, sigorta acente notları..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
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
              className="flex-1 py-3 px-4 rounded-full text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              {vehicle ? 'Güncelle' : 'Garaaja Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
