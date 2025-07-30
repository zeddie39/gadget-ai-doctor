import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Brain, 
  Sparkles, 
  Upload, 
  Download,
  Settings,
  Zap,
  Target,
  Eye,
  Layers,
  Database,
  TrendingUp,
  Activity,
  Cpu,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingLoss: number;
  validationLoss: number;
}

interface TrainingSession {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime: Date;
  endTime?: Date;
  metrics: ModelMetrics;
  datasetSize: number;
  epochs: number;
  learningRate: number;
}

interface DatasetInfo {
  name: string;
  size: number;
  categories: string[];
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  lastUpdated: Date;
}

const GeminiAIIntegration: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentTask, setCurrentTask] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [modelConfig, setModelConfig] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40
  });

  useEffect(() => {
    // Load mock training sessions
    setTrainingSessions([
      {
        id: '1',
        name: 'PCB Component Detection v2.1',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 86400000),
        endTime: new Date(Date.now() - 82800000),
        metrics: {
          accuracy: 0.942,
          precision: 0.918,
          recall: 0.935,
          f1Score: 0.926,
          trainingLoss: 0.143,
          validationLoss: 0.167
        },
        datasetSize: 15000,
        epochs: 50,
        learningRate: 0.001
      },
      {
        id: '2',
        name: 'Defect Classification v1.3',
        status: 'running',
        progress: 67,
        startTime: new Date(Date.now() - 7200000),
        metrics: {
          accuracy: 0.876,
          precision: 0.854,
          recall: 0.892,
          f1Score: 0.873,
          trainingLoss: 0.234,
          validationLoss: 0.278
        },
        datasetSize: 8500,
        epochs: 75,
        learningRate: 0.0005
      }
    ]);

    // Load mock datasets
    setDatasets([
      {
        name: 'PCB Components Dataset',
        size: 15000,
        categories: ['Resistor', 'Capacitor', 'IC', 'Transistor', 'Diode', 'Connector'],
        quality: 'excellent',
        lastUpdated: new Date(Date.now() - 172800000)
      },
      {
        name: 'Electronic Defects Dataset',
        size: 8500,
        categories: ['Burn Marks', 'Corrosion', 'Crack', 'Delamination', 'Short Circuit'],
        quality: 'good',
        lastUpdated: new Date(Date.now() - 259200000)
      },
      {
        name: 'Motherboard Layout Dataset',
        size: 3200,
        categories: ['ATX', 'Micro-ATX', 'Mini-ITX', 'Server', 'Mobile'],
        quality: 'fair',
        lastUpdated: new Date(Date.now() - 604800000)
      }
    ]);
  }, []);

  const testConnection = async () => {
    if (!apiKey) {
      toast.error('Please enter your Gemini API key');
      return;
    }

    setIsProcessing(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent("Hello, this is a connection test.");
      const response = await result.response;
      
      if (response.text()) {
        setIsConnected(true);
        toast.success('Successfully connected to Gemini AI!');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Failed to connect to Gemini AI. Check your API key.');
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeWithGemini = async (prompt: string, image?: string) => {
    if (!isConnected) {
      toast.error('Please connect to Gemini AI first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentTask('Initializing analysis...');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Progress simulation
      const progressSteps = [
        'Preprocessing input...',
        'Analyzing with Gemini AI...',
        'Generating insights...',
        'Formatting results...'
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        setCurrentTask(progressSteps[i]);
        setProgress((i + 1) * 25);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const model = genAI.getGenerativeModel({ 
        model: image ? "gemini-pro-vision" : "gemini-pro",
        generationConfig: {
          temperature: modelConfig.temperature,
          topP: modelConfig.topP,
          topK: modelConfig.topK,
          maxOutputTokens: modelConfig.maxTokens,
        }
      });

      let result;
      if (image) {
        // Handle image analysis
        const base64Data = image.split(',')[1];
        result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          }
        ]);
      } else {
        // Handle text analysis
        result = await model.generateContent(prompt);
      }

      const response = await result.response;
      const text = response.text();
      
      setAnalysisResult(text);
      setProgress(100);
      setCurrentTask('Analysis complete!');
      toast.success('Analysis completed successfully!');

    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
      setCurrentTask('Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const startNewTraining = async (name: string, datasetName: string) => {
    const newSession: TrainingSession = {
      id: Date.now().toString(),
      name,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      metrics: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        trainingLoss: 1.0,
        validationLoss: 1.0
      },
      datasetSize: datasets.find(d => d.name === datasetName)?.size || 1000,
      epochs: 100,
      learningRate: 0.001
    };

    setTrainingSessions(prev => [newSession, ...prev]);
    
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingSessions(prev => prev.map(session => {
        if (session.id === newSession.id && session.status === 'running') {
          const newProgress = Math.min(session.progress + Math.random() * 5, 100);
          const isCompleted = newProgress >= 100;
          
          return {
            ...session,
            progress: newProgress,
            status: isCompleted ? 'completed' : 'running',
            endTime: isCompleted ? new Date() : undefined,
            metrics: {
              accuracy: Math.min(0.5 + (newProgress / 100) * 0.4 + Math.random() * 0.1, 0.98),
              precision: Math.min(0.4 + (newProgress / 100) * 0.5 + Math.random() * 0.1, 0.96),
              recall: Math.min(0.45 + (newProgress / 100) * 0.45 + Math.random() * 0.1, 0.95),
              f1Score: Math.min(0.42 + (newProgress / 100) * 0.48 + Math.random() * 0.1, 0.95),
              trainingLoss: Math.max(1.0 - (newProgress / 100) * 0.8 - Math.random() * 0.1, 0.05),
              validationLoss: Math.max(1.0 - (newProgress / 100) * 0.75 - Math.random() * 0.1, 0.08)
            }
          };
        }
        return session;
      }));
    }, 2000);

    // Stop simulation when training completes
    setTimeout(() => {
      clearInterval(interval);
    }, 30000);

    toast.success(`Started training: ${name}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatMetric = (value: number, isPercentage = true) => {
    return isPercentage ? `${(value * 100).toFixed(1)}%` : value.toFixed(3);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Gemini AI Integration & Model Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connection" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="training">Model Training</TabsTrigger>
              <TabsTrigger value="datasets">Datasets</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gemini AI Connection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Gemini API Key
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Enter your Gemini API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={testConnection} 
                        disabled={isProcessing || !apiKey}
                      >
                        {isProcessing ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-600 font-medium">Connected to Gemini AI</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="text-yellow-600 font-medium">Not connected</span>
                      </>
                    )}
                  </div>

                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      Get your Gemini API key from Google AI Studio. The API provides advanced 
                      multimodal AI capabilities for analyzing PCBs, components, and electronic systems.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Eye className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <h4 className="font-medium">Vision Analysis</h4>
                          <p className="text-sm text-muted-foreground">
                            Advanced image understanding for PCB analysis
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                          <h4 className="font-medium">Natural Language</h4>
                          <p className="text-sm text-muted-foreground">
                            Intelligent text analysis and generation
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Layers className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <h4 className="font-medium">Multimodal</h4>
                          <p className="text-sm text-muted-foreground">
                            Combined text and image understanding
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Analysis Prompt
                    </label>
                    <Textarea
                      placeholder="Describe what you want to analyze (e.g., 'Analyze this PCB for component health and potential issues')"
                      value={currentTask}
                      onChange={(e) => setCurrentTask(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => analyzeWithGemini(currentTask)}
                      disabled={!isConnected || isProcessing || !currentTask}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setCurrentTask('Analyze this electronic device for component identification, health assessment, and potential failure points. Provide detailed technical insights and repair recommendations.');
                        analyzeWithGemini('Analyze this electronic device for component identification, health assessment, and potential failure points. Provide detailed technical insights and repair recommendations.');
                      }}
                      disabled={!isConnected || isProcessing}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Quick PCB Analysis
                    </Button>
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={progress} />
                      <p className="text-sm text-muted-foreground">{currentTask}</p>
                    </div>
                  )}

                  {analysisResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Analysis Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                          {analysisResult}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(analysisResult)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Copy Result
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setAnalysisResult('')}
                          >
                            Clear
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Start New Training</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Model Name</label>
                      <Input placeholder="e.g., PCB Defect Detector v3.0" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Dataset</label>
                      <select className="w-full p-2 border rounded">
                        {datasets.map(dataset => (
                          <option key={dataset.name} value={dataset.name}>
                            {dataset.name} ({dataset.size} samples)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Epochs</label>
                        <Input type="number" defaultValue="100" min="1" max="1000" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Learning Rate</label>
                        <Input type="number" defaultValue="0.001" min="0.0001" max="0.1" step="0.0001" />
                      </div>
                    </div>

                    <Button 
                      onClick={() => startNewTraining('PCB Analysis Model v3.0', 'PCB Components Dataset')}
                      className="w-full"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Start Training
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Training Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {trainingSessions.filter(s => s.status === 'running').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Running</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {trainingSessions.filter(s => s.status === 'completed').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {trainingSessions.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Recent Sessions</h4>
                        {trainingSessions.slice(0, 3).map(session => (
                          <div key={session.id} className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{session.name}</span>
                              <Badge className={getStatusColor(session.status)}>
                                {session.status}
                              </Badge>
                            </div>
                            <Progress value={session.progress} className="mb-2" />
                            <div className="text-xs text-muted-foreground">
                              Accuracy: {formatMetric(session.metrics.accuracy)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Training Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trainingSessions.map(session => (
                      <Card key={session.id}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div>
                              <h4 className="font-medium mb-2">{session.name}</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Status:</span>
                                  <Badge className={getStatusColor(session.status)}>
                                    {session.status}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Progress:</span>
                                  <span>{session.progress.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Dataset Size:</span>
                                  <span>{session.datasetSize.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Epochs:</span>
                                  <span>{session.epochs}</span>
                                </div>
                              </div>
                              <Progress value={session.progress} className="mt-2" />
                            </div>

                            <div>
                              <h5 className="font-medium mb-2">Performance Metrics</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Accuracy:</span>
                                  <span>{formatMetric(session.metrics.accuracy)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Precision:</span>
                                  <span>{formatMetric(session.metrics.precision)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Recall:</span>
                                  <span>{formatMetric(session.metrics.recall)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>F1 Score:</span>
                                  <span>{formatMetric(session.metrics.f1Score)}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium mb-2">Training Info</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Started:</span>
                                  <span>{session.startTime.toLocaleDateString()}</span>
                                </div>
                                {session.endTime && (
                                  <div className="flex justify-between">
                                    <span>Completed:</span>
                                    <span>{session.endTime.toLocaleDateString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Learning Rate:</span>
                                  <span>{session.learningRate}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Training Loss:</span>
                                  <span>{formatMetric(session.metrics.trainingLoss, false)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="datasets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Training Datasets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {datasets.map(dataset => (
                      <Card key={dataset.name}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium">{dataset.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {dataset.size.toLocaleString()} samples
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Quality</span>
                                <Badge className={getQualityColor(dataset.quality)}>
                                  {dataset.quality}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Last updated: {dataset.lastUpdated.toLocaleDateString()}
                              </p>
                            </div>

                            <div>
                              <span className="text-sm font-medium">Categories:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {dataset.categories.slice(0, 3).map(category => (
                                  <Badge key={category} variant="secondary" className="text-xs">
                                    {category}
                                  </Badge>
                                ))}
                                {dataset.categories.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{dataset.categories.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                <Upload className="h-3 w-3 mr-1" />
                                Update
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Upload New Dataset</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Dataset Name</label>
                          <Input placeholder="e.g., Mobile Device Components" />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Category</label>
                          <select className="w-full p-2 border rounded">
                            <option>Component Detection</option>
                            <option>Defect Classification</option>
                            <option>Board Layout Analysis</option>
                            <option>Thermal Analysis</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Upload Files</label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Drag and drop your dataset files here, or click to browse
                          </p>
                          <Button variant="outline" className="mt-2">
                            Browse Files
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Model Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Temperature ({modelConfig.temperature})
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={modelConfig.temperature}
                          onChange={(e) => setModelConfig(prev => ({ 
                            ...prev, 
                            temperature: parseFloat(e.target.value) 
                          }))}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Controls randomness in outputs. Lower = more focused, Higher = more creative
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Top-P ({modelConfig.topP})
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={modelConfig.topP}
                          onChange={(e) => setModelConfig(prev => ({ 
                            ...prev, 
                            topP: parseFloat(e.target.value) 
                          }))}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Nucleus sampling parameter. Controls diversity of token selection.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Max Tokens
                        </label>
                        <Input
                          type="number"
                          value={modelConfig.maxTokens}
                          onChange={(e) => setModelConfig(prev => ({ 
                            ...prev, 
                            maxTokens: parseInt(e.target.value) 
                          }))}
                          min="1"
                          max="8192"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum number of tokens to generate
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Top-K
                        </label>
                        <Input
                          type="number"
                          value={modelConfig.topK}
                          onChange={(e) => setModelConfig(prev => ({ 
                            ...prev, 
                            topK: parseInt(e.target.value) 
                          }))}
                          min="1"
                          max="100"
                        />
                        <p className="text-xs text-muted-foreground">
                          Limits the number of highest probability tokens to consider
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={() => toast.success('Configuration saved!')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeminiAIIntegration;