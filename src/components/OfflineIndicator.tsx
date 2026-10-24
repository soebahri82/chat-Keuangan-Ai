import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-14 sm:bottom-16 left-4 z-50 flex items-center space-x-2.5 bg-amber-600 text-white px-3.5 py-2 rounded-xl shadow-lg border border-amber-500 text-xs animate-in slide-in-from-bottom-2 duration-300">
      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span className="font-semibold">
        Mode Offline — AI & pencatatan tetap aktif via mesin lokal.
      </span>
    </div>
  );
};
