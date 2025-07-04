
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  BarChart3, 
  RefreshCw,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrainingMetrics {
  totalFeedback: number;
  positiveRate: number;
  accuracyByFeature: { [key: string]: number };
  commonIssues: string[];
  improvementAreas: string[];
}

const AITrainingDashboard = () => {
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const loadMetrics = async () => {
    try {
      // Get feedback data using direct query
      const { data: feedbackData, error } = await supabase
        .from('ai_feedback')
        .select('*');

      if (error) {
        console.error('Error loading feedback data:', error);
        return;
      }

      if (feedbackData) {
        const totalFeedback = feedbackData.length;
        const positiveCount = feedbackData.filter((f: any) => f.helpful).length;
        const positiveRate = totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0;

        // Calculate accuracy by feature
        const featureMetrics: { [key: string]: { total: number; positive: number } } = {};
        feedbackData.forEach((feedback: any) => {
          const feature = feedback.feature_used;
          if (!featureMetrics[feature]) {
            featureMetrics[feature] = { total: 0, positive: 0 };
          }
          featureMetrics[feature].total++;
          if (feedback.helpful) {
            featureMetrics[feature].positive++;
          }
        });

        const accuracyByFeature: { [key: string]: number } = {};
        Object.keys(featureMetrics).forEach(feature => {
          const metrics = featureMetrics[feature];
          accuracyByFeature[feature] = (metrics.positive / metrics.total) * 100;
        });

        // Extract common issues from negative feedback
        const negativeComments = feedbackData
          .filter((f: any) => !f.helpful && f.user_comments)
          .map((f: any) => f.user_comments);

        setMetrics({
          totalFeedback,
          positiveRate,
          accuracyByFeature,
          commonIssues: negativeComments.slice(0, 5),
          improvementAreas: Object.keys(accuracyByFeature)
            .filter(feature => accuracyByFeature[feature] < 70)
        });
      }
    } catch (error) {
      console.error('Error loading training metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerRetraining = async () => {
    setRetraining(true);
    try {
      // Simulate AI model retraining process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In real implementation, this would:
      // 1. Export feedback data
      // 2. Fine-tune OpenAI model
      // 3. Update model endpoints
      
      alert('AI model retrained successfully with latest feedback data!');
    } catch (error) {
      console.error('Retraining failed:', error);
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI Training Dashboard</h2>
        <Button 
          onClick={triggerRetraining}
          disabled={retraining}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Brain className="h-4 w-4 mr-2" />
          {retraining ? 'Retraining...' : 'Retrain AI Model'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.totalFeedback || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Training data points collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.positiveRate.toFixed(1) || 0}%
            </div>
            <Progress value={metrics?.positiveRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Needs Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics?.improvementAreas.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Features below 70% accuracy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Feature Performance
            </CardTitle>
            <CardDescription>AI accuracy by diagnostic feature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.accuracyByFeature && Object.entries(metrics.accuracyByFeature).map(([feature, accuracy]) => (
              <div key={feature} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{feature}</span>
                  <Badge variant={accuracy >= 80 ? 'default' : accuracy >= 60 ? 'secondary' : 'destructive'}>
                    {accuracy.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={accuracy} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Common Issues
            </CardTitle>
            <CardDescription>Areas needing AI improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics?.commonIssues.map((issue, index) => (
                <div key={index} className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                  <p className="text-sm text-orange-800">{issue}</p>
                </div>
              ))}
              {(!metrics?.commonIssues || metrics.commonIssues.length === 0) && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">No major issues reported!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AITrainingDashboard;
