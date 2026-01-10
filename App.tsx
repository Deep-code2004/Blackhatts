
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
  const [metrics, setMetrics] = useState<CrowdMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Handle temple selection with logging
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
      <Sidebar selectedTemple={selectedTemple} onSelectTemple={handleTempleSelect} />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          locationName={activeTemple?.name || ''}
          status={analysis.riskLevel}
          cameraEnabled={cameraEnabled}
          onToggleCamera={handleCameraToggle}
          onOpenExport={() => setShowExportModal(true)}
        />

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
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
              <AlertFeed alerts={alerts} />
            </div>
          </div>
        </div>
      </main>

      {showExportModal && (
        <DataExport onClose={() => setShowExportModal(false)} />
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
