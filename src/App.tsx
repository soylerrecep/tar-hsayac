import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles, Clock, AlertTriangle, ShieldCheck, RefreshCw, Calendar, Car, HeartPulse, Bell, ListOrdered } from 'lucide-react';
import { CounterItem, FilterType, SortType, Vehicle, FuelLog, MaintenanceLog, MaintenanceType, OdometerLog } from './types';
import {
  loadCounterItems,
  saveCounterItems,
  loadSettings,
  saveSettings,
  getDefaultSampleCounters,
  loadVehicles,
  saveVehicles,
  getDefaultSampleVehicles,
  loadFuelLogs,
  saveFuelLogs,
  getDefaultSampleFuelLogs,
  loadMaintenanceLogs,
  saveMaintenanceLogs,
  getDefaultSampleMaintenanceLogs,
  loadOdometerLogs,
  saveOdometerLogs,
  getDefaultSampleOdometerLogs,
} from './utils/storage';
import { checkAndTriggerDueReminders, getNotificationPermissionState, playNotificationSound, triggerHaptic } from './utils/notifications';
import { calculateTimeDifference, getUrgencyLevel, calculateNextRenewalDate } from './utils/dateUtils';
import { Header, MainTabType } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { NotificationBanner } from './components/NotificationBanner';
import { CounterCard } from './components/CounterCard';
import { BentoHeroCard } from './components/BentoHeroCard';
import { CounterModal } from './components/CounterModal';
import { CounterDetailModal } from './components/CounterDetailModal';
import { CounterReorderModal } from './components/CounterReorderModal';
import { BackupModal } from './components/BackupModal';
import { ConfirmModal } from './components/ConfirmModal';
import { VehicleSection } from './components/vehicle/VehicleSection';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import confetti from 'canvas-confetti';

