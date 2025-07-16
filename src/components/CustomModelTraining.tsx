import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Play, 
  Pause, 
  Save, 
  Upload, 
  Target, 
  Activity,
  TrendingUp,
  Settings,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { DeviceDiagnosisModel, ModelConfig } from '@/lib/tensorflowModel';
import ModelPredictionDemo from './ModelPredictionDemo';
import * as tf from '@tensorflow/tfjs';

interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
}

interface ModelEvaluation {
  accuracy: number;
  loss: number;
  predictions: number[];
  actual: number[];
}

const CustomModelTraining: React.FC = () => {
  const [model, setModel] = useState<DeviceDiagnosisModel | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics[]>([]);
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    inputSize: 4,
    hiddenLayers: [16, 8],
    outputSize: 2,
    learningRate: 0.001,
    batchSize: 32,
    epochs: 50
  });

  // Initialize TensorFlow.js
  useEffect(() => {
    const initTensorFlow = async () => {
      try {
        await tf.ready();
        console.log('TensorFlow.js initialized');
        // Set backend to WebGL for better performance
        await tf.setBackend('webgl');
      } catch (error) {
        console.error('TensorFlow.js initialization failed:', error);
        toast.error('Failed to initialize TensorFlow.js');
      }
    };

    initTensorFlow();
  }, []);

  // Initialize model
  useEffect(() => {
    if (tf.getBackend()) {
      const deviceModel = new DeviceDiagnosisModel(modelConfig);
      setModel(deviceModel);
    }
  }, [modelConfig]);

  const handleTrainModel = async () => {
    if (!model) {
      toast.error('Model not initialized');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setCurrentEpoch(0);
    setTrainingMetrics([]);

    try {
      await model.trainModel(
        (epoch, logs) => {
          setCurrentEpoch(epoch + 1);
          setTrainingProgress(((epoch + 1) / modelConfig.epochs) * 100);
          
          const metrics: TrainingMetrics = {
            epoch: epoch + 1,
            loss: logs.loss,
            accuracy: logs.acc,
            valLoss: logs.val_loss,
            valAccuracy: logs.val_acc
          };
          
          setTrainingMetrics(prev => [...prev, metrics]);
        },
        (trainedModel, history) => {
          toast.success('Model training completed!');
          setIsTraining(false);
          evaluateModel();
        }
      );
    } catch (error) {
      console.error('Training failed:', error);
      toast.error(`Training failed: ${error.message}`);
      setIsTraining(false);
    }
  };

  const evaluateModel = async () => {
    if (!model) return;

    try {
      const evalResults = await model.evaluateModel();
      setEvaluation(evalResults);
      toast.success(`Model evaluation complete! Accuracy: ${(evalResults.accuracy * 100).toFixed(2)}%`);
    } catch (error) {
      console.error('Evaluation failed:', error);
      toast.error(`Evaluation failed: ${error.message}`);
    }
  };

  const saveModel = async () => {
    if (!model) return;

    try {
      const modelName = `device-diagnosis-${Date.now()}`;
      await model.saveModel(modelName);
      toast.success(`Model saved as ${modelName}`);
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(`Save failed: ${error.message}`);
    }
  };

  const loadModel = async (modelName: string) => {
    if (!model) return;

    try {
      await model.loadModel(modelName);
      toast.success(`Model ${modelName} loaded successfully`);
      evaluateModel();
    } catch (error) {
      console.error('Load failed:', error);
      toast.error(`Load failed: ${error.message}`);
    }
  };

  const resetModel = () => {
    setTrainingMetrics([]);
    setEvaluation(null);
    setTrainingProgress(0);
    setCurrentEpoch(0);
    const newModel = new DeviceDiagnosisModel(modelConfig);
    setModel(newModel);
    toast.success('Model reset successfully');
  };

  const updateModelConfig = (field: keyof ModelConfig, value: any) => {
    setModelConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getLatestMetrics = () => {
    return trainingMetrics.length > 0 ? trainingMetrics[trainingMetrics.length - 1] : null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <CardTitle>Custom TensorFlow.js Model Training</CardTitle>
            </div>
            <Badge variant="secondary">
              Backend: {tf.getBackend() || 'Not initialized'}
            </Badge>
          </div>
          <CardDescription>
            Train a custom neural network model for device diagnosis using TensorFlow.js
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Training Data</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Using feedback data for supervised learning
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Model Status</span>
              </div>
              <Badge variant={isTraining ? "default" : model ? "secondary" : "outline"}>
                {isTraining ? "Training" : model ? "Ready" : "Not Initialized"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Accuracy</span>
              </div>
              <span className="text-lg font-bold">
                {evaluation ? `${(evaluation.accuracy * 100).toFixed(2)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="prediction">Prediction</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Model Training
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isTraining && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Epoch {currentEpoch} / {modelConfig.epochs}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {trainingProgress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={trainingProgress} className="h-2" />
                </div>
              )}

              {getLatestMetrics() && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Training Loss</span>
                    <div className="text-lg font-bold text-red-600">
                      {getLatestMetrics()?.loss.toFixed(4)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Training Accuracy</span>
                    <div className="text-lg font-bold text-green-600">
                      {((getLatestMetrics()?.accuracy || 0) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Validation Loss</span>
                    <div className="text-lg font-bold text-orange-600">
                      {getLatestMetrics()?.valLoss.toFixed(4)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Validation Accuracy</span>
                    <div className="text-lg font-bold text-blue-600">
                      {((getLatestMetrics()?.valAccuracy || 0) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleTrainModel}
                  disabled={isTraining || !model}
                  className="flex-1"
                >
                  {isTraining ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
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
                  onClick={resetModel}
                  disabled={isTraining}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Model Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="learningRate">Learning Rate</Label>
                  <Input
                    id="learningRate"
                    type="number"
                    step="0.0001"
                    value={modelConfig.learningRate}
                    onChange={(e) => updateModelConfig('learningRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epochs">Epochs</Label>
                  <Input
                    id="epochs"
                    type="number"
                    value={modelConfig.epochs}
                    onChange={(e) => updateModelConfig('epochs', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    value={modelConfig.batchSize}
                    onChange={(e) => updateModelConfig('batchSize', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hiddenLayers">Hidden Layers (comma-separated)</Label>
                  <Input
                    id="hiddenLayers"
                    value={modelConfig.hiddenLayers.join(', ')}
                    onChange={(e) => updateModelConfig('hiddenLayers', e.target.value.split(',').map(x => parseInt(x.trim())))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Model Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluation ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Test Accuracy</span>
                      <div className="text-2xl font-bold text-green-600">
                        {(evaluation.accuracy * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Test Loss</span>
                      <div className="text-2xl font-bold text-red-600">
                        {evaluation.loss.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Confusion Matrix</span>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-green-50 rounded">
                        True Positives: {evaluation.predictions.filter((p, i) => p === 1 && evaluation.actual[i] === 1).length}
                      </div>
                      <div className="p-2 bg-red-50 rounded">
                        False Positives: {evaluation.predictions.filter((p, i) => p === 1 && evaluation.actual[i] === 0).length}
                      </div>
                      <div className="p-2 bg-red-50 rounded">
                        False Negatives: {evaluation.predictions.filter((p, i) => p === 0 && evaluation.actual[i] === 1).length}
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        True Negatives: {evaluation.predictions.filter((p, i) => p === 0 && evaluation.actual[i] === 0).length}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No evaluation data available</p>
                  <Button onClick={evaluateModel} className="mt-4" disabled={!model}>
                    Evaluate Model
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prediction">
          <ModelPredictionDemo />
        </TabsContent>

        <TabsContent value="management" className="space-y-4">{/* ... keep existing code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Model Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={saveModel} disabled={!model}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Model
                </Button>
                <Button variant="outline" onClick={() => loadModel('device-diagnosis-model')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Load Model
                </Button>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-900">Model Architecture</h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Input Layer: {modelConfig.inputSize} features</li>
                  <li>• Hidden Layers: {modelConfig.hiddenLayers.join(' → ')} neurons</li>
                  <li>• Output Layer: {modelConfig.outputSize} classes</li>
                  <li>• Activation: ReLU (hidden), Softmax (output)</li>
                  <li>• Optimizer: Adam</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomModelTraining;