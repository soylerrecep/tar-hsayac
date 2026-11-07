import React from 'react';
import { Bell, BellOff, Download, Moon, Sun, Sparkles, Clock, Car } from 'lucide-react';
import { getNotificationPermissionState, requestNotificationPermission, sendWebNotification, playNotificationSound } from '../utils/notifications';
import { PWAInstallButton } from './PWAInstallButton';

export type MainTabType = 'counters' | 'vehicle';

interface HeaderProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  onOpenBackup: () => void;
  onOpenNewCounter: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  notificationPermission: NotificationPermission;
  onPermissionChange: (perm: NotificationPermission) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenBackup,
  onOpenNewCounter,
  isDark,
  onToggleTheme,
  notificationPermission,
  onPermissionChange,
}) => {
  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    onPermissionChange(perm);
    if (perm === 'granted') {
      playNotificationSound();
      sendWebNotification('Bildirimler Etkinleştirildi!', {
        body: 'Sigorta, bakım ve önemli tarih hatırlatmalarınız zamanında cebinize gelsin.',
      });
    }
  };

  const handleTestSound = () => {
    playNotificationSound();
    if (notificationPermission === 'granted') {
      sendWebNotification('Test Bildirimi', {
        body: 'Tarih Sayaç bildirim ve ses sistemi sorunsuz çalışıyor.',
      });
    }
  };

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Main Tabs */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight flex items-center gap-1.5">
                Tarih Sayaç
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Hatırlatıcı & Araç Takibi
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-1">
            <button
              onClick={() => onTabChange('counters')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'counters'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Sayaçlar</span>
            </button>

            <button
              onClick={() => onTabChange('vehicle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'vehicle'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Aracım</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end w-full sm:w-auto gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Notification Button */}
          {notificationPermission === 'granted' ? (
            <button
              id="test-sound-btn"
              onClick={handleTestSound}
              title="Bildirim & Ses Test Et"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100 active:scale-95 transition-all shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Bildirim</span>
            </button>
          ) : (
            <button
              id="enable-notifications-btn"
              onClick={handleRequestPermission}
              title="Bildirim izni ver"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 hover:bg-amber-100 active:scale-95 transition-all shadow-2xs"
            >
              <BellOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold">İzin Ver</span>
            </button>
          )}

          {/* Backup / Export Button */}
          <button
            id="backup-btn"
            onClick={onOpenBackup}
            title="Veri Yedekle / Yükle"
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all shadow-2xs"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            title="Karanlık / Aydınlık Mod"
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all shadow-2xs"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

