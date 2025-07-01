
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

  const generateHealthScore = (): HealthScoreData => {
    // Simulate realistic health metrics
    const storage = Math.floor(60 + Math.random() * 35); // 60-95%
    const battery = Math.floor(65 + Math.random() * 30); // 65-95%
    const temperature = Math.floor(70 + Math.random() * 25); // 70-95%
    const usage = Math.floor(55 + Math.random() * 40); // 55-95%
    
    const overall = Math.floor((storage + battery + temperature + usage) / 4);
    
    const recommendations: string[] = [];
    const improvementTips: string[] = [];
    
    // Generate recommendations based on scores
    if (storage < 80) {
      recommendations.push('Clear storage space - currently impacting performance');
      improvementTips.push('Delete unused apps and files to improve storage score by 15%');
    }
    
    if (battery < 75) {
      recommendations.push('Optimize battery usage for better health');
      improvementTips.push('Enable battery optimization to increase score by 10%');
    }
    
    if (temperature < 80) {
      recommendations.push('Device running warm - check for intensive apps');
      improvementTips.push('Close background apps to improve temperature score by 12%');
    }
    
    if (usage < 70) {
      recommendations.push('Optimize app usage patterns');
      improvementTips.push('Limit background app refresh to boost usage score by 8%');
    }
    
    // General recommendations
    recommendations.push('Regular maintenance keeps your device healthy');
    recommendations.push('Update apps and OS for optimal performance');
    
    const potentialImprovement = Math.min(100 - overall, 25);
    
    return {
      overallScore: overall,
      metrics: { storage, battery, temperature, usage },
      recommendations,
      improvementTips,
      potentialImprovement,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        analysisDate: new Date().toISOString()
      }
    };
  };

  const runHealthAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate analysis time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const healthScore = generateHealthScore();
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
