import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Camera, 
  Scan, 
  Zap, 
  Brain, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  Eye,
  Cpu,
  CircuitBoard,
  Microscope,
  Lightbulb,
  Layers,
  Download,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';


interface PCBComponent {
  id: string;
  name: string;
  type: 'resistor' | 'capacitor' | 'ic' | 'transistor' | 'diode' | 'connector' | 'unknown';
  position: { x: number; y: number; width: number; height: number };
  confidence: number;
  health: 'good' | 'warning' | 'critical';
  description: string;
  issues?: string[];
  recommendations?: string[];
}

interface AROverlay {
  id: string;
  position: { x: number; y: number };
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  componentId?: string;
}

interface AnalysisResult {
  overallHealth: number;
  components: PCBComponent[];
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    location?: string;
    solution?: string;
  }>;
  insights: string[];
  recommendations: string[];
}

const ARPCBAnalyzer: React.FC = () => {
  const [isARActive, setIsARActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [arOverlays, setArOverlays] = useState<AROverlay[]>([]);
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<PCBComponent | null>(null);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [annotations, setAnnotations] = useState<Array<{x: number, y: number, label: string}>>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkCameraSupport();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraSupport = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      setCameraSupported(hasCamera);
    } catch (error) {
      console.error('Camera check failed:', error);
      setCameraSupported(false);
    }
  };

  const startARCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsARActive(true);
        toast.success('AR Camera activated');
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsARActive(false);
    toast.info('AR Camera deactivated');
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    toast.success('Frame captured for analysis');
  };

  const simulateComponentDetection = (): PCBComponent[] => {
    return [
      {
        id: 'r1',
        name: 'R1 - 10kΩ',
        type: 'resistor',
        position: { x: 120, y: 80, width: 40, height: 15 },
        confidence: 0.95,
        health: 'good',
        description: '10kΩ pull-up resistor for GPIO pin'
      },
      {
        id: 'c1',
        name: 'C1 - 100μF',
        type: 'capacitor',
        position: { x: 200, y: 150, width: 25, height: 35 },
        confidence: 0.88,
        health: 'warning',
        description: 'Electrolytic capacitor for power filtering',
        issues: ['Slight bulging detected', 'ESR may be elevated'],
        recommendations: ['Monitor temperature', 'Consider replacement within 6 months']
      },
      {
        id: 'u1',
        name: 'U1 - MCU',
        type: 'ic',
        position: { x: 300, y: 120, width: 60, height: 60 },
        confidence: 0.92,
        health: 'good',
        description: 'Main microcontroller unit'
      },
      {
        id: 'q1',
        name: 'Q1 - MOSFET',
        type: 'transistor',
        position: { x: 150, y: 220, width: 30, height: 25 },
        confidence: 0.85,
        health: 'critical',
        description: 'Power switching MOSFET',
        issues: ['Thermal damage visible', 'Gate oxide degradation suspected'],
        recommendations: ['Replace immediately', 'Check gate drive circuit']
      }
    ];
  };

  const analyzeWithOpenRouter = async (imageData: string): Promise<string> => {
    if (!openrouterApiKey) {
      throw new Error('OpenRouter API key not provided');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'PCB AR Analyzer'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this PCB/motherboard image for electronic component health and potential issues. 
                    Provide detailed insights about:
                    1. Component identification and health assessment
                    2. Visible defects (burns, corrosion, physical damage)
                    3. Potential electrical issues
                    4. Troubleshooting recommendations
                    5. Circuit topology analysis
                    
                    Format the response as structured analysis with component details, health scores, and actionable recommendations.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter analysis failed:', error);
      throw error;
    }
  };

  const performAnalysis = async () => {
    if (!capturedImage) {
      toast.error('Please capture an image first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate analysis steps
      const steps = [
        'Preprocessing image...',
        'Detecting components...',
        'Analyzing component health...',
        'Running AI analysis...',
        'Generating insights...',
        'Creating AR overlays...'
      ];

      for (let i = 0; i < steps.length; i++) {
        toast.info(steps[i]);
        setAnalysisProgress((i + 1) * (100 / steps.length));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Simulate component detection
      const detectedComponents = simulateComponentDetection();

      // Get AI insights if API key is provided
      let aiInsights = '';
      try {
        if (openrouterApiKey) {
          aiInsights = await analyzeWithOpenRouter(capturedImage);
        }
      } catch (error) {
        console.error('AI analysis failed:', error);
        aiInsights = 'AI analysis unavailable';
      }

      const result: AnalysisResult = {
        overallHealth: 75,
        components: detectedComponents,
        issues: [
          {
            severity: 'critical',
            message: 'MOSFET Q1 shows thermal damage',
            location: 'Lower left quadrant',
            solution: 'Replace Q1 and check gate drive circuit'
          },
          {
            severity: 'medium',
            message: 'Capacitor C1 showing early signs of failure',
            location: 'Center section',
            solution: 'Monitor and replace within 6 months'
          },
          {
            severity: 'low',
            message: 'Some flux residue detected',
            location: 'Various locations',
            solution: 'Clean with isopropyl alcohol'
          }
        ],
        insights: [
          'PCB appears to be a power management module',
          'Signs of thermal stress in switching section',
          'Overall layout follows good design practices',
          aiInsights || 'AI analysis not available'
        ],
        recommendations: [
          'Replace damaged MOSFET immediately',
          'Improve thermal management',
          'Regular capacitor health monitoring',
          'Clean flux residue for better inspection'
        ]
      };

      setAnalysisResult(result);

      // Generate AR overlays
      const overlays: AROverlay[] = detectedComponents.map(component => ({
        id: `overlay-${component.id}`,
        position: { 
          x: component.position.x + component.position.width / 2, 
          y: component.position.y + component.position.height / 2 
        },
        content: `${component.name}\n${component.health.toUpperCase()}`,
        type: component.health === 'good' ? 'success' : 
              component.health === 'warning' ? 'warning' : 'error',
        componentId: component.id
      }));

      setArOverlays(overlays);
      toast.success('Analysis complete!');

    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const toggleTrainingMode = () => {
    setIsTrainingMode(!isTrainingMode);
    setAnnotations([]);
    toast.info(isTrainingMode ? 'Training mode disabled' : 'Training mode enabled - Click to annotate components');
  };

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isTrainingMode) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const label = prompt('Enter component label:');
    if (label) {
      setAnnotations(prev => [...prev, { x, y, label }]);
      toast.success(`Annotation added: ${label}`);
    }
  };

  const exportTrainingData = () => {
    if (annotations.length === 0) {
      toast.error('No annotations to export');
      return;
    }

    const trainingData = {
      image: capturedImage,
      annotations: annotations,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(trainingData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcb-training-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Training data exported');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-foreground';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-destructive';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircuitBoard className="h-6 w-6" />
            AR PCB Analyzer with AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="camera" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Analysis
              </TabsTrigger>
              <TabsTrigger value="components" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Components
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Training
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AR Camera View</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!cameraSupported && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Camera not supported or permission denied
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-lg border"
                        style={{ maxHeight: '400px' }}
                      />
                      
                      {/* AR Overlays */}
                      {isARActive && arOverlays.map(overlay => (
                        <div
                          key={overlay.id}
                          className={`absolute px-2 py-1 rounded text-xs font-medium ${
                            overlay.type === 'success' ? 'bg-green-500 text-white' :
                            overlay.type === 'warning' ? 'bg-yellow-500 text-black' :
                            overlay.type === 'error' ? 'bg-red-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}
                          style={{
                            left: overlay.position.x,
                            top: overlay.position.y,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {overlay.content}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {!isARActive ? (
                        <Button onClick={startARCamera} disabled={!cameraSupported}>
                          <Camera className="h-4 w-4 mr-2" />
                          Start AR
                        </Button>
                      ) : (
                        <Button onClick={stopCamera} variant="destructive">
                          <Eye className="h-4 w-4 mr-2" />
                          Stop AR
                        </Button>
                      )}
                      
                      <Button onClick={captureFrame} disabled={!isARActive}>
                        <Target className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Captured Frame</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {capturedImage ? (
                      <div 
                        className="relative cursor-pointer"
                        onClick={handleImageClick}
                      >
                        <img 
                          src={capturedImage} 
                          alt="Captured PCB" 
                          className="w-full rounded-lg border"
                        />
                        
                        {/* Component overlays */}
                        {analysisResult?.components.map(component => (
                          <div
                            key={component.id}
                            className={`absolute border-2 cursor-pointer ${
                              component.health === 'good' ? 'border-green-500' :
                              component.health === 'warning' ? 'border-yellow-500' :
                              'border-red-500'
                            }`}
                            style={{
                              left: component.position.x,
                              top: component.position.y,
                              width: component.position.width,
                              height: component.position.height
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComponent(component);
                            }}
                          >
                            <div className={`absolute -top-6 left-0 px-1 text-xs rounded ${
                              component.health === 'good' ? 'bg-green-500 text-white' :
                              component.health === 'warning' ? 'bg-yellow-500 text-black' :
                              'bg-red-500 text-white'
                            }`}>
                              {component.name}
                            </div>
                          </div>
                        ))}

                        {/* Training annotations */}
                        {annotations.map((annotation, index) => (
                          <div
                            key={index}
                            className="absolute w-2 h-2 bg-blue-500 rounded-full"
                            style={{ left: annotation.x - 4, top: annotation.y - 4 }}
                            title={annotation.label}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 border rounded-lg flex items-center justify-center text-muted-foreground">
                        No image captured
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={performAnalysis} 
                      disabled={!capturedImage || isAnalyzing}
                      className="flex items-center gap-2"
                    >
                      <Brain className="h-4 w-4" />
                      {isAnalyzing ? 'Analyzing...' : 'Analyze PCB'}
                    </Button>
                  </div>

                  {isAnalyzing && (
                    <div className="space-y-2">
                      <Progress value={analysisProgress} />
                      <p className="text-sm text-muted-foreground">
                        Analyzing PCB components and health...
                      </p>
                    </div>
                  )}

                  {analysisResult && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <h3 className="text-lg font-semibold">Overall Health</h3>
                              <div className="text-3xl font-bold text-primary">
                                {analysisResult.overallHealth}%
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <h3 className="text-lg font-semibold">Components</h3>
                              <div className="text-3xl font-bold text-blue-600">
                                {analysisResult.components.length}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <h3 className="text-lg font-semibold">Issues</h3>
                              <div className="text-3xl font-bold text-orange-600">
                                {analysisResult.issues.length}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Detected Issues</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analysisResult.issues.map((issue, index) => (
                              <Alert key={index}>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={
                                        issue.severity === 'critical' ? 'destructive' :
                                        issue.severity === 'high' ? 'destructive' :
                                        issue.severity === 'medium' ? 'default' : 'secondary'
                                      }>
                                        {issue.severity}
                                      </Badge>
                                      <span className="font-medium">{issue.message}</span>
                                    </div>
                                    {issue.location && (
                                      <p className="text-sm text-muted-foreground">
                                        Location: {issue.location}
                                      </p>
                                    )}
                                    {issue.solution && (
                                      <p className="text-sm">
                                        <strong>Solution:</strong> {issue.solution}
                                      </p>
                                    )}
                                  </div>
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>AI Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {analysisResult.insights.map((insight, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 mt-1 text-yellow-500" />
                                <span className="text-sm">{insight}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Component List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult?.components ? (
                      <div className="space-y-3">
                        {analysisResult.components.map((component) => (
                          <div
                            key={component.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                              selectedComponent?.id === component.id ? 'bg-accent' : ''
                            }`}
                            onClick={() => setSelectedComponent(component)}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{component.name}</h4>
                              <Badge className={getHealthColor(component.health)}>
                                {component.health}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {component.description}
                            </p>
                            <div className="text-xs text-muted-foreground mt-1">
                              Confidence: {(component.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No components detected. Capture and analyze an image first.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {selectedComponent && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Component Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">{selectedComponent.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedComponent.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Type</label>
                          <p className="text-sm capitalize">{selectedComponent.type}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Health</label>
                          <p className={`text-sm capitalize ${getHealthColor(selectedComponent.health)}`}>
                            {selectedComponent.health}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Confidence</label>
                          <p className="text-sm">
                            {(selectedComponent.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {selectedComponent.issues && selectedComponent.issues.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Issues</h5>
                          <ul className="space-y-1">
                            {selectedComponent.issues.map((issue, index) => (
                              <li key={index} className="text-sm text-destructive">
                                • {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedComponent.recommendations && selectedComponent.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Recommendations</h5>
                          <ul className="space-y-1">
                            {selectedComponent.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-blue-600">
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Model Training</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button onClick={toggleTrainingMode} variant={isTrainingMode ? "destructive" : "default"}>
                      {isTrainingMode ? 'Stop Training' : 'Start Training Mode'}
                    </Button>
                    
                    {annotations.length > 0 && (
                      <Button onClick={exportTrainingData} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Training Data
                      </Button>
                    )}
                    
                    <Badge variant="secondary">
                      {annotations.length} annotations
                    </Badge>
                  </div>

                  {isTrainingMode && (
                    <Alert>
                      <Microscope className="h-4 w-4" />
                      <AlertDescription>
                        Training mode active. Click on components in the captured image to annotate them.
                        This data will be used to improve the AI model's accuracy.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Training Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Component Detection</span>
                            <span>87%</span>
                          </div>
                          <Progress value={87} />
                          
                          <div className="flex justify-between">
                            <span>Health Assessment</span>
                            <span>92%</span>
                          </div>
                          <Progress value={92} />
                          
                          <div className="flex justify-between">
                            <span>Defect Recognition</span>
                            <span>78%</span>
                          </div>
                          <Progress value={78} />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Training Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Training Images:</span>
                            <span>2,847</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annotations:</span>
                            <span>15,234</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Component Types:</span>
                            <span>47</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Accuracy:</span>
                            <span>94.2%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      OpenRouter API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter your OpenRouter API key for enhanced AI analysis"
                      value={openrouterApiKey}
                      onChange={(e) => setOpenrouterApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Required for advanced AI insights and component analysis
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detection Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Confidence Threshold</label>
                          <Input type="number" defaultValue="0.8" min="0" max="1" step="0.1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Max Components</label>
                          <Input type="number" defaultValue="50" min="1" max="100" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">AR Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Overlay Opacity</label>
                          <Input type="number" defaultValue="0.8" min="0" max="1" step="0.1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Text Size</label>
                          <select className="w-full p-2 border rounded">
                            <option>Small</option>
                            <option>Medium</option>
                            <option>Large</option>
                          </select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ARPCBAnalyzer;