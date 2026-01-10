import React, { useEffect, useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CrowdMetric, AlertSeverity } from '../types';

interface LiveMonitorProps {
  metrics: CrowdMetric[];
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({ metrics }) => {
  const [frame, setFrame] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setFrame(f => (f + 1) % 100), 500);
    return () => clearInterval(timer);
  }, []);

  // Use camera if available, otherwise show placeholder
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.log("Webcam access denied", err));
    }
  }, []);

  // Fix: Updated fallback object to include all CrowdMetric properties (anomalyScore, location, timestamp) to prevent TS union property errors.
  const latestMetric = metrics[metrics.length - 1] || { 
    density: 0, 
    flowRate: 0, 
    velocity: 0, 
    anomalyScore: 0,
    location: 'N/A',
    timestamp: new Date().toLocaleTimeString()
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CCTV View */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl">
        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Live Feed - CAM-04A</span>
        </div>
        
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1">
          <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
            DENSITY: {latestMetric.density.toFixed(2)} p/m²
          </div>
          <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-indigo-400">
            FLOW: {latestMetric.flowRate} p/min
          </div>
        </div>

        <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden relative">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            className="w-full h-full object-cover opacity-80"
          />
          
          {/* AI Overlay simulation */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-1/4 left-1/3 w-20 h-32 border-2 border-emerald-500/50 rounded-lg flex items-start justify-center">
               <span className="bg-emerald-500 text-[8px] px-1 text-white font-bold -mt-3">PERSON_082</span>
             </div>
             <div className="absolute bottom-1/3 right-1/4 w-16 h-24 border-2 border-red-500/50 rounded-lg flex items-start justify-center">
               <span className="bg-red-500 text-[8px] px-1 text-white font-bold -mt-3">PERSON_192 (STALLED)</span>
             </div>
             
             {/* Scanning lines */}
             <div className="w-full h-[1px] bg-indigo-500/20 absolute top-0 animate-[scan_4s_linear_infinite]"></div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center">
          <div className="flex gap-4">
             <button className="text-slate-400 hover:text-white"><i className="fas fa-expand"></i></button>
             <button className="text-slate-400 hover:text-white"><i className="fas fa-camera"></i></button>
             <button className="text-slate-400 hover:text-white"><i className="fas fa-history"></i></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500">RES: 1080P/60FPS</span>
            <span className="text-[10px] font-mono text-slate-500">LATENCY: 42ms</span>
          </div>
        </div>
      </div>

      {/* Real-time Graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
        <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
          <i className="fas fa-wave-square text-indigo-400"></i>
          DENSITY TREND
        </h3>
        
        <div className="flex-1 w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={[0, 10]} stroke="#475569" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px' }}
                itemStyle={{ color: '#6366f1' }}
              />
              <Area 
                type="monotone" 
                dataKey="density" 
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDensity)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Avg Velocity</p>
            <p className="text-xl font-bold text-white">{latestMetric.velocity.toFixed(1)} <span className="text-xs font-normal text-slate-400">m/s</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Anomaly Prob.</p>
            <p className={`text-xl font-bold ${latestMetric.anomalyScore > 70 ? 'text-red-400' : 'text-emerald-400'}`}>
              {latestMetric.anomalyScore.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          from { top: 0; }
          to { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default LiveMonitor;