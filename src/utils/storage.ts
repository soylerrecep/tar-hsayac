import { CounterItem, Vehicle, FuelLog, MaintenanceLog, OdometerLog } from '../types';

const STORAGE_KEY = 'tarih_sayac_items_v2';
const BACKUP_STORAGE_KEY = 'tarih_sayac_backup_v2';
const SETTINGS_KEY = 'tarih_sayac_settings';

const VEHICLES_KEY = 'tarih_sayac_vehicles_v1';
const VEHICLES_BACKUP_KEY = 'tarih_sayac_vehicles_backup_v1';
const FUEL_LOGS_KEY = 'tarih_sayac_fuel_logs_v1';
const FUEL_LOGS_BACKUP_KEY = 'tarih_sayac_fuel_logs_backup_v1';
const MAINT_LOGS_KEY = 'tarih_sayac_maint_logs_v1';
const MAINT_LOGS_BACKUP_KEY = 'tarih_sayac_maint_logs_backup_v1';
const ODOMETER_LOGS_KEY = 'tarih_sayac_odometer_logs_v1';
const ODOMETER_LOGS_BACKUP_KEY = 'tarih_sayac_odometer_logs_backup_v1';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  hapticEnabled: boolean;
  lastBackupDate?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  soundEnabled: true,
  hapticEnabled: true,
};

/**
 * Sample vehicles pre-populated for initial experience
 */
export function getDefaultSampleVehicles(): Vehicle[] {
  return [
    {
      id: 'vehicle-sample-1',
      brand: 'Renault',
      model: 'Megane 4 1.5 dCi Touch',
      year: 2021,
      plateNumber: '34 ABC 789',
      fuelType: 'diesel',
      currentOdometer: 87400,
      purchaseOdometer: 65000,
      purchasePrice: 580000,
      currentMarketValue: 850000,
      alternativeCostPerKm: 12,
      averageFuelCostPerKm: 2.75,
      color: '#3b82f6',
      notes: 'Rutin bakımları yetkili ve özel serviste düzenli yapılıyor.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getDefaultSampleFuelLogs(): FuelLog[] {
  const now = new Date();
  const d1 = new Date(now.getTime() - 12 * 86400000).toISOString();
  const d2 = new Date(now.getTime() - 28 * 86400000).toISOString();
  const d3 = new Date(now.getTime() - 45 * 86400000).toISOString();

  return [
    {
      id: 'fuel-1',
      vehicleId: 'vehicle-sample-1',
      date: d1,
      odometer: 87400,
      fuelLiters: 42,
      totalCost: 1950,
      pricePerLiter: 46.42,
      isFullTank: true,
      station: 'Opet',
      notes: 'Şehir içi kullanım - Full depo',
    },
    {
      id: 'fuel-2',
      vehicleId: 'vehicle-sample-1',
      date: d2,
      odometer: 86600,
      fuelLiters: 44,
      totalCost: 2020,
      pricePerLiter: 45.9,
      isFullTank: true,
      station: 'Shell V-Power',
      notes: 'Otoban sürüşü sonrası',
    },
    {
      id: 'fuel-3',
      vehicleId: 'vehicle-sample-1',
      date: d3,
      odometer: 85800,
      fuelLiters: 45,
      totalCost: 2040,
      pricePerLiter: 45.33,
      isFullTank: true,
      station: 'Opet',
      notes: 'Uzun yol çıkışı',
    },
  ];
}

export function getDefaultSampleMaintenanceLogs(): MaintenanceLog[] {
  const now = new Date();
  const d1 = new Date(now.getTime() - 60 * 86400000).toISOString();
  const d2 = new Date(now.getTime() - 210 * 86400000).toISOString();

  return [
    {
      id: 'maint-1',
      vehicleId: 'vehicle-sample-1',
      date: d1,
      odometer: 85000,
      title: '85.000 KM Periyodik Yağ & Filtre Bakımı',
      serviceType: 'periyodik',
      cost: 4500,
      provider: 'Bosch Car Service',
      partsReplaced: '5W-30 Castrol Motor Yağı, Yağ Filtresi, Hava Filtresi, Polen Filtresi',
      nextServiceKm: 95000,
      nextServiceDate: '2027-02-15',
      notes: 'Genel periyodik kontrol yapıldı, tüm sıvı seviyeleri tamamlandı.',
    },
    {
      id: 'maint-2',
      vehicleId: 'vehicle-sample-1',
      date: d2,
      odometer: 75000,
      title: 'Ön Fren Balataları & Fren Hidroliği Değişimi',
      serviceType: 'fren',
      cost: 2800,
      provider: 'Özel Oto Fren Servisi',
      partsReplaced: 'TRW Ön Fren Balataları Seti, Dot4 Fren Hidroliği',
      notes: 'Ön diskler temizlendi, balata sesi giderildi.',
    },
  ];
}

export function getDefaultSampleOdometerLogs(): OdometerLog[] {
  const now = new Date();
  return [
    {
      id: 'odo-1',
      vehicleId: 'vehicle-sample-1',
      date: now.toISOString(),
      odometer: 87400,
      notes: 'Güncel kilometre kontrolü',
    },
  ];
}

// ================= VEHICLE STORAGE =================

export function loadVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Check backup key
    const backupRaw = localStorage.getItem(VEHICLES_BACKUP_KEY);
    if (backupRaw !== null) {
      const parsedBackup = JSON.parse(backupRaw);
      if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
        saveVehicles(parsedBackup);
        return parsedBackup;
      }
    }
    // Initial sample fallback if empty
    if (raw === null && backupRaw === null) {
      const samples = getDefaultSampleVehicles();
      saveVehicles(samples);
      return samples;
    }
  } catch (err) {
    console.error('Error loading vehicles', err);
  }
  return [];
}

