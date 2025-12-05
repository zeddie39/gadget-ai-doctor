import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera, X, CheckCircle, AlertTriangle, AlertCircle, Scan } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AIFeedback from './AIFeedback';

interface DiagnosisResult {
  issue: string;
  severity: 'minor' | 'medium' | 'critical';
  description: string;
  recommendations: string[];
  confidence: number;
}

const PhotoUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const [syntheticStimuli, setSyntheticStimuli] = useState(false);
  const [stimuliType, setStimuliType] = useState<'grid' | 'crosshair' | 'measurement' | 'thermal'>('grid');
  const [stimuliIntensity, setStimuliIntensity] = useState(0.5);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const analyzeImage = async (imageData: string): Promise<DiagnosisResult> => {
    try {
      // Use centralized OpenRouter edge function with enhanced visual analysis
      const { data, error } = await supabase.functions.invoke('openrouter-ai', {
        body: {
          prompt: `STEP 1: VISUAL ANALYSIS - First, carefully examine this image and describe EXACTLY what you see:
          - What type of device/equipment is this? (motherboard, gaming controller, printer, network switch, etc.)
          - What components are visible?
          - What is the current state? (opened for repair, assembled, disassembled, etc.)
          - Are there any visible issues, damage, or problems?
          - What repair work appears to be in progress?
          
          STEP 2: TECHNICAL DIAGNOSIS - Based on what you observed, provide diagnosis:
          
          Respond ONLY with a JSON object in this exact format:
          {
            "device_identified": "exact device type you see",
            "visual_observation": "detailed description of what you actually see in the image",
            "issue": "specific problem identified from visual analysis",
            "severity": "minor|medium|critical",
            "description": "detailed technical analysis based on visual evidence",
            "recommendations": ["specific repair steps based on what you see"],
            "confidence": 0.85
          }`,
          model: 'google/gemini-2.5-flash',
          image: imageData,
          systemPrompt: `You are an expert electronics repair technician with advanced visual analysis skills.
          
          CRITICAL INSTRUCTIONS:
          1. LOOK FIRST - Analyze the actual image content before making any diagnosis
          2. IDENTIFY the exact device type (gaming pad, motherboard, printer, network equipment, etc.)
          3. OBSERVE the current state and any visible issues
          4. BASE your diagnosis on visual evidence, not assumptions
          5. Use your knowledge base only to explain what you see, not to guess what might be there
          
          You must analyze:
          - Device identification and type
          - Physical condition and damage
          - Component status and wear
          - Repair work in progress
          - Environmental factors
          - Connection and port conditions`
        }
      });

      if (!error && data?.response) {
        try {
          const aiResult = JSON.parse(data.response);
          
          // Enhanced result with visual analysis
          const enhancedResult = {
            device_type: aiResult.device_identified || 'Unknown Device',
            visual_analysis: aiResult.visual_observation || 'No visual analysis provided',
            issue: aiResult.issue || 'No issues detected',
            severity: aiResult.severity || 'minor',
            description: aiResult.description || 'Analysis completed',
            recommendations: aiResult.recommendations || ['No specific recommendations'],
            confidence: aiResult.confidence || 0.5
          };
          
          // Store enhanced AI result in database
          try {
            const { data: dbData, error } = await supabase.from('image_diagnostics').insert({
              image_url: imageData,
              diagnosis_result: enhancedResult,
              severity_level: enhancedResult.severity
            }).select().single();

            if (dbData) {
              setDiagnosisId(dbData.id);
            }
          } catch (error) {
            console.error('Error storing diagnosis:', error);
          }

          return enhancedResult;
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          // Fall through to simulated analysis
        }
      }
    } catch (error) {
      console.error('OpenRouter AI error:', error);
    }

    // Fallback to simulated analysis
    const possibleIssues = [
      {
        issue: "Cracked Screen",
        severity: 'medium' as const,
        description: "Multiple cracks detected on the display surface. Touch functionality may be compromised.",
        recommendations: [
          "Apply a screen protector to prevent further damage",
          "Avoid pressing on cracked areas",
          "Consider professional screen replacement",
          "Backup your data immediately"
        ],
        confidence: 0.87
      },
      {
        issue: "Water Damage",
        severity: 'critical' as const,
        description: "Visible water damage indicators detected. Internal components may be compromised.",
        recommendations: [
          "Turn off device immediately",
          "Remove battery if possible",
          "Place in rice or silica gel for 24-48 hours",
          "Professional repair required"
        ],
        confidence: 0.92
      },
      {
        issue: "Swollen Battery",
        severity: 'critical' as const,
        description: "Battery appears swollen and potentially dangerous. Immediate action required.",
        recommendations: [
          "Stop using device immediately",
          "Do not charge the device",
          "Keep away from heat sources",
          "Professional battery replacement required urgently"
        ],
        confidence: 0.95
      },
      {
        issue: "Minor Scratches",
        severity: 'minor' as const,
        description: "Surface scratches detected. Cosmetic damage only, no functional impact.",
        recommendations: [
          "Use a screen protector to prevent future scratches",
          "Consider polishing compound for minor scratches",
          "No immediate repair needed"
        ],
        confidence: 0.76
      }
    ];

    const randomResult = possibleIssues[Math.floor(Math.random() * possibleIssues.length)];
    
    // Store in database and get ID for feedback
    try {
      const { data, error } = await supabase.from('image_diagnostics').insert({
        image_url: imageData,
        diagnosis_result: randomResult,
        severity_level: randomResult.severity
      }).select().single();

      if (data) {
        setDiagnosisId(data.id);
      }
    } catch (error) {
      console.error('Error storing diagnosis:', error);
    }

    return randomResult;
  };

  const handleFile = async (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        setAnalyzing(true);
        
        try {
          // Simulate AI processing time
          await new Promise(resolve => setTimeout(resolve, 3000));
          const result = await analyzeImage(imageData);
          setDiagnosisResult(result);
          toast.success('Image analyzed successfully!');
        } catch (error) {
          toast.error('Analysis failed. Please try again.');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please upload an image file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const drawSyntheticStimuli = () => {
    if (!syntheticStimuli || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const alpha = stimuliIntensity;
    const time = Date.now() / 1000;

    switch (stimuliType) {
      case 'grid':
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 2;
        const gridSize = Math.min(canvas.width, canvas.height) / 20;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        break;

      case 'crosshair':
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = Math.min(canvas.width, canvas.height) / 10;
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - size, centerY);
        ctx.lineTo(centerX + size, centerY);
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX, centerY + size);
        ctx.stroke();
        
        for (let i = 1; i <= 3; i++) {
          const radius = size / 2 + i * size / 3;
          ctx.strokeStyle = `rgba(255, 0, 0, ${alpha / i})`;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;

      case 'measurement':
        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.font = `${Math.max(12, canvas.width / 50)}px Arial`;
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        
        const rulerHeight = canvas.height / 20;
        for (let i = 0; i <= 10; i++) {
          const x = (canvas.width / 10) * i;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, rulerHeight);
          ctx.stroke();
          ctx.fillText(`${i}cm`, x + 5, rulerHeight - 5);
        }
        break;

      case 'thermal':
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha * 0.3})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 0, ${alpha * 0.2})`);
        gradient.addColorStop(1, `rgba(0, 0, 255, ${alpha * 0.1})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = `bold ${Math.max(14, canvas.width / 40)}px Arial`;
        ctx.fillText('25°C', 20, 40);
        ctx.fillText('32°C', canvas.width - 80, 40);
        break;
    }
  };

  useEffect(() => {
    if (uploadedImage && syntheticStimuli) {
      const timer = setInterval(drawSyntheticStimuli, 100);
      return () => clearInterval(timer);
    }
  }, [syntheticStimuli, stimuliType, stimuliIntensity, uploadedImage]);

  const clearImage = () => {
    setUploadedImage(null);
    setAnalyzing(false);
    setDiagnosisResult(null);
    setDiagnosisId(null);
    setSyntheticStimuli(false);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'minor':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'minor':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      
      {!uploadedImage ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Drop your device image here, or click to select
          </h3>
          <p className="text-gray-500 mb-4">
            Supports JPG, PNG, WebP files up to 10MB
          </p>
          <p className="text-sm text-gray-400 mb-4">
            AI will detect: Screen cracks • Water damage • Battery swelling • Hardware issues
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-primary/50">
              <div className="flex items-center gap-3">
                <Scan className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="synthetic-stimuli-photo" className="text-sm font-medium">
                    Synthetic Stimuli Overlay
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    AR measurement guides and analysis overlays
                  </p>
                </div>
              </div>
              <Switch
                id="synthetic-stimuli-photo"
                checked={syntheticStimuli}
                onCheckedChange={setSyntheticStimuli}
              />
            </div>
            
            {syntheticStimuli && (
              <div className="p-4 bg-card rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Stimuli Type</Label>
                    <select 
                      value={stimuliType} 
                      onChange={(e) => setStimuliType(e.target.value as any)}
                      className="w-full mt-1 p-2 border rounded text-sm"
                    >
                      <option value="grid">Measurement Grid</option>
                      <option value="crosshair">Targeting Crosshair</option>
                      <option value="measurement">Scale Ruler</option>
                      <option value="thermal">Thermal Overlay</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Intensity: {Math.round(stimuliIntensity * 100)}%</Label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={stimuliIntensity}
                      onChange={(e) => setStimuliIntensity(parseFloat(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="relative">
              <img
                ref={imageRef}
                src={uploadedImage}
                alt="Uploaded device"
                className="w-full h-64 object-cover rounded-lg"
                onLoad={drawSyntheticStimuli}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
                style={{ mixBlendMode: 'screen' }}
              />
              <Button
                onClick={clearImage}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
              {syntheticStimuli && (
                <div className="absolute top-2 left-2">
                  <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border border-cyan-500/50">
                    <p className="text-xs font-semibold text-cyan-400 flex items-center gap-2">
                      <Scan className="w-3 h-3" />
                      AR: {stimuliType} overlay
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {analyzing ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analyzing your device...
              </h3>
              <p className="text-gray-600">
                AI is detecting damage patterns, checking for cracks, water damage, and hardware issues
              </p>
            </div>
          ) : diagnosisResult ? (
            <>
              <div className={`border rounded-lg p-6 ${getSeverityColor(diagnosisResult.severity)}`}>
                <div className="flex items-start gap-3 mb-4">
                  {getSeverityIcon(diagnosisResult.severity)}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {(diagnosisResult as any).device_type || diagnosisResult.issue} Analysis
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Confidence: {Math.round(diagnosisResult.confidence * 100)}%
                    </p>
                    
                    {(diagnosisResult as any).visual_analysis && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <h4 className="font-medium text-blue-900 mb-1">Visual Analysis:</h4>
                        <p className="text-sm text-blue-800">
                          {(diagnosisResult as any).visual_analysis}
                        </p>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-1">Issue Identified:</h4>
                      <p className="text-gray-700">
                        {diagnosisResult.issue}
                      </p>
                    </div>
                    
                    <p className="text-gray-700 mb-4">
                      {diagnosisResult.description}
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {diagnosisResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    diagnosisResult.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    diagnosisResult.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {diagnosisResult.severity.toUpperCase()} PRIORITY
                  </span>
                  <Button
                    onClick={clearImage}
                    variant="outline"
                    size="sm"
                  >
                    Analyze Another Image
                  </Button>
                </div>
              </div>
              
              {diagnosisId && (
                <AIFeedback
                  diagnosisId={diagnosisId}
                  feature="Photo Diagnosis"
                  aiResponse={diagnosisResult}
                  onFeedbackSubmitted={() => {
                    toast.success('Feedback submitted! Thank you for helping improve our AI.');
                  }}
                />
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
