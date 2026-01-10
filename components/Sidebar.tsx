
import React from 'react';
import { TEMPLE_LOCATIONS } from '../constants';

interface SidebarProps {
  selectedTemple: string;
  onSelectTemple: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedTemple, onSelectTemple }) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-eye text-white text-sm"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Project Drishti</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Security Dashboard</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2">Select Monitor Site</p>
          {TEMPLE_LOCATIONS.map((temple) => (
            <button
              key={temple.id}
              onClick={() => onSelectTemple(temple.id)}
              className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 group mb-1 ${
                selectedTemple === temple.id 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <i className={`fas fa-dharmachakra ${selectedTemple === temple.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}></i>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{temple.name}</span>
                <span className="text-[10px] opacity-60">{temple.region}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 mt-8">
           <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2">Modules</p>
           <div className="space-y-1">
             <NavItem icon="fa-chart-pie" label="Analytics" active />
             <NavItem icon="fa-video" label="Live Feeds" />
             <NavItem icon="fa-map-marked-alt" label="Heatmaps" />
             <NavItem icon="fa-history" label="Alert Logs" />
             <NavItem icon="fa-cog" label="Settings" />
           </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
             <i className="fas fa-user-shield text-slate-300"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">Admin_Control</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Encrypted
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) => (
  <button className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-all ${
    active ? 'text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`}>
    <i className={`fas ${icon} text-sm w-5 text-center`}></i>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default Sidebar;
