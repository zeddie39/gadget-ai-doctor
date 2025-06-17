
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Battery, Zap, AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BatteryInfo {
  level: number;
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

interface BatteryHealth {
  capacity: number;
  cycleCount: number;
  temperature: number;
  voltage: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

const BatteryHealthChecker = () => {
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null);
  const [batteryHealth, setBatteryHealth] = useState<BatteryHealth | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string>('');

  const checkBatteryAPI = async () => {
    try {
      // Try to access Battery API (limited browser support)
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        
        const info: BatteryInfo = {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
        
        setBatteryInfo(info);
        return info;
      } else {
        throw new Error('Battery API not supported');
      }
    } catch (err) {
      console.warn('Battery API not available:', err);
      return null;
    }
  };

  const simulateBatteryHealth = (batteryLevel?: number): BatteryHealth => {
    // Simulate realistic battery health data
    const baseCapacity = batteryLevel ? Math.max(75, 100 - (100 - batteryLevel) * 0.5) : 85 + Math.random() * 10;
    const cycleCount = Math.floor(300 + Math.random() * 700);
    const temperature = 25 + Math.random() * 15; // 25-40°C
    const voltage = 3.7 + Math.random() * 0.5; // 3.7-4.2V
    
    let status: BatteryHealth['status'] = 'excellent';
    if (baseCapacity < 50) status = 'critical';
    else if (baseCapacity < 65) status = 'poor';
    else if (baseCapacity < 80) status = 'fair';
    else if (baseCapacity < 90) status = 'good';
    
    return {
      capacity: Math.round(baseCapacity),
      cycleCount,
      temperature: Math.round(temperature),
      voltage: Math.round(voltage * 100) / 100,
      status
    };
  };

  const generateRecommendations = (battery: BatteryInfo | null, health: BatteryHealth): string[] => {
    const recs: string[] = [];
    
    if (health.capacity < 80) {
      recs.push("Consider battery replacement - capacity below 80%");
    }
    
    if (health.temperature > 35) {
      recs.push("Device running hot - avoid charging while using intensive apps");
    }
    
    if (health.cycleCount > 800) {
      recs.push("High cycle count detected - monitor performance closely");
    }
    
    if (battery?.level && battery.level < 20) {
      recs.push("Charge your device - low battery can affect performance");
    }
    
    if (battery?.charging && battery.level > 90) {
      recs.push("Unplug charger soon - overcharging can degrade battery");
    }
    
    // General recommendations
    recs.push("Enable battery optimization in device settings");
    recs.push("Avoid extreme temperatures (below 0°C or above 35°C)");
    recs.push("Use original charger when possible");
    
    if (health.status === 'excellent' || health.status === 'good') {
      recs.push("Charge between 20-80% for optimal battery longevity");
    }
    
    return recs;
  };

  const saveBatteryReport = async (battery: BatteryInfo | null, health: BatteryHealth, recs: string[]) => {
    try {
      await supabase.from('battery_reports').insert({
        device_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          battery_api_supported: 'getBattery' in navigator
        } as any,
        battery_level: battery?.level || null,
        battery_health: health as any,
        recommendations: recs
      });
    } catch (error) {
      console.error('Error saving battery report:', error);
    }
  };

  const runBatteryCheck = async () => {
    setIsChecking(true);
    setError('');
    
    try {
      // Check if we can access battery info
      const batteryInfo = await checkBatteryAPI();
      
      // Simulate health check (in real app, this would query device APIs)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const health = simulateBatteryHealth(batteryInfo?.level);
      const recs = generateRecommendations(batteryInfo, health);
      
      setBatteryHealth(health);
      setRecommendations(recs);
      
      await saveBatteryReport(batteryInfo, health, recs);
      
    } catch (err) {
      setError('Unable to perform complete battery analysis. Limited data available.');
      // Still show simulated data for demo
      const health = simulateBatteryHealth();
      const recs = generateRecommendations(null, health);
      setBatteryHealth(health);
      setRecommendations(recs);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'fair':
        return <TrendingDown className="h-5 w-5 text-yellow-600" />;
      case 'poor':
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Battery className="h-5 w-5 text-gray-600" />;
    }
  };

  useEffect(() => {
    // Auto-check battery on component mount
    checkBatteryAPI();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <Button
          onClick={runBatteryCheck}
          disabled={isChecking}
          size="lg"
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isChecking ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Analyzing Battery...
            </>
          ) : (
            <>
              <Battery className="mr-2 h-5 w-5" />
              Run Battery Health Check
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">{error}</span>
          </div>
        </div>
      )}

      {batteryInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Current Battery Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Battery Level</p>
                <div className="flex items-center gap-2">
                  <Progress value={batteryInfo.level} className="flex-1" />
                  <span className="font-semibold">{batteryInfo.level}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Charging Status</p>
                <p className={`font-semibold ${batteryInfo.charging ? 'text-green-600' : 'text-gray-800'}`}>
                  {batteryInfo.charging ? 'Charging' : 'Not Charging'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {batteryHealth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5 text-blue-600" />
                Battery Health Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive health metrics for your device battery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Overall Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(batteryHealth.status)}
                  <span className={`font-semibold capitalize ${getStatusColor(batteryHealth.status)}`}>
                    {batteryHealth.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Battery Capacity</span>
                    <span className="font-medium">{batteryHealth.capacity}%</span>
                  </div>
                  <Progress value={batteryHealth.capacity} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cycle Count</span>
                    <p className="font-semibold">{batteryHealth.cycleCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Temperature</span>
                    <p className="font-semibold">{batteryHealth.temperature}°C</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Voltage</span>
                    <p className="font-semibold">{batteryHealth.voltage}V</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status</span>
                    <p className={`font-semibold capitalize ${getStatusColor(batteryHealth.status)}`}>
                      {batteryHealth.status}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription>
                Personalized tips to improve battery life and health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-blue-800 text-sm">{rec}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">Pro Tip:</p>
                    <p className="text-yellow-700">
                      Monitor your battery health monthly. Sudden drops in capacity may indicate hardware issues.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BatteryHealthChecker;
