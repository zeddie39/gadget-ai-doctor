import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Play, Pause, RefreshCw, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AIModelTraining: React.FC = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0
  });

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading training data:', error);
        return;
      }

      setTrainingData(data || []);
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  };

  const simulateTraining = async () => {
    setIsTraining(true);
    setProgress(0);
    
    const steps = [
      { step: 'Loading training data...', progress: 20 },
      { step: 'Preprocessing feedback...', progress: 40 },
      { step: 'Training model...', progress: 60 },
      { step: 'Validating results...', progress: 80 },
      { step: 'Updating model...', progress: 100 }
    ];

    for (const { step, progress } of steps) {
      toast.info(step);
      setProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Simulate improved metrics
    setModelMetrics({
      accuracy: Math.min(95, modelMetrics.accuracy + Math.random() * 5),
      precision: Math.min(93, modelMetrics.precision + Math.random() * 4),
      recall: Math.min(91, modelMetrics.recall + Math.random() * 3),
      f1Score: Math.min(92, modelMetrics.f1Score + Math.random() * 4)
    });

    setIsTraining(false);
    toast.success('AI model training completed successfully!');
  };

  const getDataQuality = () => {
    if (trainingData.length === 0) return 'No Data';
    if (trainingData.length < 10) return 'Insufficient';
    if (trainingData.length < 50) return 'Limited';
    if (trainingData.length < 100) return 'Good';
    return 'Excellent';
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return 'bg-green-500';
      case 'Good': return 'bg-blue-500';
      case 'Limited': return 'bg-yellow-500';
      case 'Insufficient': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Model Training</CardTitle>
          </div>
          <CardDescription>
            Train and improve the AI model using collected feedback data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Training Data</span>
                <Badge className={getQualityColor(getDataQuality())}>
                  {trainingData.length} samples
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Quality: {getDataQuality()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Model Status</span>
                <Badge variant={isTraining ? "default" : "secondary"}>
                  {isTraining ? "Training" : "Ready"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {isTraining && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Training Progress</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={simulateTraining}
              disabled={isTraining || trainingData.length === 0}
              className="flex-1"
            >
              {isTraining ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Training
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={loadTrainingData}
              disabled={isTraining}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <CardTitle>Model Performance</CardTitle>
          </div>
          <CardDescription>
            Current AI model accuracy and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Accuracy</span>
                <span className="text-sm">{modelMetrics.accuracy.toFixed(1)}%</span>
              </div>
              <Progress value={modelMetrics.accuracy} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Precision</span>
                <span className="text-sm">{modelMetrics.precision.toFixed(1)}%</span>
              </div>
              <Progress value={modelMetrics.precision} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Recall</span>
                <span className="text-sm">{modelMetrics.recall.toFixed(1)}%</span>
              </div>
              <Progress value={modelMetrics.recall} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">F1 Score</span>
                <span className="text-sm">{modelMetrics.f1Score.toFixed(1)}%</span>
              </div>
              <Progress value={modelMetrics.f1Score} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainingData.length < 50 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Collect more feedback:</strong> You need at least 50 feedback samples for effective training. Current: {trainingData.length}
                </p>
              </div>
            )}
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Real AI Training:</strong> For production use, consider using OpenAI's fine-tuning API or custom ML models with your feedback data.
              </p>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Data Quality:</strong> Ensure balanced positive/negative feedback for better model performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIModelTraining;