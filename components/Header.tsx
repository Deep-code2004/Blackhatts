
import React from 'react';

interface HeaderProps {
  locationName: string;
  status: string;
  cameraEnabled: boolean;
  onToggleCamera: () => void;
  onOpenExport: () => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  alertsCount: number;
}

const Header: React.FC<HeaderProps> = ({ locationName, status, cameraEnabled, onToggleCamera, onOpenExport, onOpenNotifications, onOpenMenu, alertsCount }) => {
  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Site:</span>
          <span className="font-semibold text-white">{locationName}</span>
        </div>
        <div className="h-4 w-px bg-slate-700"></div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
          <span className="text-sm font-medium text-slate-300 uppercase tracking-wide">System {status}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
          <i className="fas fa-satellite text-slate-500 text-xs"></i>
          <span className="text-[10px] font-mono text-slate-400">SAT-LINK: ACTIVE</span>
        </div>

        <button
          onClick={onToggleCamera}
          className={`relative p-2 rounded-lg transition-all cursor-pointer ${cameraEnabled ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10' : 'text-red-400 hover:text-red-300 hover:bg-red-400/10'}`}
          title={cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
        >
          <i className={`fas fa-video text-xl ${cameraEnabled ? '' : 'opacity-50'}`}></i>
        </button>

        <button
          onClick={onOpenExport}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all cursor-pointer"
          title="Export Data & Reports"
        >
          <i className="fas fa-download text-xl"></i>
        </button>

        <button
          onClick={onOpenNotifications}
          className="relative text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Notifications"
        >
          <i className="fas fa-bell text-xl"></i>
          {alertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {alertsCount > 9 ? '9+' : alertsCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenMenu}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Menu"
        >
          <i className="fas fa-th-large text-xl"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;
