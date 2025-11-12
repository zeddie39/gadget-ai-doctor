import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Video, Upload, Camera, StopCircle, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
    setIsScanning(false);
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
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button onClick={startCamera} size="lg">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
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
