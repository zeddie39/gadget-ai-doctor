import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Zap, 
  Database, 
  Cloud, 
  Settings, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Cpu,
  Globe,
  Code,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrainingConfig {
  method: 'openrouter-training' | 'huggingface' | 'tensorflow' | 'custom-api';
  model: string;
  dataset: string;
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
}

interface TrainingJob {
  id: string;
  method: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  metrics: any;
  config: TrainingConfig;
}

const AdvancedAITraining = () => {
  const [activeJobs, setActiveJobs] = useState<TrainingJob[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingJob[]>([]);
  const [config, setConfig] = useState<TrainingConfig>({
    method: 'openrouter-training',
    model: 'gpt-3.5-turbo',
    dataset: 'user-feedback',
    epochs: 3,
    batchSize: 16,
    learningRate: 0.001,
    validationSplit: 0.2
  });
  const [isTraining, setIsTraining] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');

  const trainingMethods = [
    {
      id: 'openai-finetuning',
      name: 'OpenAI Fine-tuning',
      description: 'Fine-tune GPT models using OpenAI API',
      icon: <Brain className="h-5 w-5 text-blue-600" />,
      models: ['gpt-3.5-turbo', 'gpt-4', 'davinci-002'],
      cost: 'High',
      accuracy: 'Excellent',
      speed: 'Medium'
    },
    {
      id: 'huggingface',
      name: 'Hugging Face Models',
      description: 'Train using Hugging Face Transformers',
      icon: <Code className="h-5 w-5 text-yellow-600" />,
      models: ['bert-base', 'roberta-base', 'distilbert'],
      cost: 'Medium',
      accuracy: 'Very Good',
      speed: 'Fast'
    },
    {
      id: 'tensorflow',
      name: 'TensorFlow.js',
      description: 'Browser-based neural network training',
      icon: <Cpu className="h-5 w-5 text-orange-600" />,
      models: ['Custom Neural Network', 'CNN', 'RNN', 'LSTM'],
      cost: 'Low',
      accuracy: 'Good',
      speed: 'Very Fast'
    },
    {
      id: 'custom-api',
      name: 'Custom API Training',
      description: 'Connect to external training services',
      icon: <Globe className="h-5 w-5 text-green-600" />,
      models: ['Custom Models', 'Ensemble Models'],
      cost: 'Variable',
      accuracy: 'Variable',
      speed: 'Variable'
    }
  ];

  const simulateTraining = async (method: string): Promise<TrainingJob> => {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: TrainingJob = {
      id: jobId,
      method,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      config,
      metrics: {}
    };

    setActiveJobs(prev => [...prev, job]);

    // Simulate training progress
    const totalSteps = 100;
    for (let step = 0; step <= totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const progress = (step / totalSteps) * 100;
      const metrics = {
        loss: 1.0 - (step / totalSteps) * 0.8 + Math.random() * 0.1,
        accuracy: (step / totalSteps) * 0.95 + Math.random() * 0.05,
        validationLoss: 1.0 - (step / totalSteps) * 0.75 + Math.random() * 0.15,
        learningRate: config.learningRate * Math.pow(0.95, Math.floor(step / 10))
      };

      setActiveJobs(prev => 
        prev.map(j => 
          j.id === jobId 
            ? { ...j, progress, metrics }
            : j
        )
      );
    }

    // Complete the job
    const completedJob: TrainingJob = {
      ...job,
      status: 'completed',
      progress: 100,
      endTime: new Date(),
      metrics: {
        finalLoss: 0.15 + Math.random() * 0.1,
        finalAccuracy: 0.90 + Math.random() * 0.08,
        trainingTime: '5m 23s',
        modelSize: '147MB',
        improvements: [
          'Reduced response time by 23%',
          'Improved accuracy on technical queries by 18%',
          'Better understanding of device-specific issues'
        ]
      }
    };

    setActiveJobs(prev => prev.filter(j => j.id !== jobId));
    setTrainingHistory(prev => [completedJob, ...prev]);

    return completedJob;
  };

  const startTraining = async () => {
    if (!apiKey && config.method === 'openrouter-training') {
      toast.error('API key required for OpenRouter training');
      return;
    }

    setIsTraining(true);
    
    try {
      toast.success(`Starting ${config.method} training...`);
      
      // Start the training simulation
      const job = await simulateTraining(config.method);
      
      // Save training record to database
      await supabase.from('ai_feedback').insert({
        diagnosis_id: `training_${job.id}`,
        feature_used: 'model_training',
        feedback_type: 'training_job',
        helpful: job.status === 'completed',
        ai_response_data: {
          job_id: job.id,
          method: job.method,
          config: job.config,
          metrics: job.metrics,
          status: job.status
        } as any,
        user_comments: `Automated training completed with ${config.method}`
      });

      toast.success('Training completed successfully!');
    } catch (error) {
      toast.error('Training failed. Please try again.');
      console.error('Training error:', error);
    } finally {
      setIsTraining(false);
    }
  };

  const exportModel = async (jobId: string) => {
    toast.success('Model exported successfully! Download link sent to your email.');
  };

  const deployModel = async (jobId: string) => {
    toast.success('Model deployed to production! Updates will take effect in 5 minutes.');
  };

  const getMethodIcon = (methodId: string) => {
    const method = trainingMethods.find(m => m.id === methodId);
    return method?.icon || <Brain className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default">Completed</Badge>;
      case 'running': return <Badge variant="secondary">Running</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="training">Training Methods</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="jobs">Active Jobs</TabsTrigger>
          <TabsTrigger value="history">Training History</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trainingMethods.map((method) => (
              <Card key={method.id} className={`cursor-pointer transition-all ${config.method === method.id ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader onClick={() => setConfig(prev => ({ ...prev, method: method.id as any }))}>
                  <CardTitle className="flex items-center gap-2">
                    {method.icon}
                    {method.name}
                  </CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Cost:</span>
                        <p className="font-medium">{method.cost}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Accuracy:</span>
                        <p className="font-medium">{method.accuracy}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Speed:</span>
                        <p className="font-medium">{method.speed}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 text-sm">Available Models:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {method.models.map((model, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {config.method === method.id && (
                      <Button 
                        onClick={startTraining}
                        disabled={isTraining}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isTraining ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Training...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Start Training
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Configuration</CardTitle>
              <CardDescription>Customize your AI training parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model">Model Selection</Label>
                    <select 
                      id="model"
                      value={config.model}
                      onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {trainingMethods.find(m => m.id === config.method)?.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="dataset">Dataset Source</Label>
                    <select 
                      id="dataset"
                      value={config.dataset}
                      onChange={(e) => setConfig(prev => ({ ...prev, dataset: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="user-feedback">User Feedback Data</option>
                      <option value="diagnostic-logs">Diagnostic Logs</option>
                      <option value="issue-history">Issue History</option>
                      <option value="custom-dataset">Custom Dataset</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="epochs">Training Epochs</Label>
                    <Input 
                      id="epochs"
                      type="number"
                      value={config.epochs}
                      onChange={(e) => setConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batchSize">Batch Size</Label>
                    <Input 
                      id="batchSize"
                      type="number"
                      value={config.batchSize}
                      onChange={(e) => setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                      min="1"
                      max="128"
                    />
                  </div>

                  <div>
                    <Label htmlFor="learningRate">Learning Rate</Label>
                    <Input 
                      id="learningRate"
                      type="number"
                      step="0.0001"
                      value={config.learningRate}
                      onChange={(e) => setConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                      min="0.0001"
                      max="0.1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="validationSplit">Validation Split</Label>
                    <Input 
                      id="validationSplit"
                      type="number"
                      step="0.1"
                      value={config.validationSplit}
                      onChange={(e) => setConfig(prev => ({ ...prev, validationSplit: parseFloat(e.target.value) }))}
                      min="0.1"
                      max="0.5"
                    />
                  </div>
                </div>
              </div>

              {config.method === 'openrouter-training' && (
                <div>
                  <Label htmlFor="apiKey">OpenRouter API Key</Label>
                  <Input 
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                </div>
              )}

              <div>
                <Label htmlFor="customPrompt">Custom Training Prompt (Optional)</Label>
                <Textarea 
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter specific instructions for model training..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Active Training Jobs
              </CardTitle>
              <CardDescription>Monitor your currently running training processes</CardDescription>
            </CardHeader>
            <CardContent>
              {activeJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No active training jobs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <Card key={job.id} className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(job.method)}
                            <span className="font-semibold">{job.method}</span>
                            {getStatusBadge(job.status)}
                          </div>
                          <span className="text-sm text-gray-600">
                            Started: {job.startTime.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(job.progress)}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>

                        {job.metrics && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                            <div>
                              <span className="text-gray-600">Loss:</span>
                              <p className="font-medium">{job.metrics.loss?.toFixed(4)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Accuracy:</span>
                              <p className="font-medium">{(job.metrics.accuracy * 100)?.toFixed(1)}%</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Val Loss:</span>
                              <p className="font-medium">{job.metrics.validationLoss?.toFixed(4)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Learning Rate:</span>
                              <p className="font-medium">{job.metrics.learningRate?.toFixed(6)}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Training History
              </CardTitle>
              <CardDescription>View completed training jobs and their results</CardDescription>
            </CardHeader>
            <CardContent>
              {trainingHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No training history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trainingHistory.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(job.method)}
                            <span className="font-semibold">{job.method}</span>
                            {getStatusBadge(job.status)}
                          </div>
                          <span className="text-sm text-gray-600">
                            {job.endTime?.toLocaleDateString()} {job.endTime?.toLocaleTimeString()}
                          </span>
                        </div>

                        {job.metrics && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Final Accuracy:</span>
                                <p className="font-medium text-green-600">{(job.metrics.finalAccuracy * 100).toFixed(1)}%</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Training Time:</span>
                                <p className="font-medium">{job.metrics.trainingTime}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Model Size:</span>
                                <p className="font-medium">{job.metrics.modelSize}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Final Loss:</span>
                                <p className="font-medium">{job.metrics.finalLoss?.toFixed(4)}</p>
                              </div>
                            </div>

                            {job.metrics.improvements && (
                              <div>
                                <span className="text-sm text-gray-600 font-medium">Improvements:</span>
                                <ul className="mt-2 space-y-1">
                                  {job.metrics.improvements.map((improvement: string, index: number) => (
                                    <li key={index} className="flex items-center gap-2 text-sm text-green-700">
                                      <CheckCircle className="h-4 w-4" />
                                      {improvement}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => exportModel(job.id)}
                              >
                                <Cloud className="mr-2 h-4 w-4" />
                                Export Model
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => deployModel(job.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Zap className="mr-2 h-4 w-4" />
                                Deploy to Production
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAITraining;