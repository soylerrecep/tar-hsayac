import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { FuelLog } from '../../types';
import { TrendingUp, Fuel, DollarSign, Activity } from 'lucide-react';

interface FuelTrendChartProps {
  logs: FuelLog[];
}

interface FuelChartPoint {
  dateStr: string;
  rawDate: string;
  odometer: number;
  totalCost: number;
  fuelLiters: number;
  pricePerLiter: number;
  consumption: number | null;
  costPerKm: number | null;
  station?: string;
}

const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return isoString;
  }
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: FuelChartPoint = payload[0].payload;
    return (
      <div className="p-3.5 bg-slate-900/95 text-white rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[180px]">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 font-bold">
          <span className="text-amber-400">{data.dateStr}</span>
          <span className="font-mono text-slate-300">{data.odometer.toLocaleString('tr-TR')} KM</span>
        </div>
        {data.station && (
          <div className="text-[10px] text-slate-400 font-semibold">{data.station}</div>
        )}
        <div className="space-y-1 pt-1 text-slate-200">
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-400">Toplam Tutar:</span>
            <strong className="text-emerald-400 font-mono">₺{data.totalCost.toLocaleString('tr-TR')}</strong>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-400">Alınan Miktar:</span>
            <strong className="text-amber-300 font-mono">{data.fuelLiters} L</strong>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-400">Litre Fiyatı:</span>
            <strong className="text-blue-300 font-mono">₺{data.pricePerLiter.toFixed(2)}</strong>
          </div>
          {data.consumption !== null && (
            <div className="flex justify-between items-center border-t border-slate-800 pt-1 text-amber-400 font-bold">
              <span>Ort. Tüketim:</span>
              <strong className="font-mono text-sm">{data.consumption} L/100km</strong>
            </div>
          )}
          {data.costPerKm !== null && (
            <div className="flex justify-between items-center text-emerald-400 font-bold">
              <span>KM Başı Maliyet:</span>
              <strong className="font-mono text-sm">₺{data.costPerKm.toFixed(2)} / KM</strong>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const FuelTrendChart: React.FC<FuelTrendChartProps> = ({ logs }) => {
  const [metricMode, setMetricMode] = useState<'consumption' | 'cost'>('consumption');

  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const sorted = [...logs].sort((a, b) => a.odometer - b.odometer);
    const result: FuelChartPoint[] = [];

    let lastFullTankLog: FuelLog | null = null;

    sorted.forEach((log) => {
      let consumption: number | null = null;
      let costPerKm: number | null = null;

      if (log.isFullTank && lastFullTankLog && log.odometer > lastFullTankLog.odometer) {
        const distance = log.odometer - lastFullTankLog.odometer;
        if (distance > 0) {
          const lPer100 = (log.fuelLiters / distance) * 100;
          if (lPer100 >= 2 && lPer100 <= 35) {
            consumption = Number(lPer100.toFixed(2));
          }
          const cPerKm = log.totalCost / distance;
          if (cPerKm > 0 && cPerKm < 60) {
            costPerKm = Number(cPerKm.toFixed(2));
          }
        }
      }

      if (log.isFullTank) {
        lastFullTankLog = log;
      }

      const pricePerLiter =
        log.pricePerLiter || (log.fuelLiters > 0 ? log.totalCost / log.fuelLiters : 0);

      result.push({
        dateStr: formatDate(log.date),
        rawDate: log.date,
        odometer: log.odometer,
        totalCost: log.totalCost,
        fuelLiters: log.fuelLiters,
        pricePerLiter: Number(pricePerLiter.toFixed(2)),
        consumption,
        costPerKm,
        station: log.station,
      });
    });

    return result;
  }, [logs]);

  if (chartData.length < 2) {
    return (
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
        <Activity className="w-8 h-8 text-amber-500/60 mx-auto" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
          Yakıt tüketim grafiğini görüntülemek için en az 2 adet yakıt alım kaydı gereklidir.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              Yakıt Tüketim & Maliyet Trendi
            </h3>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Zaman içerisindeki performans ve harcama analizi
            </p>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          <button
            onClick={() => setMetricMode('consumption')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              metricMode === 'consumption'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Tüketim (L/100km & ₺/KM)</span>
          </button>

          <button
            onClick={() => setMetricMode('cost')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              metricMode === 'cost'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Harcama (₺ & ₺/L)</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {metricMode === 'consumption' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
              <XAxis
                dataKey="dateStr"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e140' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#d97706' }}
                tickLine={false}
                axisLine={false}
                unit=" L"
                domain={['auto', 'auto']}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#10b981' }}
                tickLine={false}
                axisLine={false}
                unit=" ₺"
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="consumption"
                name="Ort. Tüketim (L/100km)"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#d97706' }}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="costPerKm"
                name="KM Maliyeti (₺/KM)"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#059669' }}
                connectNulls
              />
            </LineChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
              <XAxis
                dataKey="dateStr"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e140' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#059669' }}
                tickLine={false}
                axisLine={false}
                unit=" ₺"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#2563eb' }}
                tickLine={false}
                axisLine={false}
                unit=" ₺/L"
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalCost"
                name="Toplam Harcama (₺)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#047857' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pricePerLiter"
                name="Litre Fiyatı (₺/L)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#1d4ed8' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
