
import React from 'react';
import { Alert, AlertSeverity } from '../types';
import { SEVERITY_COLORS } from '../constants';

interface AlertFeedProps {
  alerts: Alert[];
  onViewAllLogs?: () => void;
  onAcknowledgeAlert?: (alertId: string) => void;
}

const AlertFeed: React.FC<AlertFeedProps> = ({ alerts, onViewAllLogs, onAcknowledgeAlert }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <i className="fas fa-triangle-exclamation text-amber-400"></i>
          CRITICAL EVENT LOG
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">LIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <i className="fas fa-shield-check text-4xl mb-4 opacity-20"></i>
            <p className="text-sm">No critical incidents detected</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-xl border-l-4 ${SEVERITY_COLORS[alert.severity]} transition-transform hover:scale-[1.01] cursor-pointer`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{alert.type.replace('_', ' ')}</span>
                <span className="text-[10px] font-mono opacity-60">{alert.timestamp}</span>
              </div>
              <p className="text-xs font-medium text-slate-200 mb-2">{alert.message}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <i className="fas fa-location-dot text-[10px] opacity-60"></i>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{alert.location}</span>
                </div>
                <button
                  onClick={() => onAcknowledgeAlert?.(alert.id)}
                  className="text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white cursor-pointer"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onViewAllLogs}
        className="w-full py-4 text-xs font-bold text-slate-400 bg-slate-950 border-t border-slate-800 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
      >
        VIEW ALL LOGS
      </button>
    </div>
  );
};

export default AlertFeed;
