import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode, suppress button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Edge / Desktop PWA flow
  if (isInstallable) {
    if (variant === 'card') {
      return (
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Pasang ChatKeuangan AI di Perangkat Anda</h4>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Akses lebih cepat langsung dari layar utama, bekerja offline, dan tanpa bilah browser.
              </p>
            </div>
          </div>
          <button
            onClick={install}
            className="shrink-0 flex items-center space-x-2 px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Install Sekarang</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition ${className}`}
        title="Pasang aplikasi di layar utama / desktop"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (Apple requires manual "Add to Home Screen" action)
  if (isIOS) {
    return (
      <>
        {variant === 'card' ? (
          <div className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Pasang ChatKeuangan AI di iPhone / iPad</h4>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  Buka aplikasi seperti aplikasi bawaan iOS langsung dari layar utama Anda.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="shrink-0 flex items-center space-x-2 px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Cara Pasang di iOS</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition ${className}`}
            title="Cara pasang di iPhone / iPad"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pasang di iOS</span>
          </button>
        )}

        {/* iOS Install Guide Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Pasang di iPhone / iPad
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Ketuk tombol Bagikan (Share)
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Ketuk ikon kotak dengan panah ke atas (<Share className="w-3.5 h-3.5 inline text-blue-500" />) di bilah bawah peramban Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Pilih "Tambah ke Layar Utama"
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Gulir ke bawah pada menu opsi lalu pilih <strong>Tambah ke Layar Utama</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-600" />).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Ketuk "Tambah" di Pojok Kanan Atas
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Ikon ChatKeuangan AI akan muncul di beranda iPhone Anda dan siap dibuka tanpa browser.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition shadow-xs"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
