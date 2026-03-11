
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
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    const iconClass = severity === 'critical' || severity === 'high' ? 'text-destructive' : 
                     severity === 'medium' ? 'text-yellow-500' : 'text-primary';
    
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
        <p className="text-muted-foreground">Real-time monitoring and alerts for device security and performance</p>
        </div>
        
        <Button
          onClick={runSecurityScan}
          disabled={isScanning}
          size="lg"
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
          <p className="text-sm text-muted-foreground">
            Last scan: {formatTimestamp(lastScan)}
          </p>
        )}
      </div>

      {/* Alert Summary */}
      {activeAlerts.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
                  <p className="text-sm text-destructive/80">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-500">{highCount}</p>
                  <p className="text-sm text-orange-400">High Priority</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-primary">{activeAlerts.length}</p>
                  <p className="text-sm text-primary/80">Total Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-emerald-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-emerald-500">
                    {activeAlerts.filter(alert => alert.actionable).length}
                  </p>
                  <p className="text-sm text-emerald-400">Actionable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alerts Banner */}
      {criticalCount > 0 && (
        <Alert className="border-destructive/30 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Critical Security Alert!</strong> You have {criticalCount} critical issue{criticalCount > 1 ? 's' : ''} that require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {isScanning ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium mb-2">Scanning for Security Threats</p>
              <p className="text-muted-foreground">Checking apps, permissions, network security, and performance issues...</p>
            </CardContent>
          </Card>
        ) : activeAlerts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
              <p className="text-lg font-medium text-emerald-400">All Clear!</p>
              <p className="text-muted-foreground">No security or performance issues detected</p>
            </CardContent>
          </Card>
        ) : (
          activeAlerts
            .sort((a, b) => {
              const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
              return severityOrder[b.severity] - severityOrder[a.severity];
            })
            .map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-destructive' : alert.severity === 'high' ? 'border-l-orange-500' : alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-primary'}`}>
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
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4">
                    <p className="text-sm text-foreground">
                      <strong>Recommendation:</strong> {alert.recommendation}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Detected {formatTimestamp(alert.timestamp)}
                    </span>
                    
                    <div className="flex gap-2">
                      {alert.actionable && (
                        <Button
                          onClick={() => takeAction(alert)}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
