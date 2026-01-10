import { DataLogEntry, SystemStatus, UserSession, ReportData, CrowdMetric, Alert, AIAnalysisResponse } from '../types';

class DataLogger {
  private logs: DataLogEntry[] = [];
  private sessions: UserSession[] = [];
  private currentSession: UserSession | null = null;
  private maxLogs = 10000; // Keep last 10k entries
  private maxSessionLogs = 1000;

  constructor() {
    this.loadFromStorage();
    this.startSession();
  }

  // Session Management
  startSession(location: string = 'MAIN_DASHBOARD') {
    if (this.currentSession) {
      this.endSession();
    }

    this.currentSession = {
      id: `session_${Date.now()}`,
      startTime: new Date().toISOString(),
      actions: [],
      location
    };

    this.logEvent('SYSTEM', 'Session started', { sessionId: this.currentSession.id });
  }

  endSession() {
    if (this.currentSession) {
      this.currentSession.endTime = new Date().toISOString();
      this.sessions.push({ ...this.currentSession });
      this.saveToStorage();

      this.logEvent('SYSTEM', 'Session ended', {
        sessionId: this.currentSession.id,
        duration: Date.now() - new Date(this.currentSession.startTime).getTime()
      });

      this.currentSession = null;
    }
  }

  // Event Logging
  logMetric(metric: CrowdMetric) {
    this.logEvent('METRIC', 'Crowd metric recorded', metric, metric.location, undefined);
  }

  logAlert(alert: Alert) {
    this.logEvent('ALERT', alert.message, alert, alert.location, alert.severity);
    if (this.currentSession) {
      this.currentSession.actions.push(this.logs[this.logs.length - 1]);
    }
  }

  logAnalysis(analysis: AIAnalysisResponse) {
    this.logEvent('ANALYSIS', 'AI analysis completed', analysis, undefined, analysis.riskLevel);
  }

  logUserAction(action: string, details?: any) {
    this.logEvent('USER_ACTION', action, details);
    if (this.currentSession) {
      this.currentSession.actions.push(this.logs[this.logs.length - 1]);
    }
  }

  logSystemEvent(event: string, details?: any) {
    this.logEvent('SYSTEM', event, details);
  }

  private logEvent(
    type: DataLogEntry['type'],
    message: string,
    data: any,
    location?: string,
    severity?: any
  ) {
    const entry: DataLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      data,
      location,
      severity
    };

    this.logs.push(entry);

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Maintain session logs limit
    if (this.currentSession && this.currentSession.actions.length > this.maxSessionLogs) {
      this.currentSession.actions = this.currentSession.actions.slice(-this.maxSessionLogs);
    }

