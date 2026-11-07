import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, MoreVertical, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/notifications';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running as an installed standalone PWA, hide install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    triggerHaptic(30);
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // Header compact button
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
          title="Uygulamayı telefona / Chrome ana ekranına yükle"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">Telefona Yükle</span>
          <span className="sm:hidden">Yükle</span>
        </button>

        {showGuideModal && (
          <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuideModal(false)} />
        )}
      </>
    );
  }

  // Banner variant (for home page or hero area)
  return (
    <>
      <div
        id="pwa-install-banner"
        className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 p-4 sm:p-5 text-white shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shrink-0 shadow-inner flex items-center justify-center">
            <img src="/icon.svg" alt="Tarih Sayaç" className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Tarih Sayaç'ı Telefona Yükleyin</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                PWA
              </span>
            </h4>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Chrome üzerinden ana ekranınıza ekleyin, internet olmasa dahi anında açın.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleInstallClick}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isInstallable ? 'Hemen Yükle' : 'Nasıl Yüklenir?'}</span>
          </button>
        </div>
      </div>

      {showGuideModal && (
        <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuideModal(false)} />
      )}
    </>
  );
};

// Installation Guide Modal (for Chrome Android, PC, and iOS Safari)
interface InstallGuideModalProps {
  isIOS: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isIOS, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 p-2 border border-indigo-200 dark:border-indigo-800 shrink-0">
              <img src="/icon.svg" alt="Tarih Sayaç İkonu" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Telefona / Masaüstüne Yükleme
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uygulama gibi tam ekran kullanın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          // iOS Safari instructions
          <div className="space-y-3.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold font-mono">
                1
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Safari tarayıcısının alt kısmındaki <strong className="inline-flex items-center gap-1 font-bold"><Share className="w-3.5 h-3.5 inline text-blue-500" /> Paylaş</strong> butonuna dokunun.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold font-mono">
                2
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Açılan menüde aşağı kaydırıp <strong className="inline-flex items-center gap-1 font-bold"><PlusSquare className="w-3.5 h-3.5 inline text-slate-700 dark:text-slate-300" /> Ana Ekrana Ekle</strong> seçeneğini seçin.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold font-mono">
                3
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Sağ üstteki <strong>Ekle</strong> butonuna basın. Uygulama ana ekranınıza gelecektir!
              </p>
            </div>
          </div>
        ) : (
          // Android Chrome / Desktop Chrome instructions
          <div className="space-y-3.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold font-mono">
                1
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Chrome tarayıcısının sağ üst köşesindeki <strong className="inline-flex items-center gap-1 font-bold"><MoreVertical className="w-3.5 h-3.5 inline text-slate-700 dark:text-slate-300" /> Üç Nokta (Menü)</strong> simgesine dokunun.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold font-mono">
                2
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Menüden <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"Uygulamayı yükle"</strong> veya <strong className="font-bold">"Ana ekrana ekle"</strong> seçeneğine dokunun.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold font-mono">
                3
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Onay penceresinde <strong>"Yükle"</strong>ye basın. Uygulama tıpkı Play Store uygulaması gibi telefonunuzun menüsüne ve ana ekranına eklenecektir.
              </p>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Yüklendikten sonra internetsiz çevrimdışı çalışır ve bildirimler gönderir.</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
        >
          Anladım, Kapat
        </button>
      </div>
    </div>
  );
};
