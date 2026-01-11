
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LiveMonitor from './components/LiveMonitor';
import RiskInsights from './components/RiskInsights';
import AlertFeed from './components/AlertFeed';
import DataExport from './components/DataExport';
import { getCrowdAnalysis } from './services/geminiService';
import { dataLogger } from './services/dataLogger';
import { Alert, AlertSeverity, CrowdMetric, AIAnalysisResponse } from './types';
import { TEMPLE_LOCATIONS } from './constants';

const App: React.FC = () => {
  const [selectedTemple, setSelectedTemple] = useState(TEMPLE_LOCATIONS[0].id);
  const [currentView, setCurrentView] = useState<'analytics' | 'live-feeds' | 'heatmaps' | 'alert-logs' | 'settings'>('analytics');
  const [metrics, setMetrics] = useState<CrowdMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Handle temple selection with logging
  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    dataLogger.logUserAction('Alert acknowledged', { alertId });
  }, []);

  const handleViewAllLogs = useCallback(() => {
    setCurrentView('alert-logs');
  }, []);

  const handleTempleSelect = useCallback((templeId: string) => {
    const temple = TEMPLE_LOCATIONS.find(t => t.id === templeId);
    dataLogger.logUserAction('Temple selection changed', {
      from: selectedTemple,
      to: templeId,
      templeName: temple?.name
    });
    setSelectedTemple(templeId);
  }, [selectedTemple]);

  // Handle camera toggle with logging
  const handleCameraToggle = useCallback(() => {
    const newState = !cameraEnabled;
    dataLogger.logUserAction('Camera toggle', {
      enabled: newState,
      timestamp: new Date().toISOString()
    });
    dataLogger.logSystemEvent(`Camera ${newState ? 'enabled' : 'disabled'}`, {
      userAction: true,
      timestamp: new Date().toISOString()
    });
    setCameraEnabled(newState);
  }, [cameraEnabled]);

  const [analysis, setAnalysis] = useState<AIAnalysisResponse>({
    riskLevel: AlertSeverity.LOW,
    prediction: "System initializing. Monitoring crowd baseline...",
    recommendations: ["Ensure all camera feeds are active.", "Verify personnel station assignments."]
  });
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Simulate real-time metrics update
  useEffect(() => {
    if (!cameraEnabled) return;

    const interval = setInterval(() => {
      const newMetric: CrowdMetric = {
        location: 'MAIN_GATE',
        density: 2 + Math.random() * 4,
        flowRate: Math.floor(40 + Math.random() * 60),
        velocity: 1 + Math.random() * 0.8,
        anomalyScore: Math.random() * 100,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMetrics(prev => {
        const updated = [...prev, newMetric];
        // Log the new metric
        dataLogger.logMetric(newMetric);
        return updated.slice(-20); // Keep last 20 points
      });

      // Trigger dummy alert if density is high
      if (newMetric.density > 5 && Math.random() > 0.7) {
        const newAlert: Alert = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          location: 'East Corridor 4B',
          severity: AlertSeverity.HIGH,
          message: 'Density exceeded safe threshold (5.2 p/m²). Bottleneck forming.',
          type: 'HIGH_DENSITY'
        };
        setAlerts(prev => {
          const updated = [newAlert, ...prev].slice(0, 10);
          // Log the new alert
          dataLogger.logAlert(newAlert);
          return updated;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [cameraEnabled]);

  // Update AI Analysis periodically
  const fetchAnalysis = useCallback(async () => {
    if (metrics.length === 0) return;
    setIsLoadingAnalysis(true);
    try {
      const result = await getCrowdAnalysis(
        metrics.slice(-5),
        alerts.slice(0, 3).map(a => a.message)
      );
      setAnalysis(result);
      // Log the analysis
      dataLogger.logAnalysis(result);
      setIsLoadingAnalysis(false);
    } catch (error) {
      console.error('Analysis error:', error);
      dataLogger.logSystemEvent('Analysis failed', { error: error.message });
      setIsLoadingAnalysis(false);
    }
  }, [metrics, alerts]);

  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 30000); // Analysis every 30s
    return () => clearInterval(interval);
  }, [fetchAnalysis]);

  const activeTemple = TEMPLE_LOCATIONS.find(t => t.id === selectedTemple);

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar
        selectedTemple={selectedTemple}
        onSelectTemple={handleTempleSelect}
        currentView={currentView}
        onSelectView={setCurrentView}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          locationName={activeTemple?.name || ''}
          status={analysis.riskLevel}
          cameraEnabled={cameraEnabled}
          onToggleCamera={handleCameraToggle}
          onOpenExport={() => setShowExportModal(true)}
          onOpenNotifications={() => setShowNotifications(!showNotifications)}
          onOpenMenu={() => setShowMenu(!showMenu)}
          alertsCount={alerts.length}
        />

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {currentView === 'analytics' && (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon="fa-users" label="Live Count" value="4,281" unit="est." color="text-indigo-400" />
                <StatCard icon="fa-person-running" label="Entry Rate" value="142" unit="p/min" color="text-emerald-400" />
                <StatCard icon="fa-hourglass-half" label="Avg Wait" value="18" unit="mins" color="text-amber-400" />
                <StatCard icon="fa-shield" label="Deployed" value="84" unit="units" color="text-blue-400" />
              </div>

              <LiveMonitor metrics={metrics} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <RiskInsights analysis={analysis} loading={isLoadingAnalysis} />
                </div>
                <div className="lg:col-span-1 h-full">
                  <AlertFeed
                    alerts={alerts}
                    onViewAllLogs={handleViewAllLogs}
                    onAcknowledgeAlert={handleAcknowledgeAlert}
                  />
                </div>
              </div>
            </>
          )}

          {currentView === 'live-feeds' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Live Camera Feeds</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LiveMonitor metrics={metrics} />
                <LiveMonitor metrics={metrics} />
              </div>
            </div>
          )}

          {currentView === 'heatmaps' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Crowd Density Heatmaps</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <i className="fas fa-map-marked-alt text-6xl text-slate-600 mb-4"></i>
                <p className="text-slate-400">Heatmap visualization would be displayed here</p>
                <p className="text-sm text-slate-500 mt-2">Showing real-time crowd density overlay on temple layout</p>
              </div>
            </div>
          )}

          {currentView === 'alert-logs' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Alert History & Logs</h2>
              <AlertFeed
                alerts={alerts}
                onViewAllLogs={handleViewAllLogs}
                onAcknowledgeAlert={handleAcknowledgeAlert}
              />
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Historical Data</h3>
                <p className="text-slate-400">Extended alert logs and historical analytics would be shown here</p>
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">System Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Camera Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Auto-focus</span>
                      <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 transition-transform"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Night mode</span>
                      <button className="w-12 h-6 bg-slate-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 transition-transform"></div>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Alert Thresholds</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">Density Warning (%)</label>
                      <input type="range" min="1" max="10" defaultValue="5" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">Flow Rate Alert</label>
                      <input type="range" min="50" max="200" defaultValue="100" className="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showExportModal && (
        <DataExport onClose={() => setShowExportModal(false)} />
      )}

      {showNotifications && (
        <div className="fixed top-16 right-8 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-80 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
          </div>
          <div className="p-2">
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <i className="fas fa-bell-slash text-2xl mb-2"></i>
                <p>No new notifications</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-3 border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${alert.severity === 'CRITICAL' ? 'bg-red-500' : alert.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{alert.message}</p>
                      <p className="text-xs text-slate-400">{alert.location} • {alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-800">
            <button
              onClick={() => {
                setShowNotifications(false);
                setCurrentView('alert-logs');
              }}
              className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300"
            >
              View All Alerts
            </button>
          </div>
        </div>
      )}

      {showMenu && (
        <div className="fixed top-16 right-32 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-64">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white">Quick Menu</h3>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                setShowMenu(false);
                setCurrentView('analytics');
              }}
              className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-3"
            >
              <i className="fas fa-chart-pie text-indigo-400"></i>
              <span className="text-sm text-white">Analytics Dashboard</span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setCurrentView('live-feeds');
              }}
              className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-3"
            >
              <i className="fas fa-video text-emerald-400"></i>
              <span className="text-sm text-white">Live Camera Feeds</span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setCurrentView('settings');
              }}
              className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-3"
            >
              <i className="fas fa-cog text-slate-400"></i>
              <span className="text-sm text-white">System Settings</span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setShowExportModal(true);
              }}
              className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-3"
            >
              <i className="fas fa-download text-blue-400"></i>
              <span className="text-sm text-white">Export Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, unit, color }: { icon: string; label: string; value: string; unit: string; color: string }) => (
  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg hover:border-slate-700 transition-all group">
    <div className="flex items-center justify-between mb-3">
       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
       <i className={`fas ${icon} ${color} opacity-80 group-hover:scale-110 transition-transform`}></i>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-white">{value}</span>
      <span className="text-xs text-slate-400 font-medium">{unit}</span>
    </div>
  </div>
);

export default App;
