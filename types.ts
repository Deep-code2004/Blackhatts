
export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface CrowdMetric {
  location: string;
  density: number; // people per sq meter
  flowRate: number; // people per min
  velocity: number; // average speed in m/s
  anomalyScore: number; // 0-100
  timestamp: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  location: string;
  severity: AlertSeverity;
  message: string;
  type: 'BOTTLE_NECK' | 'HIGH_DENSITY' | 'REVERSE_FLOW' | 'ABNORMAL_SPEED';
}

export interface LocationData {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  status: AlertSeverity;
}

export interface AIAnalysisResponse {
  riskLevel: AlertSeverity;
  prediction: string;
  recommendations: string[];
}

export interface DataLogEntry {
  id: string;
  timestamp: string;
  type: 'METRIC' | 'ALERT' | 'ANALYSIS' | 'SYSTEM' | 'USER_ACTION';
  data: any;
  location?: string;
  severity?: AlertSeverity;
}

export interface SystemStatus {
  camerasActive: boolean;
  lastUpdate: string;
  totalAlerts: number;
  activeLocations: number;
  systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface UserSession {
  id: string;
  startTime: string;
  endTime?: string;
  actions: DataLogEntry[];
  location: string;
}

export interface ReportData {
  dateRange: { start: string; end: string };
  totalMetrics: number;
  totalAlerts: number;
  peakDensity: number;
  averageRiskLevel: AlertSeverity;
  topLocations: { location: string; alerts: number }[];
  hourlyTrends: { hour: number; metrics: number; alerts: number }[];
}
