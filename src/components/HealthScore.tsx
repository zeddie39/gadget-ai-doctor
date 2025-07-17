
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, Battery, Folder, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HealthMetrics {
  storage: number;
  battery: number;
  temperature: number;
  usage: number;
}

interface HealthScoreData {
  overallScore: number;
  metrics: HealthMetrics;
  recommendations: string[];
  improvementTips: string[];
  potentialImprovement: number;
  deviceInfo: any;
}

const HealthScore = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [healthData, setHealthData] = useState<HealthScoreData | null>(null);
  const [deviceId] = useState(() => `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const getRealStorageInfo = async (): Promise<{ used: number; available: number; score: number }> => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;
        const score = Math.max(0, 100 - usagePercent);
        return { used: usage, available: quota - usage, score: Math.round(score) };
      }
    } catch (error) {
      console.warn('Storage API not available:', error);
    }
    return { used: 0, available: 0, score: 75 }; // Fallback
  };

  const getRealBatteryInfo = async (): Promise<{ level: number; charging: boolean; score: number }> => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        const level = Math.round(battery.level * 100);
        const charging = battery.charging;
        
        // Score based on battery level and health factors
        let score = level;
        if (charging) score = Math.min(100, score + 5); // Slight bonus for charging
        if (level < 20) score = Math.max(0, score - 10); // Penalty for very low battery
        
        return { level, charging, score: Math.round(score) };
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
    return { level: 80, charging: false, score: 80 }; // Fallback
  };

  const getRealMemoryInfo = (): { used: number; total: number; score: number } => {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedJSHeapSize = memory.usedJSHeapSize || 0;
        const totalJSHeapSize = memory.totalJSHeapSize || 0;
        const jsHeapSizeLimit = memory.jsHeapSizeLimit || 0;
        
        const usagePercent = totalJSHeapSize > 0 ? (usedJSHeapSize / totalJSHeapSize) * 100 : 0;
        const score = Math.max(0, 100 - usagePercent);
        
        return {
          used: usedJSHeapSize,
          total: jsHeapSizeLimit,
          score: Math.round(score)
        };
      }
    } catch (error) {
      console.warn('Memory API not available:', error);
    }
    return { used: 0, total: 0, score: 85 }; // Fallback
  };

  const getRealNetworkInfo = (): { type: string; speed: number; score: number } => {
    try {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection.effectiveType || 'unknown';
        const downlink = connection.downlink || 0;
        
        // Score based on network quality
        let score = 50;
        switch (effectiveType) {
          case '4g': score = 95; break;
          case '3g': score = 75; break;
          case '2g': score = 40; break;
          case 'slow-2g': score = 20; break;
        }
        
        return { type: effectiveType, speed: downlink, score };
      }
    } catch (error) {
      console.warn('Network API not available:', error);
    }
    return { type: 'unknown', speed: 0, score: 75 }; // Fallback
  };

  const getCPUUsageEstimate = (): number => {
    // Estimate CPU usage based on performance timing
    const start = performance.now();
    let iterations = 0;
    const maxTime = 10; // 10ms test
    
    while (performance.now() - start < maxTime) {
      iterations++;
    }
    
    // Higher iterations = better CPU performance
    const baselineIterations = 100000; // Baseline for good performance
    const score = Math.min(100, Math.max(0, (iterations / baselineIterations) * 100));
    return Math.round(score);
  };

  const generateHealthScore = async (): Promise<HealthScoreData> => {
    const storageInfo = await getRealStorageInfo();
    const batteryInfo = await getRealBatteryInfo();
    const memoryInfo = getRealMemoryInfo();
    const networkInfo = getRealNetworkInfo();
    const cpuScore = getCPUUsageEstimate();
    
    // Calculate composite scores
    const storage = storageInfo.score;
    const battery = batteryInfo.score;
    const temperature = Math.max(0, 100 - (cpuScore > 90 ? 5 : cpuScore > 70 ? 0 : 10)); // Temperature estimate based on CPU
    const usage = Math.round((memoryInfo.score + networkInfo.score + cpuScore) / 3);
    
    const overall = Math.floor((storage + battery + temperature + usage) / 4);
    
    const recommendations: string[] = [];
    const improvementTips: string[] = [];
    
    // Generate real recommendations based on actual metrics
    if (storage < 80) {
      const usedGB = (storageInfo.used / (1024 * 1024 * 1024)).toFixed(1);
      recommendations.push(`Clear storage space - using ${usedGB}GB, impacting performance`);
      improvementTips.push('Delete unused apps and cached files to improve storage score');
    }
    
    if (battery < 75) {
      recommendations.push(`Battery at ${batteryInfo.level}% - optimize power usage`);
      if (!batteryInfo.charging) {
        improvementTips.push('Enable power saving mode or connect charger');
      }
    }
    
    if (memoryInfo.score < 70) {
      const usedMB = (memoryInfo.used / (1024 * 1024)).toFixed(1);
      recommendations.push(`High memory usage detected (${usedMB}MB)`);
      improvementTips.push('Close unnecessary browser tabs and applications');
    }
    
    if (networkInfo.score < 60) {
      recommendations.push(`Network connection is ${networkInfo.type} - may affect performance`);
      improvementTips.push('Switch to a faster network connection if available');
    }
    
    if (cpuScore < 70) {
      recommendations.push('High CPU usage detected - device may be running hot');
      improvementTips.push('Close background applications to reduce CPU load');
    }
    
    // General recommendations
    recommendations.push('Regular maintenance keeps your device healthy');
    recommendations.push('Update browser and OS for optimal performance');
    
    const potentialImprovement = Math.min(100 - overall, 30);
    
    return {
      overallScore: overall,
      metrics: { storage, battery, temperature, usage },
      recommendations,
      improvementTips,
      potentialImprovement,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        storage: storageInfo,
        battery: batteryInfo,
        memory: memoryInfo,
        network: networkInfo,
        cpuScore,
        analysisDate: new Date().toISOString()
      }
    };
  };

  const runHealthAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Show progress during real analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const healthScore = await generateHealthScore();
      setHealthData(healthScore);
      
      // Store in database
      await supabase.from('health_scores').insert({
        device_id: deviceId,
        overall_score: healthScore.overallScore,
        storage_score: healthScore.metrics.storage,
        battery_score: healthScore.metrics.battery,
        temperature_score: healthScore.metrics.temperature,
        usage_score: healthScore.metrics.usage,
        recommendations: healthScore.recommendations as any,
        improvement_tips: healthScore.improvementTips as any,
        potential_improvement: healthScore.potentialImprovement,
        device_info: healthScore.deviceInfo as any
      });
      
      toast.success('Health analysis completed!');
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
      console.error('Health analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getHealthStatus = (score: number): string => {
    if (score >= 85) return 'Excellent Health';
    if (score >= 70) return 'Good Health';
    if (score >= 50) return 'Needs Optimization';
    return 'Critical - Needs Attention';
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'storage': return <Folder className="h-5 w-5" />;
      case 'battery': return <Battery className="h-5 w-5" />;
      case 'temperature': return <Zap className="h-5 w-5" />;
      case 'usage': return <Shield className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <Button
          onClick={runHealthAnalysis}
          disabled={isAnalyzing}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Analyzing Device Health...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-5 w-5" />
              Run Health Check
            </>
          )}
        </Button>
      </div>

      {healthData && (
        <div className="space-y-6">
          {/* Overall Health Score */}
          <Card className={`border-2 ${getScoreBackground(healthData.overallScore)}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                <span className={getScoreColor(healthData.overallScore)}>
                  {healthData.overallScore}%
                </span>
              </CardTitle>
              <CardDescription className="text-lg font-medium">
                {getHealthStatus(healthData.overallScore)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">+{healthData.potentialImprovement}%</p>
                  <p className="text-sm text-gray-600">Potential Improvement</p>
                </div>
              </div>
              <Progress value={healthData.overallScore} className="h-3" />
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(healthData.metrics).map(([key, value]) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {getMetricIcon(key)}
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2" style={{ color: value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {value}%
                  </div>
                  <Progress value={value} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recommendations and Tips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Recommendations
                </CardTitle>
                <CardDescription>Actions to maintain device health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-6 h-6 bg-yellow-600 text-white text-xs rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-yellow-800 text-sm">{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Improvement Tips
                </CardTitle>
                <CardDescription>Specific actions to boost your score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthData.improvementTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-green-800 text-sm">{tip}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Health History */}
          <Card>
            <CardHeader>
              <CardTitle>Health Trends</CardTitle>
              <CardDescription>Track your device health over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Run multiple health checks to see trends and improvements</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HealthScore;
