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
import { Video, Upload, Camera, StopCircle, Play, AlertCircle, CheckCircle2, Scan, Save, History, TrendingUp, Package, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as cocoSsd from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as objectDetection from '@tensorflow-models/coco-ssd';
import { Input } from '@/components/ui/input';

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

interface DamageHistory {
  id: string;
  device_id: string;
  device_type: string | null;
  scan_timestamp: string;
  damaged_areas: any;
  total_damage_count: number;
  severity_summary: any;
  image_data_url: string | null;
  notes: string | null;
}

interface SparePart {
  id: string;
  part_name: string;
  part_category: string;
  compatible_devices: string[];
  price: number;
  stock_quantity: number;
  supplier: string | null;
  sku: string | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
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
  const [damageDetection, setDamageDetection] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<any[]>([]);
  const [damagedAreas, setDamagedAreas] = useState<any[]>([]);
  const [model, setModel] = useState<any>(null);
  const [annotatedScreenshots, setAnnotatedScreenshots] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [deviceType, setDeviceType] = useState<string>('');
  const [damageHistory, setDamageHistory] = useState<DamageHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<{
    overallSeverity: string;
    urgencyLevel: string;
    estimatedCost: { min: number; max: number };
    repairRecommendation: string;
    componentAnalysis: Array<{ component: string; severity: string; urgency: string; cost: string }>;
  } | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [availableParts, setAvailableParts] = useState<SparePart[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  
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
    if ((realtimeDetection || damageDetection) && isScanning && videoRef.current) {
      if (realtimeDetection && model) {
        detectObjects();
      } else if (damageDetection) {
        detectDamage();
      }
    } else if (!realtimeDetection && !damageDetection && detectionIntervalRef.current) {
      cancelAnimationFrame(detectionIntervalRef.current);
    }
  }, [realtimeDetection, damageDetection, isScanning, model]);

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
    setDamageDetection(false);
    setDetectedObjects([]);
    setDamagedAreas([]);
  };

  const detectObjects = async () => {
    if (!model || !videoRef.current || !overlayCanvasRef.current || !realtimeDetection) {
      return;
    }

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        const predictions = await model.detect(video);
        setDetectedObjects(predictions);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawBoundingBoxes(predictions, ctx);
          if (damageDetection) {
            drawDamageOverlays(ctx);
          }
        }
      } catch (error) {
        console.error('Error detecting objects:', error);
      }
    }

    detectionIntervalRef.current = requestAnimationFrame(detectObjects);
  };

  const detectDamage = () => {
    if (!videoRef.current || !overlayCanvasRef.current || !damageDetection) {
      return;
    }

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) return;

      tempCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
      const damaged = analyzeDamage(imageData);
      setDamagedAreas(damaged);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawDamageOverlays(ctx, damaged);
        if (realtimeDetection && detectedObjects.length > 0) {
          drawBoundingBoxes(detectedObjects, ctx);
        }
      }
    }

    detectionIntervalRef.current = requestAnimationFrame(detectDamage);
  };

  const analyzeDamage = (imageData: ImageData): any[] => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const damaged: any[] = [];
    const blockSize = 20; // Analyze in 20x20 pixel blocks

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let darkPixels = 0;
        let brownPixels = 0;
        let greenPixels = 0;
        let totalPixels = 0;

        // Analyze block
        for (let by = 0; by < blockSize && y + by < height; by++) {
          for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
            const idx = ((y + by) * width + (x + bx)) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            totalPixels++;

            // Detect burnt areas (very dark or black)
            if (r < 60 && g < 60 && b < 60) {
              darkPixels++;
            }

            // Detect brown discoloration (burnt components)
            if (r > 80 && r < 150 && g > 40 && g < 100 && b < 80) {
              brownPixels++;
            }

            // Detect green corrosion (oxidation on copper)
            if (g > r * 1.2 && g > b * 1.2 && g > 100) {
              greenPixels++;
            }
          }
        }

        const darkRatio = darkPixels / totalPixels;
        const brownRatio = brownPixels / totalPixels;
        const greenRatio = greenPixels / totalPixels;

        // Flag damaged areas
        if (darkRatio > 0.3) {
          damaged.push({
            x,
            y,
            width: blockSize,
            height: blockSize,
            type: 'burnt',
            severity: Math.min(darkRatio * 2, 1),
          });
        } else if (brownRatio > 0.4) {
          damaged.push({
            x,
            y,
            width: blockSize,
            height: blockSize,
            type: 'discolored',
            severity: Math.min(brownRatio * 1.5, 1),
          });
        } else if (greenRatio > 0.4) {
          damaged.push({
            x,
            y,
            width: blockSize,
            height: blockSize,
            type: 'corrosion',
            severity: Math.min(greenRatio * 1.5, 1),
          });
        }
      }
    }

    return damaged;
  };

  const drawDamageOverlays = (ctx: CanvasRenderingContext2D, areas: any[] = damagedAreas) => {
    areas.forEach((area) => {
      let color;
      let label;

      switch (area.type) {
        case 'burnt':
          color = `rgba(255, 0, 0, ${0.3 + area.severity * 0.4})`;
          label = '⚠ BURNT';
          break;
        case 'discolored':
          color = `rgba(255, 165, 0, ${0.3 + area.severity * 0.4})`;
          label = '⚠ DAMAGED';
          break;
        case 'corrosion':
          color = `rgba(0, 255, 0, ${0.3 + area.severity * 0.4})`;
          label = '⚠ CORROSION';
          break;
        default:
          return;
      }

      // Draw semi-transparent overlay
      ctx.fillStyle = color;
      ctx.fillRect(area.x, area.y, area.width, area.height);

      // Draw border
      ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.9)');
      ctx.lineWidth = 2;
      ctx.strokeRect(area.x, area.y, area.width, area.height);

      // Draw warning icon and label
      ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
      ctx.font = 'bold 12px Arial';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(area.x, area.y - 18, textWidth + 8, 16);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, area.x + 4, area.y - 6);

      // Draw pulsing effect for high severity
      if (area.severity > 0.7) {
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 0, 0, ${pulse})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(area.x - 2, area.y - 2, area.width + 4, area.height + 4);
      }
    });
  };

  const drawBoundingBoxes = (predictions: any[], ctx: CanvasRenderingContext2D) => {
    if (!ctx) return;

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

  const captureAnnotatedScreenshot = () => {
    if (!videoRef.current || !overlayCanvasRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const captureCanvas = canvasRef.current;

    // Set canvas dimensions to match video
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;

    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    // Draw overlay annotations on top
    ctx.drawImage(overlayCanvas, 0, 0, captureCanvas.width, captureCanvas.height);

    // Add timestamp
    const timestamp = new Date().toLocaleString();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, captureCanvas.height - 40, 250, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(timestamp, 20, captureCanvas.height - 20);

    // Convert to data URL
    const screenshot = captureCanvas.toDataURL('image/png');
    setAnnotatedScreenshots(prev => [screenshot, ...prev]);

    toast({
      title: 'Screenshot Captured',
      description: `Captured with ${detectedObjects.length} detected objects`,
    });
  };

  const downloadScreenshot = (screenshot: string, index: number) => {
    const link = document.createElement('a');
    link.download = `repair-analysis-${Date.now()}-${index}.png`;
    link.href = screenshot;
    link.click();

    toast({
      title: 'Download Started',
      description: 'Annotated screenshot saved to your device',
    });
  };

  const shareScreenshot = async (screenshot: string) => {
    try {
      // Convert base64 to blob
      const response = await fetch(screenshot);
      const blob = await response.blob();
      const file = new File([blob], `repair-analysis-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Device Repair Analysis',
          text: `Detected ${detectedObjects.length} components for analysis`,
          files: [file],
        });

        toast({
          title: 'Shared Successfully',
          description: 'Screenshot shared',
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);

        toast({
          title: 'Copied to Clipboard',
          description: 'Screenshot copied, paste it where you need',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Share Failed',
        description: 'Unable to share screenshot',
        variant: 'destructive',
      });
    }
  };

  const saveDamageHistory = async () => {
    if (!deviceId || damagedAreas.length === 0) {
      toast({
        title: 'Cannot Save',
        description: 'Please enter a device ID and ensure damage is detected',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Capture current frame with damage overlay
      const screenshot = captureFrame();

      // Calculate severity summary
      const severitySummary = {
        critical: damagedAreas.filter(a => a.severity > 0.8).length,
        high: damagedAreas.filter(a => a.severity > 0.6 && a.severity <= 0.8).length,
        medium: damagedAreas.filter(a => a.severity > 0.4 && a.severity <= 0.6).length,
        low: damagedAreas.filter(a => a.severity <= 0.4).length,
      };

      const { error } = await supabase
        .from('damage_detection_history')
        .insert({
          device_id: deviceId,
          device_type: deviceType || null,
          damaged_areas: damagedAreas,
          total_damage_count: damagedAreas.length,
          severity_summary: severitySummary,
          image_data_url: screenshot,
        });

      if (error) throw error;

      toast({
        title: 'Damage History Saved',
        description: `Saved scan with ${damagedAreas.length} damaged areas`,
      });

      // Refresh history
      await fetchDamageHistory();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Unable to save damage history',
        variant: 'destructive',
      });
    }
  };

  const fetchDamageHistory = async () => {
    if (!deviceId) return;

    try {
      const { data, error } = await supabase
        .from('damage_detection_history')
        .select('*')
        .eq('device_id', deviceId)
        .order('scan_timestamp', { ascending: false });

      if (error) throw error;

      setDamageHistory((data || []) as DamageHistory[]);
      setShowHistory(true);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Fetch Failed',
        description: 'Unable to load damage history',
        variant: 'destructive',
      });
    }
  };

  const calculateProgression = () => {
    if (damageHistory.length < 2) return null;

    const latest = damageHistory[0];
    const previous = damageHistory[1];
    
    const damageChange = latest.total_damage_count - previous.total_damage_count;
    const percentChange = ((damageChange / previous.total_damage_count) * 100).toFixed(1);
    
    return {
      damageChange,
      percentChange: parseFloat(percentChange),
      isImproving: damageChange < 0,
      isWorsening: damageChange > 0,
    };
  };

  const assessDamageSeverity = async () => {
    if (damagedAreas.length === 0) {
      toast({
        title: 'No Damage Detected',
        description: 'Please enable damage detection and scan the device first',
        variant: 'destructive',
      });
      return;
    }

    setIsAssessing(true);

    try {
      // Capture current frame for AI analysis
      const screenshot = captureFrame();
      
      // Prepare damage data summary
      const damageData = {
        totalAreas: damagedAreas.length,
        burnt: damagedAreas.filter(a => a.type === 'burnt').length,
        discolored: damagedAreas.filter(a => a.type === 'discolored').length,
        corrosion: damagedAreas.filter(a => a.type === 'corrosion').length,
        severityBreakdown: {
          critical: damagedAreas.filter(a => a.severity > 0.8).length,
          high: damagedAreas.filter(a => a.severity > 0.6 && a.severity <= 0.8).length,
          medium: damagedAreas.filter(a => a.severity > 0.4 && a.severity <= 0.6).length,
          low: damagedAreas.filter(a => a.severity <= 0.4).length,
        }
      };

      const systemPrompt = `You are an expert electronics repair technician specializing in damage assessment and cost estimation. Analyze the detected damage and provide detailed repair urgency and cost analysis.

Your response MUST be a valid JSON object with this exact structure:
{
  "overallSeverity": "Critical/High/Medium/Low",
  "urgencyLevel": "Immediate (24-48 hours)/Urgent (1 week)/Moderate (2-4 weeks)/Low (Can wait)",
  "estimatedCost": {
    "min": number,
    "max": number
  },
  "repairRecommendation": "detailed recommendation text",
  "componentAnalysis": [
    {
      "component": "component name",
      "severity": "Critical/High/Medium/Low",
      "urgency": "Immediate/Urgent/Moderate/Low",
      "cost": "$XX - $YY"
    }
  ]
}`;

      const prompt = `Analyze this electronic device image with the following detected damage:

Damage Summary:
- Total damaged areas: ${damageData.totalAreas}
- Burnt components: ${damageData.burnt}
- Discolored areas: ${damageData.discolored}
- Corrosion spots: ${damageData.corrosion}

Severity Distribution:
- Critical: ${damageData.severityBreakdown.critical}
- High: ${damageData.severityBreakdown.high}
- Medium: ${damageData.severityBreakdown.medium}
- Low: ${damageData.severityBreakdown.low}

Device Type: ${deviceType || 'Electronic device'}

Provide:
1. Overall severity assessment
2. Repair urgency level with timeframe
3. Estimated repair cost range in USD
4. Detailed recommendation for the user
5. Analysis of each major damaged component with individual severity, urgency, and cost estimates`;

      const { data, error } = await supabase.functions.invoke('openrouter-ai', {
        body: {
          prompt,
          systemPrompt,
          image: screenshot,
          model: 'google/gemini-2.5-flash'
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'AI Assessment Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      let result = data.response;
      
      // Clean up markdown code blocks if present
      if (result.includes('```json')) {
        result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const assessment = JSON.parse(result.trim());
      setAiAssessment(assessment);
      
      // Fetch relevant spare parts based on assessment
      await fetchRelevantParts(assessment);
      
      toast({
        title: 'Assessment Complete',
        description: 'AI-powered damage severity analysis completed',
      });

    } catch (error) {
      console.error('Assessment error:', error);
      toast({
        title: 'Assessment Failed',
        description: error instanceof Error ? error.message : 'Failed to assess damage',
        variant: 'destructive',
      });
    } finally {
      setIsAssessing(false);
    }
  };

  const fetchRelevantParts = async (assessment: any) => {
    setIsLoadingParts(true);
    try {
      // Extract component categories from assessment
      const categories = new Set<string>();
      assessment.componentAnalysis.forEach((comp: any) => {
        const componentLower = comp.component.toLowerCase();
        if (componentLower.includes('battery')) categories.add('battery');
        if (componentLower.includes('screen') || componentLower.includes('display')) categories.add('screen');
        if (componentLower.includes('motherboard') || componentLower.includes('board')) categories.add('motherboard');
        if (componentLower.includes('chip') || componentLower.includes('ic')) categories.add('ic_chip');
        if (componentLower.includes('capacitor')) categories.add('capacitor');
        if (componentLower.includes('camera')) categories.add('camera');
        if (componentLower.includes('speaker')) categories.add('speaker');
        if (componentLower.includes('charging') || componentLower.includes('port')) categories.add('connector');
      });

      // Fetch parts matching categories or device type
      let query = supabase
        .from('spare_parts_inventory')
        .select('*')
        .eq('is_available', true)
        .gt('stock_quantity', 0);

      // Filter by device type if available
      if (deviceType) {
        query = query.contains('compatible_devices', [deviceType]);
      }

      const { data, error } = await query.order('price', { ascending: true });

      if (error) throw error;

      // Filter results by categories if any were identified
      let filteredData = data || [];
      if (categories.size > 0) {
        filteredData = filteredData.filter(part => 
          categories.has(part.part_category)
        );
      }

      setAvailableParts(filteredData as SparePart[]);
      
      if (filteredData.length > 0) {
        toast({
          title: 'Parts Found',
          description: `Found ${filteredData.length} compatible spare parts`,
        });
      }
    } catch (error) {
      console.error('Parts fetch error:', error);
      toast({
        title: 'Parts Fetch Failed',
        description: 'Unable to load spare parts inventory',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingParts(false);
    }
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
              {isScanning && (
                <div className="space-y-3">
                  {model && (
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
                  
                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-destructive/50">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <div>
                        <Label htmlFor="damage-detection" className="text-sm font-medium">
                          Automatic Damage Detection
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Detects burnt components, corrosion, and physical damage
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="damage-detection"
                      checked={damageDetection}
                      onCheckedChange={setDamageDetection}
                    />
                  </div>
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
                {(realtimeDetection || damageDetection) && (
                  <div className="absolute top-4 left-4 space-y-2">
                    {realtimeDetection && detectedObjects.length > 0 && (
                      <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-primary/50">
                        <p className="text-xs font-semibold text-primary flex items-center gap-2">
                          <Scan className="w-3 h-3 animate-pulse" />
                          Detected: {detectedObjects.length} objects
                        </p>
                      </div>
                    )}
                    {damageDetection && damagedAreas.length > 0 && (
                      <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-destructive/50">
                        <p className="text-xs font-semibold text-destructive flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 animate-pulse" />
                          Damage: {damagedAreas.length} areas
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {isScanning && (
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={handleLiveScan} disabled={isAnalyzing}>
                    <Play className="w-4 h-4 mr-2" />
                    Analyze Device
                  </Button>
                  {(realtimeDetection || damageDetection) && (detectedObjects.length > 0 || damagedAreas.length > 0) && (
                    <Button onClick={captureAnnotatedScreenshot} variant="secondary">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Screenshot
                    </Button>
                  )}
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

          {damageDetection && damagedAreas.length > 0 && (
            <div className="mt-4 p-4 bg-card rounded-lg border space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Damage History
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="device-id" className="text-xs">Device ID *</Label>
                  <Input
                    id="device-id"
                    placeholder="e.g., iPhone-123"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="device-type" className="text-xs">Device Type</Label>
                  <Input
                    id="device-type"
                    placeholder="e.g., iPhone 12"
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={assessDamageSeverity} 
                  size="sm"
                  disabled={isAssessing}
                  variant="default"
                >
                  <AlertCircle className="w-3 h-3 mr-2" />
                  {isAssessing ? 'Assessing...' : 'AI Severity Assessment'}
                </Button>
                <Button 
                  onClick={saveDamageHistory} 
                  size="sm"
                  disabled={!deviceId}
                  variant="secondary"
                >
                  <Save className="w-3 h-3 mr-2" />
                  Save Current Scan
                </Button>
                <Button 
                  onClick={fetchDamageHistory} 
                  variant="outline"
                  size="sm"
                  disabled={!deviceId}
                >
                  <History className="w-3 h-3 mr-2" />
                  View History
                </Button>
              </div>
            </div>
          )}

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

          {aiAssessment && (
            <Card className="mt-4 border-2 border-primary/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  AI-Powered Damage Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-xs text-muted-foreground mb-1">Overall Severity</p>
                    <Badge variant={
                      aiAssessment.overallSeverity === 'Critical' ? 'destructive' :
                      aiAssessment.overallSeverity === 'High' ? 'default' :
                      'secondary'
                    } className="text-sm">
                      {aiAssessment.overallSeverity}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-xs text-muted-foreground mb-1">Repair Urgency</p>
                    <Badge variant={
                      aiAssessment.urgencyLevel.includes('Immediate') ? 'destructive' :
                      aiAssessment.urgencyLevel.includes('Urgent') ? 'default' :
                      'secondary'
                    } className="text-sm">
                      {aiAssessment.urgencyLevel.split('(')[0].trim()}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-card border">
                  <p className="text-xs text-muted-foreground mb-2">Estimated Repair Cost</p>
                  <p className="text-2xl font-bold text-primary">
                    ${aiAssessment.estimatedCost.min} - ${aiAssessment.estimatedCost.max}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">USD</p>
                </div>

                <div className="p-4 rounded-lg bg-card border">
                  <p className="text-sm font-semibold mb-2">Repair Recommendation</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiAssessment.repairRecommendation}
                  </p>
                </div>

                {aiAssessment.componentAnalysis.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Component Analysis</p>
                    {aiAssessment.componentAnalysis.map((component, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-card border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{component.component}</span>
                          <Badge variant={
                            component.severity === 'Critical' ? 'destructive' :
                            component.severity === 'High' ? 'default' :
                            'secondary'
                          } className="text-xs">
                            {component.severity}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Urgency: </span>
                            <span className="font-medium">{component.urgency}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost: </span>
                            <span className="font-medium">{component.cost}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {availableParts.length > 0 && (
            <Card className="mt-4 border-2 border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Available Spare Parts
                </CardTitle>
                <CardDescription>
                  Compatible parts in stock for detected damage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingParts ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableParts.map((part) => (
                      <div key={part.id} className="p-4 rounded-lg bg-card border hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{part.part_name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {part.part_category}
                              </Badge>
                              {part.stock_quantity <= 5 && (
                                <Badge variant="destructive" className="text-xs">
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                            
                            {part.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {part.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs">
                              <div>
                                <span className="text-muted-foreground">Price: </span>
                                <span className="font-bold text-primary text-base">
                                  ${part.price.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Stock: </span>
                                <span className={part.stock_quantity > 10 ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                                  {part.stock_quantity} units
                                </span>
                              </div>
                              {part.supplier && (
                                <div>
                                  <span className="text-muted-foreground">Supplier: </span>
                                  <span className="font-medium">{part.supplier}</span>
                                </div>
                              )}
                            </div>
                            
                            {part.compatible_devices.length > 0 && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Compatible: </span>
                                <span className="font-medium">
                                  {part.compatible_devices.slice(0, 3).join(', ')}
                                  {part.compatible_devices.length > 3 && ` +${part.compatible_devices.length - 3} more`}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="shrink-0"
                            onClick={() => {
                              window.open('https://ztechelectronics.com/api/store', '_blank');
                              toast({
                                title: 'Redirecting to Store',
                                description: 'Opening main platform to place order',
                              });
                            }}
                          >
                            <ShoppingCart className="w-3 h-3 mr-2" />
                            Order Part
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {annotatedScreenshots.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Annotated Screenshots</h4>
              <div className="grid grid-cols-2 gap-4">
                {annotatedScreenshots.map((screenshot, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <img
                      src={screenshot}
                      alt={`Annotated ${idx + 1}`}
                      className="w-full h-auto"
                    />
                    <CardContent className="p-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => downloadScreenshot(screenshot, idx)}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => shareScreenshot(screenshot)}
                      >
                        <Video className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showHistory && damageHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Damage History - {deviceId}
                </CardTitle>
                <CardDescription>
                  Track component deterioration over {damageHistory.length} scans
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowHistory(false)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {calculateProgression() && (
              <Alert className={calculateProgression()!.isImproving ? 'border-green-500' : 'border-red-500'}>
                <TrendingUp className={`h-4 w-4 ${calculateProgression()!.isImproving ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
                <AlertDescription>
                  <strong>Progression:</strong> {calculateProgression()!.isImproving ? 'Improving' : 'Worsening'}
                  {' - '}{Math.abs(calculateProgression()!.damageChange)} damaged areas {calculateProgression()!.isImproving ? 'less' : 'more'} than previous scan
                  {' '}({calculateProgression()!.isImproving ? '' : '+'}{calculateProgression()!.percentChange}%)
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {damageHistory.map((scan, idx) => {
                const isLatest = idx === 0;
                return (
                  <Card key={scan.id} className={isLatest ? 'border-primary' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {isLatest && <Badge variant="default">Latest</Badge>}
                            Scan {damageHistory.length - idx}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {new Date(scan.scan_timestamp).toLocaleString()}
                            {scan.device_type && ` • ${scan.device_type}`}
                          </CardDescription>
                        </div>
                        <Badge variant="destructive">
                          {scan.total_damage_count} areas
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-red-500/10 rounded p-2">
                          <div className="text-2xl font-bold text-red-500">
                            {scan.severity_summary.critical}
                          </div>
                          <div className="text-xs text-muted-foreground">Critical</div>
                        </div>
                        <div className="bg-orange-500/10 rounded p-2">
                          <div className="text-2xl font-bold text-orange-500">
                            {scan.severity_summary.high}
                          </div>
                          <div className="text-xs text-muted-foreground">High</div>
                        </div>
                        <div className="bg-yellow-500/10 rounded p-2">
                          <div className="text-2xl font-bold text-yellow-500">
                            {scan.severity_summary.medium}
                          </div>
                          <div className="text-xs text-muted-foreground">Medium</div>
                        </div>
                        <div className="bg-blue-500/10 rounded p-2">
                          <div className="text-2xl font-bold text-blue-500">
                            {scan.severity_summary.low}
                          </div>
                          <div className="text-xs text-muted-foreground">Low</div>
                        </div>
                      </div>

                      {scan.image_data_url && (
                        <div className="relative">
                          <img
                            src={scan.image_data_url}
                            alt={`Scan ${damageHistory.length - idx}`}
                            className="w-full h-auto rounded border"
                          />
                        </div>
                      )}

                      {scan.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          Note: {scan.notes}
                        </p>
                      )}

                      {idx < damageHistory.length - 1 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const prev = damageHistory[idx + 1];
                              const change = scan.total_damage_count - prev.total_damage_count;
                              const days = Math.floor(
                                (new Date(scan.scan_timestamp).getTime() - new Date(prev.scan_timestamp).getTime()) / 
                                (1000 * 60 * 60 * 24)
                              );
                              return `${change > 0 ? '+' : ''}${change} areas since previous scan (${days} days ago)`;
                            })()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
