
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, Battery, Folder, Zap, TrendingUp, AlertTriangle, CheckCircle, Activity, HardDrive, Cpu, Gauge, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    if (score >= 85) return 'text-emerald-500';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'bg-primary/10 border-primary/30';
    if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-destructive/10 border-destructive/30';
  };

  const getHealthStatus = (score: number): string => {
    if (score >= 85) return 'Excellent Health';
    if (score >= 70) return 'Good Health';
    if (score >= 50) return 'Needs Optimization';
    return 'Critical - Needs Attention';
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'storage': return <HardDrive className="h-5 w-5" />;
      case 'battery': return <Battery className="h-5 w-5" />;
      case 'temperature': return <Gauge className="h-5 w-5" />;
      case 'usage': return <Activity className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-emerald-500/50 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <Card className="relative smart-glass border-none overflow-hidden rounded-[2rem] p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Real-time Telemetry Active</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                Device Neural <span className="text-primary italic">Pulse</span>
              </h2>
              <p className="text-muted-foreground max-w-md font-medium">
                Analyze hardware health, storage efficiency, and thermal performance with our neural diagnostic engine.
              </p>
              <Button
                onClick={runHealthAnalysis}
                disabled={isAnalyzing}
                className="group relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 overflow-hidden"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></div>
                    <span>SCANNING SYSTEMS...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5" />
                    <span>INITIATE DIAGNOSIS</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>
            </div>

            <div className="relative w-48 h-48 md:w-56 md:h-56">
               <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  className="stroke-white/5"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  className={`transition-all duration-1000 ease-out ${healthData ? getScoreColor(healthData.overallScore).replace('text-', 'stroke-') : 'stroke-primary/20'}`}
                  strokeWidth="8"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 * (1 - (healthData?.overallScore || 0) / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-black ${healthData ? getScoreColor(healthData.overallScore) : 'text-muted-foreground/20'}`}>
                  {healthData ? healthData.overallScore : '--'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  Health Index
                </span>
              </div>
              {isAnalyzing && (
                <div className="absolute inset-0 smart-scan opacity-40 rounded-full" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {healthData && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
          {/* Detailed Performance Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(healthData.metrics).map(([key, value]) => (
              <Card key={key} className="smart-glass border-none group hover:bg-white/10 transition-all cursor-default rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-2xl bg-white/5 transition-transform group-hover:scale-110 ${getScoreColor(value)}`}>
                    {getMetricIcon(key)}
                  </div>
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black">
                    METRIC {key.toUpperCase().slice(0,3)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-black uppercase tracking-wider text-muted-foreground/70">{key}</span>
                    <span className={`text-2xl font-black ${getScoreColor(value)}`}>{value}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${getScoreColor(value).replace('text-', 'bg-')}`} 
                      style={{ width: `${value}%` }} 
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Intelligent Insight Protocol */}
            <Card className="smart-glass border-none rounded-[2rem] p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-amber-500/10">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">AI Optimizaton Protocol</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recommended Actions</p>
                </div>
              </div>
              <div className="space-y-4">
                {healthData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black shrink-0 group-hover:bg-amber-500/20 transition-colors">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold text-foreground/90">{rec}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Projected Improvement */}
            <Card className="smart-glass border-none rounded-[2rem] p-8 shadow-xl bg-gradient-to-br from-white/5 to-emerald-500/5">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-emerald-500/10">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Efficiency Potential</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Growth Analytics</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="text-6xl font-black text-emerald-500 mb-2">
                  +{healthData.potentialImprovement}%
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-8">
                  Available Performance Boost
                </p>
                
                <div className="w-full space-y-4">
                  {healthData.improvementTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                      <div className="p-1 rounded-full bg-emerald-500/20 mt-0.5">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold text-foreground/80 leading-relaxed text-left">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Telemetry Log */}
          <Card className="smart-glass border-none rounded-[2rem] p-8 shadow-xl opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3 mb-6">
               <Activity className="h-5 w-5 text-muted-foreground" />
               <h3 className="text-lg font-black text-muted-foreground uppercase tracking-widest">Telemetry History</h3>
            </div>
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-widest">Awaiting Sequential Analysis Data</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HealthScore;
