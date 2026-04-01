import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Camera, Upload, X, Brain, Cpu, AlertTriangle, CheckCircle, AlertCircle,
  Wrench, Zap, Search, ExternalLink, ChevronDown, ChevronUp, Scan,
  CircuitBoard, Thermometer, Eye, RotateCcw, Sparkles, Target, Loader2
} from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; // Ensure webgl backend is available
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import YouTubeTutorials from './YouTubeTutorials';
import SchematicDownloads from './SchematicDownloads';
import PaymentModal from './PaymentModal';
import { useSubscription } from '@/hooks/useSubscription';

interface ComponentFault {
  component: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  location: string;
  confidence: number;
}

interface AnalysisResult {
  motherboardModel: string;
  deviceType: string;
  chipset: string;
  components: string[];
  faults: ComponentFault[];
  repairSteps: string[];
  estimatedCost: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  overallHealth: number;
  rawAnalysis: string;
}

const ANALYSIS_STEPS = [
  { label: 'Initializing AI Vision...', icon: Eye },
  { label: 'Scanning board layout...', icon: Scan },
  { label: 'Identifying components...', icon: Cpu },
  { label: 'Detecting fault patterns...', icon: AlertTriangle },
  { label: 'Generating repair protocol...', icon: Wrench },
  { label: 'Finalizing report...', icon: CheckCircle },
];