export default function App() {
  const [mainTab, setMainTab] = useState<MainTabType>('counters');

  // Counters State
  const [counters, setCounters] = useState<CounterItem[]>(() => loadCounterItems());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_counter_sort_preference') as SortType;
      if (saved) return saved;
    }
    return 'urgency';
  });

  // Vehicle States
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadVehicles());
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => loadFuelLogs());
  const [maintLogs, setMaintLogs] = useState<MaintenanceLog[]>(() => loadMaintenanceLogs());
  const [odometerLogs, setOdometerLogs] = useState<OdometerLog[]>(() => loadOdometerLogs());

  // Theme & Settings
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const settings = loadSettings();
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    getNotificationPermissionState()
  );

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<CounterItem | null>(null);
  const [selectedCounter, setSelectedCounter] = useState<CounterItem | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [counterToDelete, setCounterToDelete] = useState<CounterItem | null>(null);

  // Apply dark class to <html> tag for Tailwind dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    saveSettings({ ...loadSettings(), theme: nextDark ? 'dark' : 'light' });
  };

  // Auto-save counters and vehicle data whenever updated
  useEffect(() => {
    saveCounterItems(counters);
  }, [counters]);

  useEffect(() => {
    saveVehicles(vehicles);
  }, [vehicles]);

  useEffect(() => {
    saveFuelLogs(fuelLogs);
  }, [fuelLogs]);

  useEffect(() => {
    saveMaintenanceLogs(maintLogs);
  }, [maintLogs]);

  useEffect(() => {
    saveOdometerLogs(odometerLogs);
  }, [odometerLogs]);

  // Vehicle Handlers
  const handleAddVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `vehicle-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setVehicles((prev) => [newVehicle, ...prev]);
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles((prev) => prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)));
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    setFuelLogs((prev) => prev.filter((f) => f.vehicleId !== vehicleId));
    setMaintLogs((prev) => prev.filter((m) => m.vehicleId !== vehicleId));
    setOdometerLogs((prev) => prev.filter((o) => o.vehicleId !== vehicleId));
  };

  const handleAddFuelLog = (fuelData: Omit<FuelLog, 'id'>) => {
    const newFuelLog: FuelLog = {
      ...fuelData,
      id: `fuel-${Date.now()}`,
    };
    setFuelLogs((prev) => [newFuelLog, ...prev]);

    // Also update vehicle odometer if fuel log odometer is higher than current
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === fuelData.vehicleId && fuelData.odometer > v.currentOdometer) {
          return { ...v, currentOdometer: fuelData.odometer, updatedAt: new Date().toISOString() };
        }
        return v;
      })
    );
  };

  const handleUpdateFuelLog = (updatedLog: FuelLog) => {
    setFuelLogs((prev) => prev.map((f) => (f.id === updatedLog.id ? updatedLog : f)));

    // Recalculate or update vehicle odometer if this log's odometer is higher
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === updatedLog.vehicleId && updatedLog.odometer > v.currentOdometer) {
          return { ...v, currentOdometer: updatedLog.odometer, updatedAt: new Date().toISOString() };
        }
        return v;
      })
    );
  };

  const handleDeleteFuelLog = (fuelLogId: string) => {
    setFuelLogs((prev) => prev.filter((f) => f.id !== fuelLogId));
  };

const SERVICE_TYPE_CONFIG: Record<MaintenanceType, { label: string; color: string }> = {
  periyodik: { label: 'Periyodik Bakım', color: '#10b981' },
  yag: { label: 'Yağ & Filtre Bakımı', color: '#f59e0b' },
  fren: { label: 'Fren & Balata Bakımı', color: '#ef4444' },
  lastik: { label: 'Lastik Değişimi & Balans', color: '#06b6d4' },
  aku: { label: 'Akü & Elektrik Bakımı', color: '#eab308' },
  muayene: { label: 'TÜVTÜRK Muayenesi', color: '#8b5cf6' },
  ariza: { label: 'Arıza & Tamir Kontrolü', color: '#f97316' },
  diger: { label: 'Araç Bakımı', color: '#64748b' },
};

  const handleAddMaintLog = (maintData: Omit<MaintenanceLog, 'id'>, createCounter: boolean) => {
    const newMaintLog: MaintenanceLog = {
      ...maintData,
      id: `maint-${Date.now()}`,
    };
    setMaintLogs((prev) => [newMaintLog, ...prev]);

    // Update vehicle current odometer if higher
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === maintData.vehicleId && maintData.odometer > v.currentOdometer) {
          return { ...v, currentOdometer: maintData.odometer, updatedAt: new Date().toISOString() };
        }
        return v;
      })
    );

    // Optionally create a counter on the main Dashboard if reminder is requested
    if (createCounter && (maintData.nextServiceDate || maintData.nextServiceKm)) {
      const vehicle = vehicles.find((v) => v.id === maintData.vehicleId);
      const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Araç';
      const targetDate = maintData.nextServiceDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
      const typeConfig = SERVICE_TYPE_CONFIG[maintData.serviceType] || { label: 'Bakım', color: '#10b981' };

      const newCounter: CounterItem = {
        id: `counter-maint-${Date.now()}`,
        title: `${vehicleName} - ${typeConfig.label} Hatırlatıcı`,
        description: `${maintData.title} ${maintData.nextServiceKm ? `(Hedef: ${maintData.nextServiceKm.toLocaleString('tr-TR')} KM)` : ''}`,
        category: 'car',
        mode: 'countdown',
        targetDate,
        reminders: [
          { enabled: true, daysBefore: 30, notified: false },
          { enabled: true, daysBefore: 7, notified: false },
          { enabled: true, daysBefore: 1, notified: false },
        ],
        notes: maintData.notes || '',
        color: typeConfig.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCounters((prev) => [newCounter, ...prev]);
    }
  };

  const handleUpdateMaintLog = (updatedLog: MaintenanceLog, createCounter: boolean) => {
    setMaintLogs((prev) => prev.map((m) => (m.id === updatedLog.id ? updatedLog : m)));

    // Update vehicle current odometer if higher
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === updatedLog.vehicleId && updatedLog.odometer > v.currentOdometer) {
          return { ...v, currentOdometer: updatedLog.odometer, updatedAt: new Date().toISOString() };
        }
        return v;
      })
    );

    if (createCounter && (updatedLog.nextServiceDate || updatedLog.nextServiceKm)) {
      const vehicle = vehicles.find((v) => v.id === updatedLog.vehicleId);
      const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Araç';
      const targetDate = updatedLog.nextServiceDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
      const typeConfig = SERVICE_TYPE_CONFIG[updatedLog.serviceType] || { label: 'Bakım', color: '#10b981' };

      const newCounter: CounterItem = {
        id: `counter-maint-${Date.now()}`,
        title: `${vehicleName} - ${typeConfig.label} Hatırlatıcı`,
        description: `${updatedLog.title} ${updatedLog.nextServiceKm ? `(Hedef: ${updatedLog.nextServiceKm.toLocaleString('tr-TR')} KM)` : ''}`,
        category: 'car',
        mode: 'countdown',
        targetDate,
        reminders: [
          { enabled: true, daysBefore: 30, notified: false },
          { enabled: true, daysBefore: 7, notified: false },
          { enabled: true, daysBefore: 1, notified: false },
        ],
        notes: updatedLog.notes || '',
        color: typeConfig.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCounters((prev) => [newCounter, ...prev]);
    }
  };

  const handleDeleteMaintLog = (maintLogId: string) => {
    setMaintLogs((prev) => prev.filter((m) => m.id !== maintLogId));
  };

  const handleAddOdometerLog = (vehicleId: string, odo: number, date: string, notes: string) => {
    const newOdoLog: OdometerLog = {
      id: `odo-${Date.now()}`,
      vehicleId,
      odometer: odo,
      date: new Date(date).toISOString(),
      notes,
    };
    setOdometerLogs((prev) => [newOdoLog, ...prev]);

    // Update current vehicle odometer
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId && odo > v.currentOdometer) {
          return { ...v, currentOdometer: odo, updatedAt: new Date().toISOString() };
        }
        return v;
      })
    );
  };

  // Check reminders on mount and every 60 seconds
  useEffect(() => {
    const runReminderCheck = () => {
      const { updatedCounters, notifiedTitles } = checkAndTriggerDueReminders(counters);
      if (notifiedTitles.length > 0) {
        setCounters(updatedCounters);
      }
    };

    runReminderCheck();
    const interval = setInterval(runReminderCheck, 60000);
    return () => clearInterval(interval);
  }, [counters]);

  // Urgent items for banner (countdown mode, <= 7 days or past)
  const urgentCounters = useMemo(() => {
    return counters
      .filter((item) => {
        if (item.mode === 'elapsed') return false;
        const diff = calculateTimeDifference(item.targetDate);
        return diff.isPast || diff.totalDays <= 7;
      })
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  }, [counters]);

  // Filtered & Sorted counters list
  const filteredCounters = useMemo(() => {
    let list = [...counters];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    // 2. Category / Mode filter
    if (activeFilter === 'urgent') {
      list = list.filter((c) => {
        if (c.mode === 'elapsed') return false;
        const diff = calculateTimeDifference(c.targetDate);
        return diff.isPast || diff.totalDays <= 7;
      });
    } else if (activeFilter === 'countdown') {
      list = list.filter((c) => c.mode === 'countdown');
    } else if (activeFilter === 'elapsed') {
      list = list.filter((c) => c.mode === 'elapsed');
    } else if (activeFilter !== 'all') {
      list = list.filter((c) => c.category === activeFilter);
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortType === 'custom') {
        const orderA = a.order ?? counters.findIndex((c) => c.id === a.id);
        const orderB = b.order ?? counters.findIndex((c) => c.id === b.id);
        return orderA - orderB;
      }

      if (sortType === 'urgency') {
        const diffA = calculateTimeDifference(a.targetDate);
        const diffB = calculateTimeDifference(b.targetDate);

        // Expired or small days first
        if (a.mode === 'countdown' && b.mode === 'countdown') {
          return diffA.totalDays - diffB.totalDays;
        }
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      }

      if (sortType === 'date_asc') {
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      }

      if (sortType === 'date_desc') {
        return new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime();
      }

      if (sortType === 'title_asc') {
        return a.title.localeCompare(b.title, 'tr-TR');
      }

      if (sortType === 'title_desc') {
        return b.title.localeCompare(a.title, 'tr-TR');
      }

      if (sortType === 'created_desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }

      if (sortType === 'created_asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }

      return 0;
    });

    return list;
  }, [counters, searchQuery, activeFilter, sortType]);

  // Category counts calculation for filter badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counters.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
      if (c.mode === 'countdown') counts['countdown'] = (counts['countdown'] || 0) + 1;
      if (c.mode === 'elapsed') counts['elapsed'] = (counts['elapsed'] || 0) + 1;
    });
    return counts;
  }, [counters]);

  // Handlers
  const handleOpenAddModal = () => {
    triggerHaptic(30);
    setEditingCounter(null);
    setIsModalOpen(true);
  };

  const handleEditCounter = (counter: CounterItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic(30);
    setEditingCounter(counter);
    setIsModalOpen(true);
  };

  const handleDeleteCounter = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic(50);
    const target = counters.find((c) => c.id === id);
    if (target) {
      setCounterToDelete(target);
    }
  };

  const handleSortChange = (newSort: SortType) => {
    setSortType(newSort);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_counter_sort_preference', newSort);
    }
  };

  const handleSaveOrder = (reordered: CounterItem[]) => {
    setCounters(reordered);
    saveCounterItems(reordered);
    setSortType('custom');
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_counter_sort_preference', 'custom');
    }
    triggerHaptic(50);
  };

  const handleMoveCounter = (counterId: string, direction: 'up' | 'down' | 'top') => {
    triggerHaptic(40);
    setCounters((prev) => {
      const index = prev.findIndex((c) => c.id === counterId);
      if (index === -1) return prev;

      const updated = [...prev];
      if (direction === 'top') {
        if (index === 0) return prev;
        const [moved] = updated.splice(index, 1);
        updated.unshift(moved);
      } else if (direction === 'up') {
        if (index === 0) return prev;
        const temp = updated[index];
        updated[index] = updated[index - 1];
        updated[index - 1] = temp;
      } else if (direction === 'down') {
        if (index === updated.length - 1) return prev;
        const temp = updated[index];
        updated[index] = updated[index + 1];
        updated[index + 1] = temp;
      }

      const ordered = updated.map((c, i) => ({ ...c, order: i }));
      saveCounterItems(ordered);
      return ordered;
    });

    setSortType('custom');
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_counter_sort_preference', 'custom');
    }
  };

  const handleQuickRenew = (counter: CounterItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic([100, 50, 150]);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    playNotificationSound();

    let newTarget = counter.targetDate;
    if (counter.mode === 'elapsed') {
      newTarget = new Date().toISOString();
    } else {
      const years = counter.autoRenewYears || 1;
      const months = counter.autoRenewMonths || 0;
      newTarget = calculateNextRenewalDate(counter.targetDate, years, months);
    }

    const updated: CounterItem = {
      ...counter,
      targetDate: newTarget,
      startDate: new Date().toISOString(),
      completedCycles: (counter.completedCycles || 0) + 1,
      reminders: counter.reminders.map((r) => ({ ...r, notified: false })),
      updatedAt: new Date().toISOString(),
    };

    setCounters((prev) => prev.map((c) => (c.id === counter.id ? updated : c)));
    if (selectedCounter?.id === counter.id) setSelectedCounter(updated);
  };

  const handleSaveCounter = (counterData: Partial<CounterItem>) => {
    triggerHaptic(50);
    const now = new Date().toISOString();

    if (editingCounter) {
      const updated: CounterItem = {
        ...editingCounter,
        ...counterData,
        updatedAt: now,
      } as CounterItem;
      setCounters((prev) => prev.map((c) => (c.id === editingCounter.id ? updated : c)));
    } else {
      const newCounter: CounterItem = {
        id: `counter-${Date.now()}`,
        title: counterData.title || 'Yeni Sayaç',
        description: counterData.description || '',
        category: counterData.category || 'car',
        mode: counterData.mode || 'countdown',
        targetDate: counterData.targetDate || new Date().toISOString(),
        startDate: counterData.startDate,
        autoRenewYears: counterData.autoRenewYears,
        autoRenewMonths: counterData.autoRenewMonths,
        reminders: counterData.reminders || [],
        notes: counterData.notes || '',
        color: counterData.color || '#3b82f6',
        createdAt: now,
        updatedAt: now,
        order: 0,
      };
      setCounters((prev) => [newCounter, ...prev.map((c, i) => ({ ...c, order: i + 1 }))]);
    }
  };

  const handleImportAll = (data: {
    counters: CounterItem[];
    vehicles: Vehicle[];
    fuelLogs: FuelLog[];
    maintenanceLogs: MaintenanceLog[];
    odometerLogs: OdometerLog[];
  }) => {
    if (data.counters && data.counters.length > 0) {
      setCounters(data.counters);
      saveCounterItems(data.counters);
    }
    if (data.vehicles && data.vehicles.length > 0) {
      setVehicles(data.vehicles);
      saveVehicles(data.vehicles);
    }
    if (data.fuelLogs && data.fuelLogs.length > 0) {
      setFuelLogs(data.fuelLogs);
      saveFuelLogs(data.fuelLogs);
    }
    if (data.maintenanceLogs && data.maintenanceLogs.length > 0) {
      setMaintLogs(data.maintenanceLogs);
      saveMaintenanceLogs(data.maintenanceLogs);
    }
    if (data.odometerLogs && data.odometerLogs.length > 0) {
      setOdometerLogs(data.odometerLogs);
      saveOdometerLogs(data.odometerLogs);
    }
  };

  const handleResetToDefaultSamples = () => {
    const sampleCounters = getDefaultSampleCounters();
    const sampleVehicles = getDefaultSampleVehicles();
    const sampleFuelLogs = getDefaultSampleFuelLogs();
    const sampleMaintLogs = getDefaultSampleMaintenanceLogs();
    const sampleOdometerLogs = getDefaultSampleOdometerLogs();

    setCounters(sampleCounters);
    saveCounterItems(sampleCounters);

    setVehicles(sampleVehicles);
    saveVehicles(sampleVehicles);

    setFuelLogs(sampleFuelLogs);
    saveFuelLogs(sampleFuelLogs);

    setMaintLogs(sampleMaintLogs);
    saveMaintenanceLogs(sampleMaintLogs);

    setOdometerLogs(sampleOdometerLogs);
    saveOdometerLogs(sampleOdometerLogs);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-24 sm:pb-12">
      {/* Top Header */}
      <Header
        activeTab={mainTab}
        onTabChange={setMainTab}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenNewCounter={handleOpenAddModal}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        notificationPermission={notificationPermission}
        onPermissionChange={setNotificationPermission}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6">
        {mainTab === 'vehicle' ? (
          /* Vehicle Section View */
          <VehicleSection
            vehicles={vehicles}
            fuelLogs={fuelLogs}
            maintLogs={maintLogs}
            odometerLogs={odometerLogs}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onAddFuelLog={handleAddFuelLog}
            onUpdateFuelLog={handleUpdateFuelLog}
            onDeleteFuelLog={handleDeleteFuelLog}
            onAddMaintLog={handleAddMaintLog}
            onUpdateMaintLog={handleUpdateMaintLog}
            onDeleteMaintLog={handleDeleteMaintLog}
            onAddOdometerLog={handleAddOdometerLog}
            onOpenBackup={() => setIsBackupOpen(true)}
          />
        ) : (
          /* Counters Section View */
          <>
            {/* PWA Install Banner */}
            <div className="mb-4">
              <PWAInstallButton variant="banner" />
            </div>

            {/* Urgent Notification Banner */}
            <NotificationBanner
              urgentCounters={urgentCounters}
              onSelectCounter={(c) => setSelectedCounter(c)}
            />

            {/* Filter and Search Bar */}
            <CategoryFilter
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortType={sortType}
              onSortChange={handleSortChange}
              urgentCount={urgentCounters.length}
              totalCount={counters.length}
              categoryCounts={categoryCounts}
              onOpenNewCounter={handleOpenAddModal}
              onOpenReorderModal={() => setIsReorderModalOpen(true)}
            />

            {/* Hero Featured Bento Card */}
            {filteredCounters.length > 0 && (
              <BentoHeroCard
                counter={filteredCounters[0]}
                onSelect={setSelectedCounter}
                onRenew={handleQuickRenew}
                onMoveDown={(id, e) => handleMoveCounter(id, 'down')}
                onOpenReorder={() => setIsReorderModalOpen(true)}
                hasMultiple={filteredCounters.length > 1}
              />
            )}

            {/* Remaining Bento Grid Cards */}
            {filteredCounters.length > 1 ? (
              <div>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Diğer Sayaçlar ({filteredCounters.length - 1})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsReorderModalOpen(true)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Sıralamayı Düzenle</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {filteredCounters.slice(1).map((counter, sliceIndex) => {
                    const actualIndex = sliceIndex + 1;
                    return (
                      <CounterCard
                        key={counter.id}
                        counter={counter}
                        onSelect={setSelectedCounter}
                        onEdit={handleEditCounter}
                        onDelete={handleDeleteCounter}
                        onRenew={handleQuickRenew}
                        positionNumber={actualIndex + 1}
                        canMoveUp={actualIndex > 0}
                        canMoveDown={actualIndex < filteredCounters.length - 1}
                        onMoveUp={(id, e) => handleMoveCounter(id, 'up')}
                        onMoveDown={(id, e) => handleMoveCounter(id, 'down')}
                        onMoveToTop={(id, e) => handleMoveCounter(id, 'top')}
                      />
                    );
                  })}
                </div>
              </div>
            ) : filteredCounters.length === 0 ? (
              /* Empty State */
              <div className="my-8 p-10 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {searchQuery ? 'Aramanıza Uygun Sayaç Bulunamadı' : 'Henüz Kayıtlı Sayaç Yok'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {searchQuery
                    ? 'Farklı bir kelime ile arayabilir veya filtreleri temizleyebilirsiniz.'
                    : 'Arabanızın sigorta yenileme, muayene veya periyodik bakım tarihlerini ekleyerek takibe başlayın.'}
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleOpenAddModal}
                    className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>İlk Sayacını Ekle</span>
                  </button>
                  {!searchQuery && (
                    <button
                      onClick={handleResetToDefaultSamples}
                      className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Örnek Verileri Yükle</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Mobile Floating Action Bottom Bar */}
      {mainTab === 'counters' && (
        <div className="sm:hidden fixed bottom-4 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none">
          <button
            id="mobile-fab-btn"
            onClick={handleOpenAddModal}
            className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Sayaç Ekle</span>
          </button>
        </div>
      )}

      {/* Counter Reorder Modal */}
      <CounterReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        counters={counters}
        onSaveOrder={handleSaveOrder}
      />

      {/* Add / Edit Counter Modal */}
      <CounterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCounter}
        editingCounter={editingCounter}
      />

      {/* Detail Viewer Modal */}
      <CounterDetailModal
        counter={selectedCounter}
        onClose={() => setSelectedCounter(null)}
        onEdit={(counter) => {
          setSelectedCounter(null);
          handleEditCounter(counter);
        }}
        onDelete={(id) => {
          setSelectedCounter(null);
          handleDeleteCounter(id);
        }}
        onUpdateCounter={(updated) => {
          setCounters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedCounter(updated);
        }}
      />

      {/* Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        counters={counters}
        vehicles={vehicles}
        fuelLogs={fuelLogs}
        maintLogs={maintLogs}
        odometerLogs={odometerLogs}
        onImportAll={handleImportAll}
        onResetToDefaultSamples={handleResetToDefaultSamples}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!counterToDelete}
        title="Sayacı Sil"
        description={
          counterToDelete
            ? `"${counterToDelete.title}" sayacını kalıcı olarak silmek istediğinize emin misiniz?`
            : ''
        }
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onClose={() => setCounterToDelete(null)}
        onConfirm={() => {
          if (counterToDelete) {
            setCounters((prev) => prev.filter((c) => c.id !== counterToDelete.id));
            if (selectedCounter?.id === counterToDelete.id) {
              setSelectedCounter(null);
            }
            triggerHaptic(50);
            setCounterToDelete(null);
          }
        }}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