    this.saveToStorage();
  }

  // Data Retrieval
  getLogs(
    type?: DataLogEntry['type'],
    startTime?: string,
    endTime?: string,
    limit: number = 1000
  ): DataLogEntry[] {
    let filtered = this.logs;

    if (type) {
      filtered = filtered.filter(log => log.type === type);
    }

    if (startTime) {
      filtered = filtered.filter(log => log.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(log => log.timestamp <= endTime);
    }

    return filtered.slice(-limit);
  }

  getSystemStatus(): SystemStatus {
    const recentLogs = this.getLogs(undefined, new Date(Date.now() - 300000).toISOString()); // Last 5 minutes
    const alerts = recentLogs.filter(log => log.type === 'ALERT');
    const metrics = recentLogs.filter(log => log.type === 'METRIC');

    const uniqueLocations = new Set([
      ...alerts.map(a => a.location).filter(Boolean),
      ...metrics.map(m => m.data?.location).filter(Boolean)
    ]);

    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');

    let systemHealth: SystemStatus['systemHealth'] = 'HEALTHY';
    if (criticalAlerts.length > 5) systemHealth = 'CRITICAL';
    else if (criticalAlerts.length > 2) systemHealth = 'WARNING';

    return {
      camerasActive: true, // This would be determined by actual camera status
      lastUpdate: recentLogs.length > 0 ? recentLogs[recentLogs.length - 1].timestamp : new Date().toISOString(),
      totalAlerts: alerts.length,
      activeLocations: uniqueLocations.size,
      systemHealth
    };
  }

  // Reports and Analytics
  generateReport(startDate: string, endDate: string): ReportData {
    const logs = this.getLogs(undefined, startDate, endDate, 50000);

    const metrics = logs.filter(log => log.type === 'METRIC');
    const alerts = logs.filter(log => log.type === 'ALERT');

    // Calculate peak density
    const densities = metrics.map(m => m.data?.density || 0);
    const peakDensity = Math.max(...densities, 0);

    // Calculate average risk level
    const analyses = logs.filter(log => log.type === 'ANALYSIS');
    const riskLevels = analyses.map(a => {
      switch (a.data?.riskLevel) {
        case 'CRITICAL': return 4;
        case 'HIGH': return 3;
        case 'MEDIUM': return 2;
        case 'LOW': return 1;
        default: return 1;
      }
    });
    const avgRisk = riskLevels.length > 0 ? riskLevels.reduce((a, b) => a + b, 0) / riskLevels.length : 1;

    let averageRiskLevel: any = 'LOW';
    if (avgRisk >= 3.5) averageRiskLevel = 'CRITICAL';
    else if (avgRisk >= 2.5) averageRiskLevel = 'HIGH';
    else if (avgRisk >= 1.5) averageRiskLevel = 'MEDIUM';

    // Top locations by alerts
    const locationAlertCount: { [key: string]: number } = {};
    alerts.forEach(alert => {
      const location = alert.location || 'UNKNOWN';
      locationAlertCount[location] = (locationAlertCount[location] || 0) + 1;
    });

    const topLocations = Object.entries(locationAlertCount)
      .map(([location, alerts]) => ({ location, alerts }))
      .sort((a, b) => b.alerts - a.alerts)
      .slice(0, 10);

    // Hourly trends
    const hourlyTrends: { [hour: number]: { metrics: number; alerts: number } } = {};
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      if (!hourlyTrends[hour]) {
        hourlyTrends[hour] = { metrics: 0, alerts: 0 };
      }
      if (log.type === 'METRIC') hourlyTrends[hour].metrics++;
      if (log.type === 'ALERT') hourlyTrends[hour].alerts++;
    });

    const hourlyTrendsArray = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      metrics: hourlyTrends[i]?.metrics || 0,
      alerts: hourlyTrends[i]?.alerts || 0
    }));

    return {
      dateRange: { start: startDate, end: endDate },
      totalMetrics: metrics.length,
      totalAlerts: alerts.length,
      peakDensity,
      averageRiskLevel,
      topLocations,
      hourlyTrends: hourlyTrendsArray
    };
  }

  // Data Export
  exportData(format: 'json' | 'csv' = 'json', type?: DataLogEntry['type']): string {
    const data = type ? this.getLogs(type) : this.logs;

    if (format === 'csv') {
      if (data.length === 0) return '';

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(entry =>
        Object.values(entry).map(val =>
          typeof val === 'object' ? JSON.stringify(val) : String(val)
        ).join(',')
      );

      return [headers, ...rows].join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  // Storage Management
  private saveToStorage() {
    try {
      localStorage.setItem('crowdManagement_logs', JSON.stringify(this.logs.slice(-1000))); // Save last 1000
      localStorage.setItem('crowdManagement_sessions', JSON.stringify(this.sessions.slice(-50))); // Save last 50 sessions
      if (this.currentSession) {
        localStorage.setItem('crowdManagement_currentSession', JSON.stringify(this.currentSession));
      }
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const logs = localStorage.getItem('crowdManagement_logs');
      const sessions = localStorage.getItem('crowdManagement_sessions');
      const currentSession = localStorage.getItem('crowdManagement_currentSession');

      if (logs) this.logs = JSON.parse(logs);
      if (sessions) this.sessions = JSON.parse(sessions);
      if (currentSession) this.currentSession = JSON.parse(currentSession);
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  // Cleanup
  clearOldData(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
    this.sessions = this.sessions.filter(session => new Date(session.startTime) > cutoffDate);

    this.saveToStorage();
  }

  // Performance monitoring
  getPerformanceMetrics() {
    const now = Date.now();
    const lastHour = now - 3600000;
    const last24Hours = now - 86400000;

    const recentLogs = this.logs.filter(log => new Date(log.timestamp).getTime() > lastHour);
    const dailyLogs = this.logs.filter(log => new Date(log.timestamp).getTime() > last24Hours);

    return {
      logsPerHour: recentLogs.length,
      logsPerDay: dailyLogs.length,
      storageSize: JSON.stringify(this.logs).length,
      sessionCount: this.sessions.length
    };
  }
}

export const dataLogger = new DataLogger();