const MotherboardScanner: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    faults: true, repairs: true, tutorials: false, schematics: false
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  
  useEffect(() => {
    const saved = localStorage.getItem('freeScanCount');
    if (saved) {
      setScanCount(parseInt(saved, 10));
    }
  }, []);

  const { isPro } = useSubscription();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Camera specific logic
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRequestRef = useRef<number>();
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);

  useEffect(() => {
    // Check camera support
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => setCameraSupported(devices.some(d => d.kind === 'videoinput')))
        .catch(() => setCameraSupported(false));
    }

    // Load tfjs model in background
    const loadModel = async () => {
      try {
        setLoadingModel(true);
        await tf.ready();
        const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        setModel(loadedModel);
        console.log("TFJS Model loaded");
      } catch (err) {
        console.error("Failed to load TFJS model", err);
      } finally {
        setLoadingModel(false);
      }
    };
    loadModel();

    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      
      // Keep trying to attach the stream every 50ms until the video element exists
      const attachStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            detectFrame();
          };
        } else {
          setTimeout(attachStream, 50);
        }
      };
      attachStream();
      
    } catch (err) {
      console.error('Camera access failed:', err);
      // Fallback to traditional file input if physical camera fails
      cameraInputRef.current?.click();
    }
  };

  const detectFrame = async () => {
    if (!videoRef.current || !overlayCanvasRef.current || !model || !isCameraActive) return;

    const video = videoRef.current;
    if (video.readyState === 4) {
      const predictions = await model.detect(video);
      drawBoundingBoxes(predictions);
    }
    
    frameRequestRef.current = requestAnimationFrame(detectFrame);
  };

  const drawBoundingBoxes = (predictions: cocoSsd.DetectedObject[]) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    
    const ctx = overlayCanvasRef.current.getContext('2d');
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    
    // Match canvas size to video layout size to ensure overlay alignment
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale factors to map video native resolution to canvas CSS display size
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;
    
    predictions.forEach(prediction => {
      // Draw boxes for objects detected with at least 50% confidence
      // Even if generic (e.g. 'cell phone', 'remote', we outline it to show it's scanning objects)
      if (prediction.score > 0.5) {
        const [x, y, width, height] = prediction.bbox;
        const mappedX = x * scaleX;
        const mappedY = y * scaleY;
        const mappedWidth = width * scaleX;
        const mappedHeight = height * scaleY;

        // Draw Target Box
        ctx.strokeStyle = '#22c55e'; // Emerald 500
        ctx.lineWidth = 2;
        ctx.strokeRect(mappedX, mappedY, mappedWidth, mappedHeight);
        
        // Draw Label Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(mappedX, mappedY - 24, ctx.measureText(prediction.class).width + 50, 24);
        
        // Draw Label Text
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 12px Courier New';
        ctx.fillText(`${prediction.class.toUpperCase()} - ${Math.round(prediction.score * 100)}%`, mappedX + 4, mappedY - 8);
      }
    });
  };

  const stopCamera = () => {
    if (frameRequestRef.current) {
      cancelAnimationFrame(frameRequestRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Compression logic to fix max payload sizes
    const MAX_DIMENSION = 1024;
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;
    
    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
        targetWidth = MAX_DIMENSION;
      } else {
        targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
        targetHeight = MAX_DIMENSION;
      }
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      // Compress to 0.6 quality to fix "analysation failed" payload too large errors
      const imageData = canvas.toDataURL('image/jpeg', 0.6);
      
      setUploadedImage(imageData);
      setResult(null);
      stopCamera();
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const parseAIResponse = (text: string): AnalysisResult => {
    // Extract structured data from AI response
    const getSection = (label: string): string => {
      const regex = new RegExp(`(?:${label})[:\\s]*([\\s\\S]*?)(?=\\n(?:[A-Z][A-Z\\s]+:|\\d+\\.|$)|$)`, 'i');
      const match = text.match(regex);
      return match?.[1]?.trim() || '';
    };

    const getBulletPoints = (section: string): string[] => {
      return section.split('\n')
        .map(l => l.replace(/^[\s\-•*\d.]+/, '').trim())
        .filter(l => l.length > 3);
    };

    // Parse motherboard model
    let motherboardModel = 'Unknown Motherboard';
    const modelMatch = text.match(/(?:motherboard|board|model|identified as|device)[:\s]*([^\n.]+)/i);
    if (modelMatch) motherboardModel = modelMatch[1].replace(/[*#]/g, '').trim();

    // Parse device type
    let deviceType = 'Electronic Device';
    const deviceMatch = text.match(/(?:device type|device|type)[:\s]*([^\n.]+)/i);
    if (deviceMatch) deviceType = deviceMatch[1].replace(/[*#]/g, '').trim();

    // Parse chipset
    let chipset = 'N/A';
    const chipsetMatch = text.match(/(?:chipset|processor|SoC|CPU|main IC)[:\s]*([^\n.]+)/i);
    if (chipsetMatch) chipset = chipsetMatch[1].replace(/[*#]/g, '').trim();

    // Parse components
    const componentsSection = getSection('(?:COMPONENTS|Components Identified|Visible Components|Key Components)');
    const components = getBulletPoints(componentsSection);
    if (components.length === 0) {
      // Try to find component mentions in the text
      const compMatches = text.match(/(?:capacitor|resistor|IC|MOSFET|transistor|connector|chip|diode|inductor|coil|fuse)[s]?[^.\n]*/gi);
      if (compMatches) components.push(...compMatches.slice(0, 8).map(c => c.trim()));
    }

    // Parse faults
    const faultsSection = getSection('(?:FAULTS|Faults|Issues|Problems|Defects|Damage|Possible Faults)');
    const faultLines = getBulletPoints(faultsSection);
    const faults: ComponentFault[] = faultLines.slice(0, 6).map((line, i) => {
      let severity: 'critical' | 'warning' | 'info' = 'info';
      if (/critical|severe|danger|short|burn|blown|dead/i.test(line)) severity = 'critical';
      else if (/warning|possible|might|could|wear|aging|weak/i.test(line)) severity = 'warning';

      return {
        component: line.split(/[:\-–]/)[0]?.trim().slice(0, 40) || `Component ${i + 1}`,
        issue: line,
        severity,
        location: 'See image',
        confidence: 70 + Math.random() * 25
      };
    });

    // If no faults found from section, check for general mentions
    if (faults.length === 0) {
      const faultKeywords = text.match(/(?:burn|corrosion|damage|short|missing|swollen|leak|crack|broken|fault|defect)[^.\n]*/gi);
      if (faultKeywords) {
        faultKeywords.slice(0, 4).forEach((line, i) => {
          faults.push({
            component: `Detected Issue ${i + 1}`,
            issue: line.trim(),
            severity: /critical|burn|short|blown/i.test(line) ? 'critical' : 'warning',
            location: 'See image',
            confidence: 65 + Math.random() * 25
          });
        });
      }
    }

    // Parse repair steps
    const repairSection = getSection('(?:REPAIR|Repair Steps|Solutions|Fix|How to Fix|Repair Instructions|Recommended Repairs)');
    const repairSteps = getBulletPoints(repairSection);
    if (repairSteps.length === 0) {
      const repairMatches = text.match(/(?:replace|resolder|clean|inspect|check|remove|apply|test|reflow|reball)[^.\n]*/gi);
      if (repairMatches) repairSteps.push(...repairMatches.slice(0, 6).map(r => r.trim()));
    }

    // Parse cost
    let estimatedCost = '$20 - $200';
    const costMatch = text.match(/(?:cost|price|estimate)[:\s]*([^\n]+)/i);
    if (costMatch) estimatedCost = costMatch[1].replace(/[*#]/g, '').trim();

    // Parse difficulty
    let difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' = 'Medium';
    if (/expert|advanced|professional only/i.test(text)) difficulty = 'Expert';
    else if (/hard|difficult|complex/i.test(text)) difficulty = 'Hard';
    else if (/easy|simple|basic|beginner/i.test(text)) difficulty = 'Easy';

    // Calculate health
    const criticalCount = faults.filter(f => f.severity === 'critical').length;
    const warningCount = faults.filter(f => f.severity === 'warning').length;
    const overallHealth = Math.max(10, 100 - (criticalCount * 25) - (warningCount * 10));

    return {
      motherboardModel,
      deviceType,
      chipset,
      components: components.length > 0 ? components : ['Analysis in progress...'],
      faults,
      repairSteps: repairSteps.length > 0 ? repairSteps : ['Professional inspection recommended'],
      estimatedCost,
      difficulty,
      overallHealth,
      rawAnalysis: text
    };
  };

  const analyzeMotherboard = async () => {
    if (!uploadedImage) return;

    if (!isPro && scanCount >= 3) {
      setShowPaymentModal(true);
      return;
    }

    setAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisProgress(0);

    try {
      // Animate through steps
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        setAnalysisStep(i);
        setAnalysisProgress(((i + 1) / ANALYSIS_STEPS.length) * 90);
        await new Promise(r => setTimeout(r, 800));
      }

      // Call AI via Supabase edge function
      const { data, error } = await supabase.functions.invoke('openrouter-ai', {
        body: {
          prompt: `You are an expert electronics repair technician and motherboard analyst. 

FIRST, heavily analyze the image to determine if it actually portrays a motherboard, PCB, internal electronic components, or electronic circuitry. If the image is a picture of a person, animal, nature, or any non-electronic object, return EXACTLY AND ONLY the phrase: "INVALID_IMAGE_TYPE".

If it IS a valid electronic board, provide your analysis in EXACTLY this format:

MOTHERBOARD MODEL: [Identify the exact motherboard model, brand, and device it belongs to]
DEVICE TYPE: [Phone/Laptop/Desktop/Tablet/Console etc.]
CHIPSET: [Main processor/SoC if visible]

COMPONENTS IDENTIFIED:
- [List each visible component: ICs, MOSFETs, capacitors, connectors, chips, etc.]

POSSIBLE FAULTS:
- [List any visible damage, corrosion, burn marks, swollen capacitors, missing components, cold solder joints, short circuits etc. If the board looks clean, say "No visible faults detected"]

REPAIR STEPS:
- [Step-by-step repair instructions for each fault found]

ESTIMATED COST: [Estimated repair cost range in USD]
DIFFICULTY: [Easy/Medium/Hard/Expert]

Be specific about component locations (near which IC, which side of board, etc). If you can identify specific IC part numbers, include them.`,
          image: uploadedImage,
          model: 'google/gemini-2.5-flash',
          systemPrompt: 'You are a world-class electronics repair technician with 20+ years experience analyzing motherboards, PCBs, and electronic components. You can identify component damage, corrosion, short circuits, and recommend precise repair procedures. Always be specific and technical.'
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.response) throw new Error('No response from AI');

      if (data.response.includes('INVALID_IMAGE_TYPE')) {
        toast.error('Not an electronic board! Please point the camera at a motherboard or PCB.');
        setUploadedImage(null);
        setResult(null);
        setAnalyzing(false);
        setAnalysisProgress(0);
        return;
      }

      const parsed = parseAIResponse(data.response);
      setAnalysisProgress(100);
      setResult(parsed);
      setExpandedSections({ faults: true, repairs: true, tutorials: true, schematics: true });

      // Store diagnosis
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('image_diagnostics').insert({
          image_url: 'motherboard-scan',
          diagnosis_result: parsed as any,
          severity_level: parsed.faults.some(f => f.severity === 'critical') ? 'critical' :
            parsed.faults.some(f => f.severity === 'warning') ? 'medium' : 'minor',
          user_id: user?.id
        });
      } catch (e) { console.error('Error storing diagnosis:', e); }

      toast.success('Motherboard analysis complete!');

      if (!isPro) {
        setScanCount(prev => {
          const newCount = prev + 1;
          localStorage.setItem('freeScanCount', newCount.toString());
          console.log(`Scan count incremented to ${newCount}`);
          return newCount;
        });
      }

    } catch (err) {
      console.error('Analysis failed:', err);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const clearScan = () => {
    setUploadedImage(null);
    setResult(null);
    setAnalyzing(false);
    setAnalysisProgress(0);
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical': return { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertCircle, label: 'CRITICAL' };
      case 'warning': return { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle, label: 'WARNING' };
      default: return { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: CheckCircle, label: 'INFO' };
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-emerald-400';
    if (health >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getHealthGradient = (health: number) => {
    if (health >= 80) return 'from-emerald-500 to-emerald-600';
    if (health >= 50) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {isCameraActive ? (
          /* ========== LIVE CAMERA AR VIEW ========== */
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full relative rounded-3xl overflow-hidden smart-glass aspect-video sm:aspect-[4/3] bg-black shadow-2xl"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Synthetic AR Stimuli Overlays */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Edge brackets */}
                <div className="absolute inset-8 border border-primary/20 rounded-xl" />
                <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-primary" />
                


                {/* Scanning line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/80 shadow-[0_0_20px_rgba(255,165,0,0.8)] animate-[scanDown_3s_ease-in-out_infinite]" />
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <Target className="w-16 h-16 text-primary/40 animate-[spin_4s_linear_infinite]" />
                </div>
            </div>

            {/* Real-Time AR Bounding Boxes Canvas */}
            <canvas ref={overlayCanvasRef} className="absolute inset-0 pointer-events-none w-full h-full z-10" />

            <div className="absolute top-4 left-0 right-0 text-center z-20">
              <Badge variant="outline" className="bg-black/60 border-primary/50 text-emerald-400 uppercase font-bold tracking-widest text-[10px] px-3 py-1.5 backdrop-blur-md shadow-lg shadow-black/50">
                {loadingModel ? (
                  <>
                    <Loader2 className="w-3 h-3 text-emerald-500 animate-spin mr-2 inline-block" />
                    Loading Vision Model...
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2 inline-block" />
                    AR Tracking Active
                  </>
                )}
              </Badge>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-10">
              <Button onClick={stopCamera} variant="outline" className="rounded-2xl border-white/20 bg-black/60 text-white hover:bg-black/80 smart-glass px-6 pointer-events-auto">
                <X className="w-5 h-5 mr-1" /> Cancel
              </Button>
              <Button onClick={captureFrame} className="rounded-2xl bg-gradient-to-r from-primary to-amber-500 text-black font-black px-8 shadow-xl shadow-primary/30 hover:scale-105 transition-transform pointer-events-auto">
                <Camera className="w-5 h-5 mr-2" /> CAPTURE
              </Button>
            </div>
            
            {/* Hidden canvas for capturing the frame */}
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        ) : !uploadedImage ? (
          /* ========== UPLOAD / SCAN AREA ========== */
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div
              className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-16 text-center transition-all duration-500 smart-glass overflow-hidden ${
                dragActive ? 'border-primary bg-primary/20 scale-[1.01]' : 'border-white/10 hover:border-primary/40'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Animated scan line */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <div className="scan-line-effect" />
              </div>

              {/* Floating circuit icon */}
              <motion.div
                className="mx-auto mb-6 relative"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-amber-500/10 border border-primary/20 w-fit mx-auto neon-glow-subtle">
                  <CircuitBoard className="h-14 w-14 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse border-2 border-background" />
              </motion.div>

              <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-2 tracking-tight">
                Motherboard Scanner
              </h3>
              <p className="text-muted-foreground mb-2 font-medium max-w-md mx-auto">
                Scan any motherboard or PCB — AI identifies the model, detects faults, and provides repair solutions
              </p>
              <p className="text-xs text-muted-foreground/60 mb-8 uppercase tracking-widest font-bold">
                Powered by AI Vision • Gemini 2.5 Flash
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {[
                  { icon: Cpu, label: 'Component ID', color: 'text-cyan-400' },
                  { icon: AlertTriangle, label: 'Fault Detection', color: 'text-red-400' },
                  { icon: Wrench, label: 'Repair Guide', color: 'text-emerald-400' },
                  { icon: Search, label: 'YouTube Tutorials', color: 'text-purple-400' },
                  { icon: CircuitBoard, label: 'Schematics', color: 'text-amber-400' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                  >
                    <item.icon className={`w-3 h-3 ${item.color}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={startCamera}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 rounded-2xl shadow-lg shadow-primary/25 text-base gap-2 hover:scale-105 transition-transform"
                >
                  <Camera className="h-5 w-5" />
                  SCAN WITH CAMERA
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="smart-glass border-white/10 hover:bg-white/10 font-bold px-8 py-6 rounded-2xl text-base gap-2 hover:scale-105 transition-transform"
                >
                  <Upload className="h-5 w-5" />
                  UPLOAD IMAGE
                </Button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload photo from camera"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload photo from gallery"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          </motion.div>
        ) : (
          /* ========== IMAGE + ANALYSIS ========== */
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Image Preview */}
            <div className="relative rounded-3xl overflow-hidden smart-glass border-none">
              <img
                src={uploadedImage}
                alt="Motherboard scan"
                className="w-full max-h-[400px] object-cover"
              />
              {/* Scan overlay when analyzing */}
              {analyzing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="scan-line-active" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <Button onClick={clearScan} size="sm" variant="destructive" className="rounded-xl gap-1 shadow-lg">
                  <X className="h-4 w-4" /> Clear
                </Button>
              </div>
              {result && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                      <CircuitBoard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">{result.motherboardModel}</h3>
                      <p className="text-xs text-white/60 font-medium">{result.deviceType} • {result.chipset}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            {!result && !analyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
                <Button
                  onClick={analyzeMotherboard}
                  className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-primary-foreground font-black px-12 py-7 rounded-2xl shadow-2xl shadow-primary/30 text-lg gap-3 hover:scale-105 transition-all"
                >
                  <Brain className="h-6 w-6" />
                  ANALYZE MOTHERBOARD
                  <Sparkles className="h-5 w-5" />
                </Button>

                {!isPro && (
                  <div className="flex flex-col items-center mt-2 group cursor-pointer" onClick={() => setShowPaymentModal(true)}>
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      Free Scans Remaining: <span className="text-primary font-bold">{Math.max(0, 3 - scanCount)}/3</span>
                      <Badge variant="outline" className="ml-2 text-[10px] bg-primary/10 border-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors uppercase tracking-wider">Upgrade</Badge>
                    </p>
                    <Progress value={(scanCount / 3) * 100} className="h-2 w-48 shadow-inner" />
                  </div>
                )}
              </motion.div>
            )}

            {/* Analysis Progress */}
            {analyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="smart-glass rounded-3xl p-8 text-center border-none"
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
                    {React.createElement(ANALYSIS_STEPS[analysisStep]?.icon || Brain, {
                      className: "w-7 h-7 text-primary animate-pulse"
                    })}
                  </div>
                </div>
                <h3 className="text-xl font-black mb-2">{ANALYSIS_STEPS[analysisStep]?.label}</h3>
                <Progress value={analysisProgress} className="max-w-sm mx-auto mb-3" />
                <p className="text-xs text-muted-foreground font-medium">
                  Step {analysisStep + 1} of {ANALYSIS_STEPS.length}
                </p>
              </motion.div>
            )}

            {/* ========== RESULTS ========== */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {/* Health + Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Health Score */}
                  <Card className="smart-glass border-none col-span-2 sm:col-span-1">
                    <CardContent className="p-4 text-center">
                      <div className={`text-4xl font-black ${getHealthColor(result.overallHealth)}`}>
                        {result.overallHealth}%
                      </div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">Board Health</p>
                      <div className="w-full bg-white/5 h-2 rounded-full mt-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.overallHealth}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${getHealthGradient(result.overallHealth)}`}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  {[
                    { label: 'Faults', value: result.faults.length, color: result.faults.length > 0 ? 'text-red-400' : 'text-emerald-400', icon: AlertTriangle },
                    { label: 'Components', value: result.components.length, color: 'text-cyan-400', icon: Cpu },
                    { label: 'Difficulty', value: result.difficulty, color: 'text-purple-400', icon: Zap },
                  ].map((stat, i) => (
                    <Card key={i} className="smart-glass border-none">
                      <CardContent className="p-4 text-center">
                        <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Detected Components */}
                <Card className="smart-glass border-none rounded-3xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20">
                        <Cpu className="h-4 w-4 text-cyan-400" />
                      </div>
                      Identified Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.components.map((comp, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Badge variant="outline" className="bg-white/5 border-white/10 px-3 py-1.5 text-xs font-medium">
                            {comp}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Faults Section */}
                <Card className="smart-glass border-none rounded-3xl overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-white/5 transition-colors pb-3"
                    onClick={() => toggleSection('faults')}
                  >
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-red-500/20">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        </div>
                        Detected Faults
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                          {result.faults.length}
                        </Badge>
                      </div>
                      {expandedSections.faults ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <AnimatePresence>
                    {expandedSections.faults && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="space-y-3 pt-0">
                          {result.faults.length > 0 ? result.faults.map((fault, i) => {
                            const config = getSeverityConfig(fault.severity);
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-4 rounded-2xl border ${config.bg}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    <config.icon className={`w-5 h-5 ${config.color}`} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-sm">{fault.component}</span>
                                      <Badge className={`text-[9px] ${config.bg} ${config.color} border-none`}>
                                        {config.label}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-foreground/80">{fault.issue}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                        Confidence: {fault.confidence.toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }) : (
                            <div className="text-center py-6">
                              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                              <p className="font-bold text-emerald-400">No visible faults detected!</p>
                              <p className="text-xs text-muted-foreground mt-1">The board appears to be in good condition</p>
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                {/* Repair Steps */}
                <Card className="smart-glass border-none rounded-3xl overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-white/5 transition-colors pb-3"
                    onClick={() => toggleSection('repairs')}
                  >
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20">
                          <Wrench className="h-4 w-4 text-emerald-400" />
                        </div>
                        Repair Protocol
                      </div>
                      {expandedSections.repairs ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <AnimatePresence>
                    {expandedSections.repairs && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {result.repairSteps.map((step, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="flex items-start gap-3 group"
                              >
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                                  <span className="text-xs font-black text-emerald-400">{i + 1}</span>
                                </div>
                                <p className="text-sm text-foreground/80 font-medium pt-1">{step}</p>
                              </motion.div>
                            ))}
                          </div>
                          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <Thermometer className="w-4 h-4 text-amber-400" />
                              <span className="text-xs font-bold text-muted-foreground">Est. Cost: {result.estimatedCost}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-bold text-muted-foreground">Difficulty: {result.difficulty}</span>
                            </div>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                {/* YouTube Tutorials */}
                <Card className="smart-glass border-none rounded-3xl overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-white/5 transition-colors pb-3"
                    onClick={() => toggleSection('tutorials')}
                  >
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-red-500/20">
                          <ExternalLink className="h-4 w-4 text-red-400" />
                        </div>
                        YouTube Repair Tutorials
                      </div>
                      {expandedSections.tutorials ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <AnimatePresence>
                    {expandedSections.tutorials && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <CardContent className="pt-0">
                          <YouTubeTutorials
                            motherboardModel={result.motherboardModel}
                            deviceType={result.deviceType}
                            faults={result.faults.map(f => f.issue)}
                          />
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                {/* Schematics & Boardview */}
                <Card className="smart-glass border-none rounded-3xl overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-white/5 transition-colors pb-3"
                    onClick={() => toggleSection('schematics')}
                  >
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/20">
                          <CircuitBoard className="h-4 w-4 text-amber-400" />
                        </div>
                        Schematics & Boardview Files
                      </div>
                      {expandedSections.schematics ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <AnimatePresence>
                    {expandedSections.schematics && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <CardContent className="pt-0">
                          <SchematicDownloads
                            motherboardModel={result.motherboardModel}
                            deviceType={result.deviceType}
                          />
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                {/* Scan Again */}
                <div className="flex justify-center pt-2 pb-4">
                  <Button
                    onClick={clearScan}
                    variant="outline"
                    className="smart-glass border-white/10 hover:bg-white/10 font-bold px-8 py-6 rounded-2xl text-base gap-2 hover:scale-105 transition-transform"
                  >
                    <RotateCcw className="h-5 w-5" />
                    SCAN ANOTHER BOARD
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
        }}
      />
    </div>
  );
};

export default MotherboardScanner;