export function saveVehicles(vehicles: Vehicle[]): void {
  if (typeof window === 'undefined') return;
  try {
    const dataStr = JSON.stringify(vehicles);
    localStorage.setItem(VEHICLES_KEY, dataStr);
    localStorage.setItem(VEHICLES_BACKUP_KEY, dataStr);
  } catch (err) {
    console.error('Error saving vehicles', err);
  }
}

// ================= FUEL LOGS STORAGE =================

export function loadFuelLogs(): FuelLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FUEL_LOGS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const backupRaw = localStorage.getItem(FUEL_LOGS_BACKUP_KEY);
    if (backupRaw !== null) {
      const parsedBackup = JSON.parse(backupRaw);
      if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
        saveFuelLogs(parsedBackup);
        return parsedBackup;
      }
    }
    if (raw === null && backupRaw === null) {
      const samples = getDefaultSampleFuelLogs();
      saveFuelLogs(samples);
      return samples;
    }
  } catch (err) {
    console.error('Error loading fuel logs', err);
  }
  return [];
}

export function saveFuelLogs(logs: FuelLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    const dataStr = JSON.stringify(logs);
    localStorage.setItem(FUEL_LOGS_KEY, dataStr);
    localStorage.setItem(FUEL_LOGS_BACKUP_KEY, dataStr);
  } catch (err) {
    console.error('Error saving fuel logs', err);
  }
}

// ================= MAINTENANCE LOGS STORAGE =================

export function loadMaintenanceLogs(): MaintenanceLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MAINT_LOGS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const backupRaw = localStorage.getItem(MAINT_LOGS_BACKUP_KEY);
    if (backupRaw !== null) {
      const parsedBackup = JSON.parse(backupRaw);
      if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
        saveMaintenanceLogs(parsedBackup);
        return parsedBackup;
      }
    }
    if (raw === null && backupRaw === null) {
      const samples = getDefaultSampleMaintenanceLogs();
      saveMaintenanceLogs(samples);
      return samples;
    }
  } catch (err) {
    console.error('Error loading maintenance logs', err);
  }
  return [];
}

export function saveMaintenanceLogs(logs: MaintenanceLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    const dataStr = JSON.stringify(logs);
    localStorage.setItem(MAINT_LOGS_KEY, dataStr);
    localStorage.setItem(MAINT_LOGS_BACKUP_KEY, dataStr);
  } catch (err) {
    console.error('Error saving maintenance logs', err);
  }
}

