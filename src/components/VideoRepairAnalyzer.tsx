import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Video, Upload, Camera, StopCircle, Play, AlertCircle, CheckCircle2, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as cocoSsd from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as objectDetection from '@tensorflow-models/coco-ssd';

interface RepairStep {
  step: number;
  title: string;
  description: string;
  warning?: string;
}

interface AnalysisResult {
  deviceType: string;
  issue: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
  tools: string[];
  steps: RepairStep[];
}

export default function VideoRepairAnalyzer() {
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('live');
  const [realtimeDetection, setRealtimeDetection] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<any[]>([]);
  const [model, setModel] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load TensorFlow.js object detection model
    const loadModel = async () => {
      try {
        const loadedModel = await objectDetection.load();
        setModel(loadedModel);
        console.log('Object detection model loaded');
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };
    loadModel();

    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        cancelAnimationFrame(detectionIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (realtimeDetection && isScanning && model && videoRef.current) {
      detectObjects();
    } else if (!realtimeDetection && detectionIntervalRef.current) {
      cancelAnimationFrame(detectionIntervalRef.current);
    }
  }, [realtimeDetection, isScanning, model]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (detectionIntervalRef.current) {
      cancelAnimationFrame(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsScanning(false);
    setRealtimeDetection(false);
    setDetectedObjects([]);
  };

  const detectObjects = async () => {
    if (!model || !videoRef.current || !overlayCanvasRef.current || !realtimeDetection) {
      return;
    }

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Match canvas size to video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        const predictions = await model.detect(video);
        setDetectedObjects(predictions);
        drawBoundingBoxes(predictions, canvas);
      } catch (error) {
        console.error('Error detecting objects:', error);
      }
    }

    detectionIntervalRef.current = requestAnimationFrame(detectObjects);
  };

  const drawBoundingBoxes = (predictions: any[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      const score = (prediction.score * 100).toFixed(1);
      
      // Determine color based on confidence
      const confidence = prediction.score;
      let boxColor = 'rgba(0, 255, 0, 0.8)'; // Green for high confidence
      if (confidence < 0.5) boxColor = 'rgba(255, 165, 0, 0.8)'; // Orange for medium
      if (confidence < 0.3) boxColor = 'rgba(255, 0, 0, 0.8)'; // Red for low

      // Draw bounding box with glow effect
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = boxColor;
      ctx.shadowBlur = 10;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      const label = `${prediction.class} ${score}%`;
      ctx.font = 'bold 16px Arial';
      const textWidth = ctx.measureText(label).width;
      const textHeight = 20;
      
      ctx.fillStyle = boxColor;
      ctx.shadowBlur = 0;
      ctx.fillRect(x, y - textHeight - 4, textWidth + 10, textHeight + 4);

      // Draw label text
      ctx.fillStyle = '#000';
      ctx.fillText(label, x + 5, y - 8);

      // Draw corner markers for AR effect
      const cornerLength = 20;
      ctx.lineWidth = 4;
      ctx.strokeStyle = boxColor;
      ctx.shadowBlur = 15;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLength);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLength, y);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - cornerLength, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + cornerLength);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(x, y + height - cornerLength);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + cornerLength, y + height);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - cornerLength, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y + height - cornerLength);
      ctx.stroke();

      // Add scanning line animation effect
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const scanY = y + (Date.now() % 1000) / 1000 * height;
      ctx.moveTo(x, scanY);
      ctx.lineTo(x + width, scanY);
      ctx.stroke();
    });
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const captureMultipleFrames = async () => {
    const frames: string[] = [];
    for (let i = 0; i < 3; i++) {
      const frame = captureFrame();
      if (frame) {
        frames.push(frame);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return frames;
  };

  const extractFramesFromVideo = async (videoFile: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];
      
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const duration = video.duration;
        const frameCount = Math.min(5, Math.floor(duration));
        const interval = duration / frameCount;
        let currentFrame = 0;
        
        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            frames.push(canvas.toDataURL('image/jpeg', 0.8));
            currentFrame++;
            
            if (currentFrame < frameCount) {
              video.currentTime = currentFrame * interval;
            } else {
              URL.revokeObjectURL(video.src);
              resolve(frames);
            }
          }
        };
        
        video.currentTime = 0;
      };
    });
  };

  const analyzeFrames = async (frames: string[]) => {
    setIsAnalyzing(true);
    setProgress(0);

    try {
      const systemPrompt = `You are an expert electronics repair technician. Analyze the images showing an electronic device and provide detailed repair guidance. 

Your response MUST be a valid JSON object with this exact structure:
{
  "deviceType": "detected device type",
  "issue": "identified problem",
  "difficulty": "Easy/Medium/Hard",
  "estimatedTime": "time estimate",
  "tools": ["tool1", "tool2"],
  "steps": [
    {
      "step": 1,
      "title": "step title",
      "description": "detailed instructions",
      "warning": "optional safety warning"
    }
  ]
}`;

      const prompt = `Analyze these images of an electronic device and provide step-by-step repair instructions. Include the device type, identified issue, difficulty level, estimated repair time, required tools, and detailed repair steps with safety warnings where needed.`;

      setProgress(30);

      const { data, error } = await supabase.functions.invoke('openrouter-ai', {
        body: {
          prompt,
          systemPrompt,
          image: frames[0],
          model: 'google/gemini-2.5-flash'
        }
      });

      setProgress(70);

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'AI Analysis Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setProgress(90);

      let result = data.response;
      
      // Clean up markdown code blocks if present
      if (result.includes('```json')) {
        result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const parsedResult = JSON.parse(result.trim());
      setAnalysisResult(parsedResult);
      
      setProgress(100);
      
      toast({
        title: 'Analysis Complete',
        description: 'Repair guide generated successfully!',
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze video',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleLiveScan = async () => {
    const frames = await captureMultipleFrames();
    if (frames.length > 0) {
      setCapturedFrames(frames);
      await analyzeFrames(frames);
      stopCamera();
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a video file',
        variant: 'destructive',
      });
      return;
    }

    setUploadedVideo(URL.createObjectURL(file));
    
    toast({
      title: 'Processing Video',
      description: 'Extracting frames for analysis...',
    });

    const frames = await extractFramesFromVideo(file);
    setCapturedFrames(frames);
    await analyzeFrames(frames);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-6 h-6" />
            Video Repair Analyzer
          </CardTitle>
          <CardDescription>
            Scan or upload a video of your device to get AI-powered repair guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="live">
                <Camera className="w-4 h-4 mr-2" />
                Live Scan
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="space-y-4">
              {isScanning && model && (
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Scan className="w-5 h-5 text-primary" />
                    <div>
                      <Label htmlFor="realtime-detection" className="text-sm font-medium">
                        Real-time Object Detection
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        AI-powered component identification with AR overlay
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="realtime-detection"
                    checked={realtimeDetection}
                    onCheckedChange={setRealtimeDetection}
                  />
                </div>
              )}

              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ mixBlendMode: 'screen' }}
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button onClick={startCamera} size="lg">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
                {realtimeDetection && detectedObjects.length > 0 && (
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-primary/50">
                    <p className="text-xs font-semibold text-primary flex items-center gap-2">
                      <Scan className="w-3 h-3 animate-pulse" />
                      Detected: {detectedObjects.length} objects
                    </p>
                  </div>
                )}
              </div>
              
              {isScanning && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleLiveScan} disabled={isAnalyzing}>
                    <Play className="w-4 h-4 mr-2" />
                    Analyze Device
                  </Button>
                  <Button onClick={stopCamera} variant="destructive">
                    <StopCircle className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
                  Select Video File
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload a video showing the device from multiple angles
                </p>
              </div>
              
              {uploadedVideo && (
                <video
                  src={uploadedVideo}
                  controls
                  className="w-full rounded-lg"
                />
              )}
            </TabsContent>
          </Tabs>

          {isAnalyzing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analyzing video frames...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {capturedFrames.length > 0 && !isAnalyzing && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Captured Frames</h4>
              <div className="grid grid-cols-3 gap-2">
                {capturedFrames.map((frame, idx) => (
                  <img
                    key={idx}
                    src={frame}
                    alt={`Frame ${idx + 1}`}
                    className="rounded-lg border"
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{analysisResult.deviceType}</CardTitle>
                <CardDescription className="mt-1">
                  Issue: {analysisResult.issue}
                </CardDescription>
              </div>
              <Badge className={getDifficultyColor(analysisResult.difficulty)}>
                {analysisResult.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Estimated Time</h4>
                <p className="text-2xl font-bold">{analysisResult.estimatedTime}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Required Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.tools.map((tool, idx) => (
                    <Badge key={idx} variant="outline">{tool}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Repair Steps
              </h3>
              <div className="space-y-4">
                {analysisResult.steps.map((step) => (
                  <Card key={step.step}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Step {step.step}: {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.warning && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Warning:</strong> {step.warning}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
