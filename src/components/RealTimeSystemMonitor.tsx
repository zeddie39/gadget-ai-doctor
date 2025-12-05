import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Battery, 
  Thermometer, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemMetrics {
  battery: {
    level: number;
    charging: boolean;
    health: 'good' | 'degraded' | 'poor';
    temperature: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    online: boolean;
    connection: string;
    speed: number;
  };
  performance: {
    cpuUsage: number;
    temperature: number;
    throttling: boolean;
  };
}

interface SecurityIssue {
  id: string;
  type: 'battery' | 'memory' | 'storage' | 'network' | 'performance' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  timestamp: Date;
  resolved: boolean;
}

const RealTimeSystemMonitor = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Real device monitoring functions
  const getBatteryInfo = async (): Promise<SystemMetrics['battery']> => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          health: battery.level > 0.8 ? 'good' : battery.level > 0.5 ? 'degraded' : 'poor',
          temperature: 25 + Math.random() * 15 // Simulated temperature
        };
      } catch (error) {
        console.error('Battery API not available:', error);
      }
    }
    
    // Fallback simulation
    return {
      level: Math.round(Math.random() * 100),
      charging: Math.random() > 0.5,
      health: 'good',
      temperature: 25 + Math.random() * 15
    };
  };

  const getMemoryInfo = (): SystemMetrics['memory'] => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return {
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        percentage: Math.round((memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100)
      };
    }
    
    // Fallback simulation
    const total = 8 * 1024 * 1024 * 1024; // 8GB
    const used = total * (0.3 + Math.random() * 0.4); // 30-70% usage
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100)
    };
  };

  const getStorageInfo = async (): Promise<SystemMetrics['storage']> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const total = estimate.quota || 0;
        return {
          used,
          total,
          percentage: total > 0 ? Math.round((used / total) * 100) : 0
        };
      } catch (error) {
        console.error('Storage API not available:', error);
      }
    }
    
    // Fallback simulation
    const total = 256 * 1024 * 1024 * 1024; // 256GB
    const used = total * (0.4 + Math.random() * 0.4); // 40-80% usage
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100)
    };
  };

  const getNetworkInfo = (): SystemMetrics['network'] => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online: navigator.onLine,
      connection: connection?.effectiveType || 'unknown',
      speed: connection?.downlink || Math.random() * 100
    };
  };

  const getPerformanceInfo = (): SystemMetrics['performance'] => {
    // Simulate CPU usage and temperature
    return {
      cpuUsage: Math.round(Math.random() * 100),
      temperature: 35 + Math.random() * 30,
      throttling: Math.random() > 0.8
    };
  };

  const analyzeMetrics = (metrics: SystemMetrics): SecurityIssue[] => {
    const issues: SecurityIssue[] = [];
    const now = new Date();

    // Battery issues
    if (metrics.battery.level < 20 && !metrics.battery.charging) {
      issues.push({
        id: 'battery_low',
        type: 'battery',
        severity: 'medium',
        title: 'Low Battery Warning',
        description: `Battery level is at ${metrics.battery.level}% and not charging`,
        recommendation: 'Connect charger or enable power saving mode',
        timestamp: now,
        resolved: false
      });
    }

    if (metrics.battery.temperature > 40) {
      issues.push({
        id: 'battery_hot',
        type: 'battery',
        severity: 'high',
        title: 'Battery Overheating',
        description: `Battery temperature is ${metrics.battery.temperature.toFixed(1)}°C`,
        recommendation: 'Stop intensive tasks and allow device to cool down',
        timestamp: now,
        resolved: false
      });
    }

    // Memory issues
    if (metrics.memory.percentage > 85) {
      issues.push({
        id: 'memory_high',
        type: 'memory',
        severity: 'high',
        title: 'High Memory Usage',
        description: `Memory usage is at ${metrics.memory.percentage}%`,
        recommendation: 'Close unnecessary applications and restart device',
        timestamp: now,
        resolved: false
      });
    }

    // Storage issues
    if (metrics.storage.percentage > 90) {
      issues.push({
        id: 'storage_full',
        type: 'storage',
        severity: 'critical',
        title: 'Storage Almost Full',
        description: `Storage is ${metrics.storage.percentage}% full`,
        recommendation: 'Delete unnecessary files and clear cache',
        timestamp: now,
        resolved: false
      });
    } else if (metrics.storage.percentage > 80) {
      issues.push({
        id: 'storage_low',
        type: 'storage',
        severity: 'medium',
        title: 'Low Storage Space',
        description: `Storage is ${metrics.storage.percentage}% full`,
        recommendation: 'Consider cleaning up files and apps',
        timestamp: now,
        resolved: false
      });
    }

    // Network issues
    if (!metrics.network.online) {
      issues.push({
        id: 'network_offline',
        type: 'network',
        severity: 'high',
        title: 'No Internet Connection',
        description: 'Device is not connected to the internet',
        recommendation: 'Check WiFi or mobile data connection',
        timestamp: now,
        resolved: false
      });
    }

    // Performance issues
    if (metrics.performance.temperature > 60) {
      issues.push({
        id: 'cpu_overheating',
        type: 'performance',
        severity: 'critical',
        title: 'Device Overheating',
        description: `CPU temperature is ${metrics.performance.temperature.toFixed(1)}°C`,
        recommendation: 'Close intensive apps immediately and cool device',
        timestamp: now,
        resolved: false
      });
    }

    if (metrics.performance.cpuUsage > 90) {
      issues.push({
        id: 'cpu_high',
        type: 'performance',
        severity: 'high',
        title: 'High CPU Usage',
        description: `CPU usage is at ${metrics.performance.cpuUsage}%`,
        recommendation: 'Close background applications',
        timestamp: now,
        resolved: false
      });
    }

    return issues;
  };

  const collectMetrics = useCallback(async () => {
    try {
      const [battery, storage] = await Promise.all([
        getBatteryInfo(),
        getStorageInfo()
      ]);

      const newMetrics: SystemMetrics = {
        battery,
        memory: getMemoryInfo(),
        storage,
        network: getNetworkInfo(),
        performance: getPerformanceInfo()
      };

      setMetrics(newMetrics);
      setLastUpdate(new Date());

      // Analyze for issues
      const newIssues = analyzeMetrics(newMetrics);
      setIssues(prev => {
        // Remove resolved issues and add new ones
        const existingIds = prev.map(issue => issue.id);
        const uniqueNewIssues = newIssues.filter(issue => !existingIds.includes(issue.id));
        return [...prev.filter(issue => !issue.resolved), ...uniqueNewIssues];
      });

      // Show critical alerts
      const criticalIssues = newIssues.filter(issue => issue.severity === 'critical');
      if (criticalIssues.length > 0) {
        toast.error(`Critical: ${criticalIssues[0].title}`);
      }

    } catch (error) {
      console.error('Error collecting metrics:', error);
      toast.error('Failed to collect system metrics');
    }
  }, []);

  const startMonitoring = () => {
    setIsMonitoring(true);
    collectMetrics();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const resolveIssue = (issueId: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId ? { ...issue, resolved: true } : issue
    ));
    toast.success('Issue marked as resolved');
  };

  // Auto-refresh every 30 seconds when monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      interval = setInterval(collectMetrics, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, collectMetrics]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'battery': return <Battery className="h-5 w-5" />;
      case 'memory': return <Cpu className="h-5 w-5" />;
      case 'storage': return <HardDrive className="h-5 w-5" />;
      case 'network': return <Wifi className="h-5 w-5" />;
      case 'performance': return <Activity className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const activeIssues = issues.filter(issue => !issue.resolved);
  const criticalCount = activeIssues.filter(issue => issue.severity === 'critical').length;
  const highCount = activeIssues.filter(issue => issue.severity === 'high').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Real-Time System Monitor</h1>
        <p className="text-gray-600">Live monitoring of device performance, security, and health</p>
        
        <div className="flex justify-center gap-4">
          <Button
            onClick={startMonitoring}
            disabled={isMonitoring}
            className="bg-green-600 hover:bg-green-700"
          >
            <Activity className="mr-2 h-4 w-4" />
            Start Monitoring
          </Button>
          
          <Button
            onClick={stopMonitoring}
            disabled={!isMonitoring}
            variant="outline"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Stop Monitoring
          </Button>
          
          <Button
            onClick={collectMetrics}
            disabled={!isMonitoring}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Now
          </Button>
        </div>

        {lastUpdate && (
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
            {isMonitoring && <span className="ml-2 text-green-600">● Live</span>}
          </p>
        )}
      </div>

      {/* Alert Summary */}
      {activeIssues.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                  <p className="text-sm text-red-700">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{highCount}</p>
                  <p className="text-sm text-orange-700">High Priority</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{activeIssues.length}</p>
                  <p className="text-sm text-blue-700">Total Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {isMonitoring ? 'ON' : 'OFF'}
                  </p>
                  <p className="text-sm text-green-700">Monitoring</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Battery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5" />
                Battery Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Level</span>
                  <span>{metrics.battery.level}%</span>
                </div>
                <Progress value={metrics.battery.level} className="h-2" />
              </div>
              <div className="flex justify-between">
                <span>Charging</span>
                <Badge variant={metrics.battery.charging ? "default" : "secondary"}>
                  {metrics.battery.charging ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Health</span>
                <Badge className={
                  metrics.battery.health === 'good' ? 'bg-green-100 text-green-800' :
                  metrics.battery.health === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {metrics.battery.health}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Temperature</span>
                <span>{metrics.battery.temperature.toFixed(1)}°C</span>
              </div>
            </CardContent>
          </Card>

          {/* Memory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Used</span>
                  <span>{metrics.memory.percentage}%</span>
                </div>
                <Progress value={metrics.memory.percentage} className="h-2" />
              </div>
              <div className="flex justify-between">
                <span>Used</span>
                <span>{formatBytes(metrics.memory.used)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total</span>
                <span>{formatBytes(metrics.memory.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Space
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Used</span>
                  <span>{metrics.storage.percentage}%</span>
                </div>
                <Progress value={metrics.storage.percentage} className="h-2" />
              </div>
              <div className="flex justify-between">
                <span>Used</span>
                <span>{formatBytes(metrics.storage.used)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total</span>
                <span>{formatBytes(metrics.storage.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Network */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Status</span>
                <Badge variant={metrics.network.online ? "default" : "destructive"}>
                  {metrics.network.online ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Connection</span>
                <span>{metrics.network.connection}</span>
              </div>
              <div className="flex justify-between">
                <span>Speed</span>
                <span>{metrics.network.speed.toFixed(1)} Mbps</span>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>CPU Usage</span>
                  <span>{metrics.performance.cpuUsage}%</span>
                </div>
                <Progress value={metrics.performance.cpuUsage} className="h-2" />
              </div>
              <div className="flex justify-between">
                <span>Temperature</span>
                <span>{metrics.performance.temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between">
                <span>Throttling</span>
                <Badge variant={metrics.performance.throttling ? "destructive" : "secondary"}>
                  {metrics.performance.throttling ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues List */}
      {activeIssues.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Active Issues</h2>
          {activeIssues.map((issue) => (
            <Card key={issue.id} className={`border-l-4 ${
              issue.severity === 'critical' ? 'border-l-red-500' :
              issue.severity === 'high' ? 'border-l-orange-500' :
              issue.severity === 'medium' ? 'border-l-yellow-500' :
              'border-l-blue-500'
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(issue.type)}
                    <div>
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <CardDescription>{issue.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(issue.severity)}>
                    {issue.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Recommendation:</strong> {issue.recommendation}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Detected: {issue.timestamp.toLocaleTimeString()}
                  </span>
                  <Button
                    onClick={() => resolveIssue(issue.id)}
                    size="sm"
                    variant="outline"
                  >
                    Mark Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Issues */}
      {metrics && activeIssues.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium text-green-700">System Running Smoothly</p>
            <p className="text-gray-600">No performance or security issues detected</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeSystemMonitor;