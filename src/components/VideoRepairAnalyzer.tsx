import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Video, Upload, Camera, StopCircle, Play, AlertCircle, Scan } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { pipeline, env } from '@xenova/transformers';
import PaymentModal from './PaymentModal';
import { useSubscription } from '@/hooks/useSubscription';
import '../styles/video-analyzer.css';

// Setup Transformers.js to download models from HuggingFace
env.allowLocalModels = false;

// The electronics components we actually want to detect
const ELECTRONICS_LABELS = [
  "microchip", 
  "capacitor", 
  "motherboard", 
  "ribbon cable", 
  "battery",
  "damaged component"
];

// Damage-specific labels for real AI-powered damage detection
const DAMAGE_LABELS = [
  "burn mark",
  "corrosion",
  "cracked glass",
  "water damage",
  "rust",
  "broken connector",
  "swollen battery",
  "melted plastic",
  "scratched surface",
  "missing component"
];

// Minimum confidence threshold to filter out weak/false detections
const MIN_CONFIDENCE = 0.10; // OWL-ViT confidence scores are generally lower than traditional classifiers

export default function VideoRepairAnalyzer() {
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const [realtimeDetection, setRealtimeDetection] = useState(false);
  const [damageDetection, setDamageDetection] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<any[]>([]);
  const [damagedAreas, setDamagedAreas] = useState<any[]>([]);
  const [model, setModel] = useState<any>(null);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [videoScanCount, setVideoScanCount] = useState(0);
  const { isPro } = useSubscription();

  useEffect(() => {
    const saved = localStorage.getItem('freeVideoScanCount');
    if (saved) {
      setVideoScanCount(parseInt(saved, 10));
    }
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Loading Transformers.js Zero-Shot Object Detection model...');
        // Load the OWL-ViT model
        const detector = await pipeline('zero-shot-object-detection', 'Xenova/owlvit-base-patch32');
        setModel(() => detector); // Use callback to prevent React from calling the pipeline function
        console.log('Zero-shot object detection model loaded successfully');
        toast.success('Local AI Vision model ready!');
      } catch (error) {
        console.error('Error loading model:', error);
        toast.error('Failed to load Local AI model');
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
      } else if (damageDetection && model) {
        detectDamage();
      }
    } else if (!realtimeDetection && !damageDetection && detectionIntervalRef.current) {
      cancelAnimationFrame(detectionIntervalRef.current);
    }
  }, [realtimeDetection, damageDetection, isScanning, model]);

  const startCamera = async () => {
    if (!isPro && videoScanCount >= 3) {
      setShowPaymentModal(true);
      return;
    }

    try {
      // CRITICAL: getUserMedia called directly in click handler for mobile/Capacitor compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        },
        audio: false
      });

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        await videoRef.current.play();
        streamRef.current = stream;
        setIsScanning(true);
        toast.success('Camera started successfully');
        
        if (!isPro) {
          setVideoScanCount(prev => {
            const newCount = prev + 1;
            localStorage.setItem('freeVideoScanCount', newCount.toString());
            return newCount;
          });
        }
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera access denied. Please allow camera permissions in your device settings.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error('Unable to access camera. Try again.');
      }
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
      console.log('Detection stopped: missing requirements');
      return;
    }

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      // Ensure canvas matches video dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        // Capture the current video frame
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = video.videoWidth;
        frameCanvas.height = video.videoHeight;
        frameCanvas.getContext('2d')?.drawImage(video, 0, 0);
        const imageUrl = frameCanvas.toDataURL('image/jpeg', 0.8);

        // Run zero-shot inference with our electronics labels
        const rawPredictions = await model(imageUrl, ELECTRONICS_LABELS, { threshold: MIN_CONFIDENCE });

        // Map OWL-ViT prediction format { score, label, box: { xmin, ymin, xmax, ymax } }
        const predictions = rawPredictions.map((p: any) => ({
          score: p.score,
          class: p.label,
          displayLabel: p.label.split(' ').map((w:string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          bbox: [
            p.box.xmin, 
            p.box.ymin, 
            p.box.xmax - p.box.xmin, 
            p.box.ymax - p.box.ymin
          ]
        }));

        console.log(`Detected ${predictions.length} relevant electronic components`);
        setDetectedObjects(predictions);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          predictions.forEach((prediction) => {
            const [x, y, width, height] = prediction.bbox;
            const label = prediction.displayLabel;
            const pct = Math.round(prediction.score * 100);

            // Color by confidence: green ≥ 85%, yellow ≥ 75%, orange otherwise
            const color = prediction.score >= 0.85 ? '#00ff00'
              : prediction.score >= 0.75 ? '#ffdd00' : '#ff8800';

            // Draw bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            // Draw label background
            const labelText = `${label} (${pct}%)`;
            const textWidth = ctx.measureText(labelText).width + 12;
            ctx.fillStyle = color;
            ctx.fillRect(x, y - 30, Math.max(textWidth, width), 30);

            // Draw label text
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(labelText, x + 5, y - 8);
          });
        }
      } catch (error) {
        console.error('Error detecting objects:', error);
        toast.error('Object detection failed');
      }
    }

    if (realtimeDetection && isScanning) {
      detectionIntervalRef.current = requestAnimationFrame(detectObjects);
    }
  };

  const detectDamage = async () => {
    if (!model || !videoRef.current || !overlayCanvasRef.current || !damageDetection) {
      console.log('Damage detection stopped: missing requirements (model needed)');
      if (!model && damageDetection) {
        toast.error('AI model still loading. Please wait...');
      }
      return;
    }

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      // Ensure canvas matches video dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        // Capture the current video frame
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = video.videoWidth;
        frameCanvas.height = video.videoHeight;
        frameCanvas.getContext('2d')?.drawImage(video, 0, 0);
        const imageUrl = frameCanvas.toDataURL('image/jpeg', 0.8);

        // Run zero-shot inference with damage-specific labels
        const rawPredictions = await model(imageUrl, DAMAGE_LABELS, { threshold: MIN_CONFIDENCE });

        // Classify severity based on label type
        const getSeverity = (label: string): string => {
          const highSeverity = ['burn mark', 'swollen battery', 'melted plastic', 'water damage'];
          const medSeverity = ['corrosion', 'rust', 'broken connector', 'missing component'];
          if (highSeverity.includes(label)) return 'High';
          if (medSeverity.includes(label)) return 'Medium';
          return 'Low';
        };

        // Map predictions to damage areas
        const damages = rawPredictions.map((p: any) => ({
          x: p.box.xmin,
          y: p.box.ymin,
          width: p.box.xmax - p.box.xmin,
          height: p.box.ymax - p.box.ymin,
          type: p.label.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          severity: getSeverity(p.label),
          score: p.score
        }));

        console.log(`AI Damage Detection: found ${damages.length} potential damage areas`);
        setDamagedAreas(damages);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          damages.forEach((damage: any) => {
            const color = damage.severity === 'High' ? '#ff0000' :
              damage.severity === 'Medium' ? '#ff8800' : '#ffaa00';

            // Draw damage area with pulsing effect
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.strokeRect(damage.x, damage.y, damage.width, damage.height);
            ctx.setLineDash([]);

            // Draw label background
            const labelText = `${damage.type} (${Math.round(damage.score * 100)}%)`;
            const textWidth = ctx.measureText(labelText).width + 16;
            ctx.fillStyle = color;
            ctx.fillRect(damage.x, damage.y - 30, Math.max(textWidth, damage.width), 30);

            // Draw label text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(labelText, damage.x + 5, damage.y - 10);
          });

          // Show "No damage found" overlay if clean
          if (damages.length === 0) {
            ctx.fillStyle = 'rgba(0, 200, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('✓ No visible damage detected', canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'start';
          }
        }
      } catch (error) {
        console.error('Error in damage detection:', error);
      }
    }

    if (damageDetection && isScanning) {
      // Throttle to every 3 seconds since damage detection with AI is heavier
      setTimeout(() => {
        if (damageDetection) {
          detectionIntervalRef.current = requestAnimationFrame(detectDamage);
        }
      }, 3000);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSuccess={() => setShowPaymentModal(false)} />
      <Card className="video-analyzer-container overflow-hidden border-0 shadow-2xl">
        <CardHeader className="p-4 md:pb-4" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shrink-0">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                  AI Video Repair Analyzer
                </CardTitle>
                <CardDescription className="text-xs md:text-sm opacity-80 line-clamp-1">
                  Real-time damage detection powered by TensorFlow.js
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`status-badge shrink-0 ${model ? 'active' : ''}`}>
                {model ? '✓ AI Ready' : '⟳ Loading...'}
              </Badge>
              {!isPro && (
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg font-bold px-4 h-9"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <span className="opacity-90 mr-2 font-medium bg-black/20 px-2 py-0.5 rounded text-xs">{Math.max(0, 3 - videoScanCount)}/3 Free</span> 
                  UPGRADE TO PRO
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 gap-2 p-1 bg-black/5 rounded-xl">
              <TabsTrigger value="live" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                <Camera className="h-4 w-4 mr-2" />
                Live Camera
              </TabsTrigger>
              <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="space-y-6">
              {/* Video Container with Animated Border */}
              <div className="video-container-wrapper">
                <div className="video-container-inner relative aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />

                  {/* Scanning Overlay */}
                  {(realtimeDetection || damageDetection) && isScanning && (
                    <div className="scanning-overlay">
                      <div className="scanning-beam" />
                      <div className="corner-bracket top-left" />
                      <div className="corner-bracket top-right" />
                      <div className="corner-bracket bottom-left" />
                      <div className="corner-bracket bottom-right" />
                    </div>
                  )}

                  {/* Camera Placeholder */}
                  {!isScanning && (
                    <div className="absolute inset-0 camera-placeholder">
                      <div className="camera-placeholder-icon">
                        <Camera className="h-full w-full text-primary/60" />
                      </div>
                      <p className="text-center max-w-xs">
                        Click <strong>Start Camera</strong> to begin real-time analysis
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Control Buttons - Mobile Optimized */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 md:gap-4">
                <Button
                  onClick={isScanning ? stopCamera : startCamera}
                  className={`btn-premium w-full ${isScanning ? 'btn-danger-gradient' : 'btn-primary-gradient'}`}
                >
                  {isScanning ? (
                    <>
                      <StopCircle className="h-5 w-5 mr-2" />
                      Stop Camera
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5 mr-2" />
                      Start Camera
                    </>
                  )}
                </Button>

                <Button
                  disabled={!isScanning}
                  className="btn-premium w-full btn-success-gradient disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Scan className="h-5 w-5 mr-2" />
                  Capture Frame
                </Button>
              </div>

              {/* Detection Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="stats-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-green-500/20">
                        <Scan className="h-4 w-4 text-green-500" />
                      </div>
                      <Label htmlFor="realtime-detection" className="font-semibold">
                        Object Detection
                      </Label>
                    </div>
                    <Switch
                      id="realtime-detection"
                      checked={realtimeDetection}
                      onCheckedChange={setRealtimeDetection}
                      disabled={!isScanning}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    AI-powered component identification
                  </p>
                  <Badge className={`mt-2 status-badge ${realtimeDetection ? 'active' : 'inactive'}`}>
                    {realtimeDetection ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="stats-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-orange-500/20">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      </div>
                      <Label htmlFor="damage-detection" className="font-semibold">
                        Damage Detection
                      </Label>
                    </div>
                    <Switch
                      id="damage-detection"
                      checked={damageDetection}
                      onCheckedChange={setDamageDetection}
                      disabled={!isScanning}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    AI-powered burn, corrosion & crack detection
                  </p>
                  <Badge className={`mt-2 status-badge ${damageDetection ? 'scanning' : 'inactive'}`}>
                    {damageDetection ? (model ? 'AI Scanning' : 'Loading Model...') : 'Off'}
                  </Badge>
                </div>
              </div>

              {/* Detection Results */}
              {detectedObjects.length > 0 && (
                <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="p-1 rounded bg-green-500">
                        <Scan className="h-3 w-3 text-white" />
                      </div>
                      Objects Detected ({detectedObjects.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {detectedObjects.map((obj, index) => (
                        <div key={index} className="detection-card">
                          <span className="font-medium">{obj.displayLabel || obj.class}</span>
                          <Badge variant="outline" className="bg-green-50">
                            {Math.round(obj.score * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {damagedAreas.length > 0 && (
                <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="p-1 rounded bg-red-500">
                        <AlertCircle className="h-3 w-3 text-white" />
                      </div>
                      Damage Detected ({damagedAreas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {damagedAreas.map((damage, index) => (
                        <div key={index} className={`detection-card severity-${damage.severity.toLowerCase()}`}>
                          <span className="font-medium">{damage.type}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-50">
                              {damage.score ? `${Math.round(damage.score * 100)}%` : '—'}
                            </Badge>
                            <Badge variant={damage.severity === 'High' ? 'destructive' : 'default'}>
                              {damage.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="upload-icon" />
                <p className="text-gray-600 mb-2">
                  Drop a video file here or click to browse
                </p>
                <p className="text-sm text-gray-400">
                  Supports MP4, WebM, MOV (max 100MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  title="Upload Video"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setUploadedVideo(url);
                    }
                  }}
                />
              </div>

              {uploadedVideo && (
                <div className="space-y-4">
                  <div className="video-container-wrapper">
                    <div className="video-container-inner">
                      <video
                        src={uploadedVideo}
                        controls
                        className="w-full rounded-lg max-h-[400px]"
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full btn-premium btn-primary-gradient"
                    onClick={async () => {
                      if (!isPro && videoScanCount >= 3) {
                        setShowPaymentModal(true);
                        return;
                      }
                      if (!uploadedVideo) return;
                      
                      if (!isPro) {
                        setVideoScanCount(prev => {
                          const newCount = prev + 1;
                          localStorage.setItem('freeVideoScanCount', newCount.toString());
                          return newCount;
                        });
                      }
                      
                      toast.info('Analyzing video frames...');
                      // Extract a frame from the uploaded video for AI analysis
                      const video = document.createElement('video');
                      video.src = uploadedVideo;
                      video.currentTime = 1;
                      video.addEventListener('seeked', async () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth || 640;
                        canvas.height = video.videoHeight || 480;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(video, 0, 0);
                          const frameData = canvas.toDataURL('image/jpeg', 0.7);
                          try {
                            const { data, error } = await supabase.functions.invoke('openrouter-ai', {
                              body: {
                                prompt: 'Analyze this video frame of an electronic device. Identify the device, visible damage or issues, and provide step-by-step repair guidance. Respond in JSON: {"device": "...", "issues": ["..."], "severity": "minor|medium|critical", "repair_steps": ["..."]}',
                                model: 'google/gemini-2.5-flash',
                                image: frameData,
                                systemPrompt: 'You are an expert electronics repair technician. Analyze the video frame and provide actionable repair guidance.'
                              }
                            });
                            if (!error && data?.response) {
                              toast.success('Video analysis complete!');
                              // Parse and display results
                              let raw = data.response.trim();
                              const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
                              if (fenceMatch) raw = fenceMatch[1].trim();
                              if (!raw.startsWith('{')) {
                                const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
                                if (s !== -1 && e !== -1) raw = raw.slice(s, e + 1);
                              }
                              try {
                                const result = JSON.parse(raw);
                                toast.success(`Device: ${result.device || 'Unknown'} | Severity: ${result.severity || 'unknown'}`);
                              } catch {
                                toast.info(data.response.slice(0, 200));
                              }
                            } else {
                              toast.error('Analysis failed: ' + (error?.message || 'Unknown error'));
                            }
                          } catch (err) {
                            toast.error('Failed to analyze video frame');
                          }
                        }
                        video.remove();
                      }, { once: true });
                    }}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Analyze Video
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}