export type CategoryType = 'car' | 'health' | 'home' | 'finance' | 'personal' | 'work' | 'other';

export type CounterMode = 'countdown' | 'elapsed';

export interface ReminderSetting {
  enabled: boolean;
  daysBefore: number; // e.g. 30, 15, 7, 3, 1, 0
  notified: boolean; // tracks if already notified for this cycle
}

export interface CounterItem {
  id: string;
  title: string;
  description?: string;
  category: CategoryType;
  mode: CounterMode; // 'countdown' = Kalan Süre, 'elapsed' = Geçen Süre
  targetDate: string; // ISO string YYYY-MM-DD or YYYY-MM-DDTHH:mm
  startDate?: string; // ISO string for progress calculation (optional)
  autoRenewYears?: number; // e.g., 1 year for insurance
  autoRenewMonths?: number; // e.g., 6 months for maintenance
  reminders: ReminderSetting[];
  createdAt: string;
  updatedAt: string;
  completedCycles?: number; // How many times auto-renewed/completed
  notes?: string;
  color?: string; // Optional custom accent color
  order?: number; // El ile sıralama / manuel sıra indeksi
}

export type FilterType = 'all' | 'urgent' | 'countdown' | 'elapsed' | CategoryType;

export type SortType =
  | 'custom'
  | 'urgency'
  | 'date_asc'
  | 'date_desc'
  | 'title_asc'
  | 'title_desc'
  | 'created_desc'
  | 'created_asc';

export interface CounterTemplate {
  id: string;
  title: string;
  category: CategoryType;
  mode: CounterMode;
  defaultMonthsAhead?: number;
  defaultYearsAhead?: number;
  autoRenewYears?: number;
  autoRenewMonths?: number;
  iconName: string;
  description: string;
  suggestedReminders: number[]; // days before
}

// ==================== ARAÇ TAKİBİ (VEHICLE MODULE) ====================

export type VehicleFuelType = 'gasoline' | 'diesel' | 'lpg' | 'electric' | 'hybrid';

export interface Vehicle {
  id: string;
  brand: string;        // örn. Renault, VW, Toyota
  model: string;        // örn. Megane 4, Passat, Corolla
  year: number;         // örn. 2021
  plateNumber: string;  // örn. 34 ABC 789
  fuelType: VehicleFuelType;
  currentOdometer: number; // Güncel KM
  purchaseOdometer?: number; // İlk satın alındığındaki KM
  purchasePrice?: number;    // İlk satın alma fiyatı ₺ (opsiyonel)
  currentMarketValue?: number; // Güncel araç piyasa değeri ₺
  alternativeCostPerKm?: number; // Arabasız alternatif ulaşım birim km maliyeti ₺/KM
  averageFuelCostPerKm?: number; // Ortalama KM başı yakıt maliyeti / fiyatı ₺/KM (kâr/zarar hesabında kullanılan)
  color?: string;       // Tema/Araç Rengi
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;          // ISO string (YYYY-MM-DDTHH:mm)
  odometer: number;      // Depo doldurulduğu andaki KM
  fuelLiters: number;    // Alınan Yakıt Litre/kWh
  totalCost: number;     // Toplam Tutar ₺
  pricePerLiter: number; // Litre Fiyatı ₺
  isFullTank: boolean;   // Depo fulledi mi?
  station?: string;      // Opet, Shell, BP, Petrol Ofisi vs.
  notes?: string;
}

export type MaintenanceType = 'periyodik' | 'yag' | 'fren' | 'lastik' | 'aku' | 'muayene' | 'ariza' | 'diger';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;          // ISO string
  odometer: number;      // Bakım yapıldığı andaki KM
  title: string;         // örn. 90.000 KM Yağ & Filtre Değişimi
  serviceType: MaintenanceType;
  cost: number;          // Tutar ₺
  provider?: string;     // Yetkili Servis, Özel Usta vs.
  partsReplaced?: string;// Değişen Parçalar (örn. Motor yağı, Yağ filtresi)
  nextServiceKm?: number;  // Gelecek bakım KM sınırı (örn. 100.000 KM)
  nextServiceDate?: string;// Gelecek bakım tarihi (YYYY-MM-DD)
  notes?: string;
}

export interface OdometerLog {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  notes?: string;
}