// ================= ODOMETER LOGS STORAGE =================

export function loadOdometerLogs(): OdometerLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ODOMETER_LOGS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const backupRaw = localStorage.getItem(ODOMETER_LOGS_BACKUP_KEY);
    if (backupRaw !== null) {
      const parsedBackup = JSON.parse(backupRaw);
      if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
        saveOdometerLogs(parsedBackup);
        return parsedBackup;
      }
    }
    if (raw === null && backupRaw === null) {
      const samples = getDefaultSampleOdometerLogs();
      saveOdometerLogs(samples);
      return samples;
    }
  } catch (err) {
    console.error('Error loading odometer logs', err);
  }
  return [];
}

export function saveOdometerLogs(logs: OdometerLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    const dataStr = JSON.stringify(logs);
    localStorage.setItem(ODOMETER_LOGS_KEY, dataStr);
    localStorage.setItem(ODOMETER_LOGS_BACKUP_KEY, dataStr);
  } catch (err) {
    console.error('Error saving odometer logs', err);
  }
}


/**
 * Gets default initial sample counters for first time users
 * Pre-populates common car insurance, maintenance, TÜVTÜRK inspection, birthday reminders.
 */
export function getDefaultSampleCounters(): CounterItem[] {
  const now = new Date();
  
  // Insurance 25 days from now
  const insuranceDate = new Date(now);
  insuranceDate.setDate(insuranceDate.getDate() + 25);

  // Inspection 110 days from now
  const muayeneDate = new Date(now);
  muayeneDate.setDate(muayeneDate.getDate() + 110);

  // Maintenance 180 days ago (elapsed)
  const bakimDate = new Date(now);
  bakimDate.setDate(bakimDate.getDate() - 145);

  // Passport 240 days from now
  const pasaportDate = new Date(now);
  pasaportDate.setDate(pasaportDate.getDate() + 240);

  return [
    {
      id: 'sample-1',
      title: 'Arabamın Trafik Sigortası',
      description: 'Poliçe yenileme zamanı yaklaşıyor. Kasko & Trafik Teklifi Al.',
      category: 'car',
      mode: 'countdown',
      startDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString(),
      targetDate: insuranceDate.toISOString().split('T')[0] + 'T09:00',
      autoRenewYears: 1,
      reminders: [
        { enabled: true, daysBefore: 30, notified: false },
        { enabled: true, daysBefore: 15, notified: false },
        { enabled: true, daysBefore: 7, notified: false },
        { enabled: true, daysBefore: 1, notified: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: '#3b82f6', // blue
      notes: 'Acenteden en uygun teklifi almak için 15 gün kala iletişime geç.',
    },
    {
      id: 'sample-2',
      title: 'Araç TÜVTÜRK Muayenesi',
      description: 'Egzoz emisyonu ve araç periyodik randevusu al.',
      category: 'car',
      mode: 'countdown',
      startDate: new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString(),
      targetDate: muayeneDate.toISOString().split('T')[0] + 'T10:30',
      autoRenewYears: 2,
      reminders: [
        { enabled: true, daysBefore: 30, notified: false },
        { enabled: true, daysBefore: 7, notified: false },
        { enabled: true, daysBefore: 1, notified: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: '#f59e0b', // amber
      notes: 'Randevu E-Devlet veya TÜVTÜRK sitesinden 14 gün önce açılıyor.',
    },
    {
      id: 'sample-3',
      title: 'En Son Araç Yağ & Bakımı',
      description: 'Motor yağı, filtreler ve genel kontrol en son ne zaman yapıldı?',
      category: 'car',
      mode: 'elapsed',
      targetDate: bakimDate.toISOString().split('T')[0] + 'T09:00',
      autoRenewMonths: 12,
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: '#10b981', // emerald
      notes: 'Serviste 10.000 KM veya 1 yıl dolunca tekrar git.',
    },
    {
      id: 'sample-4',
      title: 'Pasaport Süresi Sonu',
      description: '10 Yıllık hususi pasaport son geçerlilik tarihi',
      category: 'personal',
      mode: 'countdown',
      targetDate: pasaportDate.toISOString().split('T')[0] + 'T00:00',
      autoRenewYears: 10,
      reminders: [
        { enabled: true, daysBefore: 60, notified: false },
        { enabled: true, daysBefore: 30, notified: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: '#8b5cf6', // purple
    },
  ];
}

/**
 * Loads counter items from localStorage with fallback & auto-recovery backup
 */
export function loadCounterItems(): CounterItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check backup key
      const backupRaw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (backupRaw) {
        const parsedBackup = JSON.parse(backupRaw);
        if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
          saveCounterItems(parsedBackup);
          return parsedBackup;
        }
      }

      // First run default samples
      const samples = getDefaultSampleCounters();
      saveCounterItems(samples);
      return samples;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error('Error loading counters from localStorage', error);
  }

  const fallback = getDefaultSampleCounters();
  saveCounterItems(fallback);
  return fallback;
}

/**
 * Saves counter items to primary key AND secondary backup key for high durability
 */
export function saveCounterItems(items: CounterItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    const dataStr = JSON.stringify(items);
    localStorage.setItem(STORAGE_KEY, dataStr);
    // Double write for fail-safe data protection
    localStorage.setItem(BACKUP_STORAGE_KEY, dataStr);
  } catch (error) {
    console.error('Error saving counters to localStorage', error);
  }
}

/**
 * Exports all application data (Counters & Aracım: Vehicles, Fuel, Maintenance, Odometer)
 * as a well-structured JSON file download for backup.
 */
export function exportDataAsJSON(
  items: CounterItem[],
  vehicles?: Vehicle[],
  fuelLogs?: FuelLog[],
  maintLogs?: MaintenanceLog[],
  odometerLogs?: OdometerLog[]
): void {
  const vList = vehicles !== undefined ? vehicles : loadVehicles();
  const fList = fuelLogs !== undefined ? fuelLogs : loadFuelLogs();
  const mList = maintLogs !== undefined ? maintLogs : loadMaintenanceLogs();
  const oList = odometerLogs !== undefined ? odometerLogs : loadOdometerLogs();

  const exportPayload = {
    appName: 'Tarih Sayaç & Araç Takibi',
    version: '4.0',
    exportDate: new Date().toISOString(),
    summary: {
      counterCount: items.length,
      vehicleCount: vList.length,
      fuelLogCount: fList.length,
      maintenanceLogCount: mList.length,
      odometerLogCount: oList.length,
    },
    // Top-level counts for easy inspection & backward compatibility
    itemCount: items.length,
    vehicleCount: vList.length,
    fuelLogCount: fList.length,
    maintenanceLogCount: mList.length,
    odometerLogCount: oList.length,
    // Full datasets
    counters: items,
    vehicles: vList,
    fuelLogs: fList,
    maintenanceLogs: mList,
    odometerLogs: oList,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  
  const dateSuffix = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `tarih_sayac_ve_arac_tam_yedek_${dateSuffix}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Imports JSON string back into counter list and vehicle list with deep schema validation
 */
export function parseAndImportJSON(jsonContent: string): {
  success: boolean;
  count: number;
  vehicleCount: number;
  fuelCount: number;
  maintCount: number;
  odometerCount: number;
  items?: CounterItem[];
  vehicles?: Vehicle[];
  fuelLogs?: FuelLog[];
  maintenanceLogs?: MaintenanceLog[];
  odometerLogs?: OdometerLog[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonContent);
    let itemsToImport: CounterItem[] = [];
    let vehiclesToImport: Vehicle[] = [];
    let fuelLogsToImport: FuelLog[] = [];
    let maintLogsToImport: MaintenanceLog[] = [];
    let odoLogsToImport: OdometerLog[] = [];

    if (Array.isArray(parsed)) {
      // Legacy counter-only array backup
      itemsToImport = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // Counters / items
      if (Array.isArray(parsed.counters)) itemsToImport = parsed.counters;
      else if (Array.isArray(parsed.items)) itemsToImport = parsed.items;

      // Vehicles / cars
      if (Array.isArray(parsed.vehicles)) vehiclesToImport = parsed.vehicles;
      else if (Array.isArray(parsed.cars)) vehiclesToImport = parsed.cars;

      // Fuel logs / fuels
      if (Array.isArray(parsed.fuelLogs)) fuelLogsToImport = parsed.fuelLogs;
      else if (Array.isArray(parsed.fuels)) fuelLogsToImport = parsed.fuels;

      // Maintenance logs / maintLogs
      if (Array.isArray(parsed.maintenanceLogs)) maintLogsToImport = parsed.maintenanceLogs;
      else if (Array.isArray(parsed.maintLogs)) maintLogsToImport = parsed.maintLogs;
      else if (Array.isArray(parsed.maintenances)) maintLogsToImport = parsed.maintenances;

      // Odometer logs / odoLogs
      if (Array.isArray(parsed.odometerLogs)) odoLogsToImport = parsed.odometerLogs;
      else if (Array.isArray(parsed.odoLogs)) odoLogsToImport = parsed.odoLogs;
      else if (Array.isArray(parsed.odometers)) odoLogsToImport = parsed.odometers;
    } else {
      return {
        success: false,
        count: 0,
        vehicleCount: 0,
        fuelCount: 0,
        maintCount: 0,
        odometerCount: 0,
        error: 'Geçersiz dosya formatı.',
      };
    }

    // Validate essential properties
    const validItems = itemsToImport.filter(
      (item) => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.targetDate === 'string'
    );
    const validVehicles = vehiclesToImport.filter(
      (v) => v && typeof v.id === 'string' && typeof v.brand === 'string'
    );
    const validFuelLogs = fuelLogsToImport.filter(
      (f) => f && typeof f.id === 'string' && typeof f.vehicleId === 'string'
    );
    const validMaintLogs = maintLogsToImport.filter(
      (m) => m && typeof m.id === 'string' && typeof m.vehicleId === 'string'
    );
    const validOdoLogs = odoLogsToImport.filter(
      (o) => o && typeof o.id === 'string' && typeof o.vehicleId === 'string'
    );

    const hasAnyData =
      validItems.length > 0 ||
      validVehicles.length > 0 ||
      validFuelLogs.length > 0 ||
      validMaintLogs.length > 0 ||
      validOdoLogs.length > 0;

    if (!hasAnyData) {
      return {
        success: false,
        count: 0,
        vehicleCount: 0,
        fuelCount: 0,
        maintCount: 0,
        odometerCount: 0,
        error: 'Dosyada geçerli sayaç veya araç verisi bulunamadı.',
      };
    }

    // Persist immediately to localStorage
    if (validItems.length > 0) saveCounterItems(validItems);
    if (validVehicles.length > 0) saveVehicles(validVehicles);
    if (validFuelLogs.length > 0) saveFuelLogs(validFuelLogs);
    if (validMaintLogs.length > 0) saveMaintenanceLogs(validMaintLogs);
    if (validOdoLogs.length > 0) saveOdometerLogs(validOdoLogs);

    return {
      success: true,
      count: validItems.length,
      vehicleCount: validVehicles.length,
      fuelCount: validFuelLogs.length,
      maintCount: validMaintLogs.length,
      odometerCount: validOdoLogs.length,
      items: validItems,
      vehicles: validVehicles,
      fuelLogs: validFuelLogs,
      maintenanceLogs: validMaintLogs,
      odometerLogs: validOdoLogs,
    };
  } catch {
    return {
      success: false,
      count: 0,
      vehicleCount: 0,
      fuelCount: 0,
      maintCount: 0,
      odometerCount: 0,
      error: 'JSON dosyası okunamadı. Lütfen geçerli bir yedek dosyası seçin.',
    };
  }
}

/**
 * Load settings from storage
 */
export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to storage
 */
export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
