
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Zap, Eye, Cpu, Wifi, Battery } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  type: 'security' | 'performance' | 'battery' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  actionable: boolean;
  dismissed: boolean;
  timestamp: Date;
}

const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  const generateSecurityAlerts = (): SecurityAlert[] => {
    const possibleAlerts: Omit<SecurityAlert, 'id' | 'dismissed' | 'timestamp'>[] = [
      {
        type: 'security',
        severity: 'high',
        title: 'Suspicious App Activity Detected',
        description: 'An app is accessing your camera and microphone in the background',
        recommendation: 'Review app permissions and disable unnecessary access',
        actionable: true
      },
      {
        type: 'performance',
        severity: 'medium',
        title: 'High Memory Usage',
        description: 'Multiple apps are consuming excessive RAM, causing slowdowns',
        recommendation: 'Close background apps and restart your device',
        actionable: true
      },
      {
        type: 'security',
        severity: 'critical',
        title: 'Potentially Harmful App Found',
        description: 'An installed app shows patterns similar to known malware',
        recommendation: 'Uninstall suspicious app immediately and run security scan',
        actionable: true
      },
      {
        type: 'battery',
        severity: 'high',
        title: 'Unusual Battery Drain',
        description: 'Battery is draining 3x faster than normal usage patterns',
        recommendation: 'Check for apps running in background and consider battery replacement',
        actionable: true
      },
      {
        type: 'network',
        severity: 'medium',
        title: 'Insecure WiFi Connection',
        description: 'Connected to an open WiFi network without encryption',
        recommendation: 'Switch to a secure network or use mobile data for sensitive activities',
        actionable: true
      },
      {
        type: 'performance',
        severity: 'low',
        title: 'Storage Space Running Low',
        description: 'Less than 1GB of storage remaining, may affect performance',
        recommendation: 'Clear cache files and delete unused apps or photos',
        actionable: true
      },
      {
        type: 'security',
        severity: 'medium',
        title: 'Outdated Security Patches',
        description: 'Your device is missing important security updates',
        recommendation: 'Update your operating system and security patches',
        actionable: true
      },
      {
        type: 'performance',
        severity: 'high',
        title: 'Overheating Detected',
        description: 'Device temperature is above normal operational range',
        recommendation: 'Close intensive apps and allow device to cool down',
        actionable: true
      }
    ];

    // Randomly select 3-6 alerts for simulation
    const numAlerts = Math.floor(Math.random() * 4) + 3;
    const selectedAlerts = possibleAlerts
      .sort(() => 0.5 - Math.random())
      .slice(0, numAlerts)
      .map((alert, index) => ({
        ...alert,
        id: `alert_${index}_${Date.now()}`,
        dismissed: false,
        timestamp: new Date(Date.now() - Math.random() * 86400000) // Random time within last 24 hours
      }));

    return selectedAlerts;
  };

  const runSecurityScan = async () => {
    setIsScanning(true);
    
    try {
      // Simulate scanning time
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const newAlerts = generateSecurityAlerts();
      setAlerts(newAlerts);
      setLastScan(new Date());
      
      const criticalAlerts = newAlerts.filter(alert => alert.severity === 'critical').length;
      const highAlerts = newAlerts.filter(alert => alert.severity === 'high').length;
      
      if (criticalAlerts > 0) {
        toast.error(`Found ${criticalAlerts} critical security issue${criticalAlerts > 1 ? 's' : ''}!`);
      } else if (highAlerts > 0) {
        toast.warning(`Found ${highAlerts} high priority alert${highAlerts > 1 ? 's' : ''}`);
      } else {
        toast.success('Security scan completed - no critical issues found');
      }
      
    } catch (error) {
      toast.error('Security scan failed. Please try again.');
      console.error('Security scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
    toast.success('Alert dismissed');
  };

  const takeAction = (alert: SecurityAlert) => {
    // Simulate taking action
    switch (alert.type) {
      case 'security':
        toast.success('Security action initiated - reviewing app permissions');
        break;
      case 'performance':
        toast.success('Performance optimization started');
        break;
      case 'battery':
        toast.success('Battery optimization enabled');
        break;
      case 'network':
        toast.success('Network security measures applied');
        break;
    }
    dismissAlert(alert.id);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    const iconClass = severity === 'critical' || severity === 'high' ? 'text-red-600' : 
                     severity === 'medium' ? 'text-yellow-600' : 'text-blue-600';
    
    switch (type) {
      case 'security': return <Shield className={`h-5 w-5 ${iconClass}`} />;
      case 'performance': return <Cpu className={`h-5 w-5 ${iconClass}`} />;
      case 'battery': return <Battery className={`h-5 w-5 ${iconClass}`} />;
      case 'network': return <Wifi className={`h-5 w-5 ${iconClass}`} />;
      default: return <AlertTriangle className={`h-5 w-5 ${iconClass}`} />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffHrs > 0) {
      return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed);
  const criticalCount = activeAlerts.filter(alert => alert.severity === 'critical').length;
  const highCount = activeAlerts.filter(alert => alert.severity === 'high').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header and Scan Button */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Security & Performance Monitor</h1>
          <p className="text-gray-600">Real-time monitoring and alerts for device security and performance</p>
        </div>
        
        <Button
          onClick={runSecurityScan}
          disabled={isScanning}
          size="lg"
          className="bg-red-600 hover:bg-red-700"
        >
          {isScanning ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Scanning Security & Performance...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-5 w-5" />
              Run Security Scan
            </>
          )}
        </Button>
        
        {lastScan && (
          <p className="text-sm text-gray-500">
            Last scan: {formatTimestamp(lastScan)}
          </p>
        )}
      </div>

      {/* Alert Summary */}
      {activeAlerts.length > 0 && (
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
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{activeAlerts.length}</p>
                  <p className="text-sm text-blue-700">Total Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {activeAlerts.filter(alert => alert.actionable).length}
                  </p>
                  <p className="text-sm text-green-700">Actionable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alerts Banner */}
      {criticalCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Security Alert!</strong> You have {criticalCount} critical issue{criticalCount > 1 ? 's' : ''} that require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {isScanning ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium mb-2">Scanning for Security Threats</p>
              <p className="text-gray-600">Checking apps, permissions, network security, and performance issues...</p>
            </CardContent>
          </Card>
        ) : activeAlerts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium text-green-700">All Clear!</p>
              <p className="text-gray-600">No security or performance issues detected</p>
            </CardContent>
          </Card>
        ) : (
          activeAlerts
            .sort((a, b) => {
              const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
              return severityOrder[b.severity] - severityOrder[a.severity];
            })
            .map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'high' ? 'border-l-orange-500' : alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.type, alert.severity)}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <CardDescription className="mt-1">{alert.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline">
                        {alert.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Recommendation:</strong> {alert.recommendation}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Detected {formatTimestamp(alert.timestamp)}
                    </span>
                    
                    <div className="flex gap-2">
                      {alert.actionable && (
                        <Button
                          onClick={() => takeAction(alert)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Take Action
                        </Button>
                      )}
                      <Button
                        onClick={() => dismissAlert(alert.id)}
                        size="sm"
                        variant="outline"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};

export default SecurityAlerts;
