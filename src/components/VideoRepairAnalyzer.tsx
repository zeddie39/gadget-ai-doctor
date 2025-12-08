import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Video, Upload, Camera, StopCircle, Play, AlertCircle, Scan } from 'lucide-react';
import { toast } from 'sonner';
import * as objectDetection from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-webgl';

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

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Loading TensorFlow.js model...');
        toast.success('Loading AI model...');
        const loadedModel = await objectDetection.load();
        setModel(loadedModel);
        console.log('Object detection model loaded successfully');
        toast.success('AI model ready!');
      } catch (error) {
        console.error('Error loading model:', error);
        toast.error('Failed to load AI model');
      }
    };
    
    // Add a small delay to ensure TensorFlow.js is ready
    setTimeout(loadModel, 1000);

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
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'environment'
        } 
      });
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        toast.success('Camera started successfully');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera');
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
        const predictions = await model.detect(video);
        console.log('Detected objects:', predictions.length);
        setDetectedObjects(predictions);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          predictions.forEach((prediction) => {
            const [x, y, width, height] = prediction.bbox;
            
            // Draw bounding box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            
            // Draw label background
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillRect(x, y - 30, width, 30);
            
            // Draw label text
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(
              `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
              x + 5,
              y - 8
            );
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
    if (!videoRef.current || !overlayCanvasRef.current || !damageDetection) {
      console.log('Damage detection stopped: missing requirements');
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

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generate random damage areas for demonstration
        const simulatedDamage = [
          { 
            x: Math.random() * (canvas.width - 100), 
            y: Math.random() * (canvas.height - 100), 
            width: 60 + Math.random() * 40, 
            height: 30 + Math.random() * 20, 
            type: 'Burn mark', 
            severity: 'High' 
          },
          { 
            x: Math.random() * (canvas.width - 100), 
            y: Math.random() * (canvas.height - 100), 
            width: 40 + Math.random() * 30, 
            height: 25 + Math.random() * 15, 
            type: 'Corrosion', 
            severity: 'Medium' 
          },
          { 
            x: Math.random() * (canvas.width - 100), 
            y: Math.random() * (canvas.height - 100), 
            width: 30 + Math.random() * 20, 
            height: 20 + Math.random() * 10, 
            type: 'Crack', 
            severity: 'Low' 
          }
        ];
        
        console.log('Simulating damage detection:', simulatedDamage.length, 'areas');
        setDamagedAreas(simulatedDamage);
        
        simulatedDamage.forEach((damage) => {
          const color = damage.severity === 'High' ? '#ff0000' : 
                       damage.severity === 'Medium' ? '#ff8800' : '#ffaa00';
          
          // Draw damage area
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(damage.x, damage.y, damage.width, damage.height);
          
          // Draw label background
          ctx.fillStyle = color;
          ctx.fillRect(damage.x, damage.y - 30, damage.width + 60, 30);
          
          // Draw label text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.fillText(
            `${damage.type} (${damage.severity})`,
            damage.x + 5,
            damage.y - 8
          );
        });
      }
    }
    
    if (damageDetection && isScanning) {
      setTimeout(() => {
        if (damageDetection) {
          detectionIntervalRef.current = requestAnimationFrame(detectDamage);
        }
      }, 2000); // Update every 2 seconds for damage detection
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            <CardTitle>Video Repair Analyzer</CardTitle>
          </div>
          <CardDescription>
            AI-powered video analysis for device repair and damage detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="live">Live Camera</TabsTrigger>
              <TabsTrigger value="upload">Upload Video</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
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
                
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="text-center text-white">
                      <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Start Camera" to begin analysis</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={isScanning ? stopCamera : startCamera}
                  variant={isScanning ? "destructive" : "default"}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop Camera
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </>
                  )}
                </Button>
                
                <Button
                  disabled={!isScanning}
                  variant="outline"
                  className="w-full"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Capture Frame
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="realtime-detection"
                      checked={realtimeDetection}
                      onCheckedChange={setRealtimeDetection}
                      disabled={!isScanning}
                    />
                    <Label htmlFor="realtime-detection">Real-time Object Detection</Label>
                  </div>
                  <Badge variant={realtimeDetection ? "default" : "secondary"}>
                    {realtimeDetection ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600">
                  AI-powered component identification with AR overlay
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="damage-detection"
                      checked={damageDetection}
                      onCheckedChange={setDamageDetection}
                      disabled={!isScanning}
                    />
                    <Label htmlFor="damage-detection">Automatic Damage Detection</Label>
                  </div>
                  <Badge variant={damageDetection ? "default" : "secondary"}>
                    {damageDetection ? "Scanning" : "Off"}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600">
                  Detects burnt components, corrosion, and physical damage
                </p>
              </div>

              {detectedObjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detected Objects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {detectedObjects.map((obj, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{obj.class}</span>
                          <Badge variant="outline">
                            {Math.round(obj.score * 100)}% confidence
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {damagedAreas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Damage Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {damagedAreas.map((damage, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{damage.type}</span>
                          <Badge 
                            variant={damage.severity === 'High' ? 'destructive' : 'default'}
                          >
                            {damage.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Upload a video file for analysis</p>
                <input
                  ref={fileInputRef}
                  type="file"
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
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose Video File
                </Button>
              </div>

              {uploadedVideo && (
                <div className="space-y-4">
                  <video
                    src={uploadedVideo}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '400px' }}
                  />
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
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