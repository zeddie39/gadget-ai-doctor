import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera, X, CheckCircle, AlertTriangle, AlertCircle, Scan, Brain, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AIFeedback from './AIFeedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DiagnosisResult {
  issue: string;
  severity: 'minor' | 'medium' | 'critical';
  description: string;
  recommendations: string[];
  confidence: number;
  modelNumber?: string;
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
  const [isThermalMode, setIsThermalMode] = useState(false);
  
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
      const promptText = isThermalMode
        ? `You are an expert electronics repair technician analyzing a thermal heat-map image of a motherboard to find a short circuit. Find the brightest/hottest glowing spot. Identify exactly what specific component is overheating (e.g., specific IC package, ceramic capacitor, resistor) at that hotspot. Explain that this component is likely experiencing a short-to-ground and drawing massive excess current. Return ONLY a JSON object with this exact structure:
          {
            "issue": "Short circuit at [component]",
            "severity": "critical",
            "description": "Detailed explanation of the hotspot and what it means",
            "recommendations": ["Remove power immediately", "Use hot air or rework station to replace the shorted capacitor/IC", "Verify short is cleared using multimeter"],
            "confidence": 0.95
          }`
        : `You are an expert electronics repair technician. Analyze this image of a device/motherboard. 
          Look closely for any printed model numbers on the board (e.g., 820-xxxx for Apple, LA-xxxxP for generic, etc.).
          Return ONLY a JSON object with this exact structure:
          {
            "issue": "The primary issue or damage found",
            "severity": "minor" or "medium" or "critical",
            "description": "Detailed description of the damage and components affected",
            "recommendations": ["Array of repair steps"],
            "modelNumber": "Extracted model number strictly as a string, or null if none is clearly visible",
            "confidence": 0.95
          }`;

      const { data, error } = await supabase.functions.invoke('analyze-device-image', {
        body: {
          imageBase64: imageData,
          prompt: promptText
        }
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message);
      }

      if (data) {
        let aiResult = data;
        if (typeof data === 'string') {
          // Sometimes Gemini returns the JSON inside markdown code blocks
          const cleanedText = data.replace(/```json/g, '').replace(/```/g, '').trim();
          aiResult = JSON.parse(cleanedText);
        }

        const enhancedResult: DiagnosisResult = {
          issue: aiResult.issue || 'Unknown issue',
          severity: aiResult.severity || 'medium',
          description: aiResult.description || 'Analysis completed.',
          recommendations: aiResult.recommendations || ['Consult a professional'],
          confidence: aiResult.confidence || 0.8,
          modelNumber: aiResult.modelNumber || ''
        };
        
        // Store enhanced AI result in database
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: dbData, error: dbError } = await supabase.from('image_diagnostics').insert({
            image_url: imageData,
            diagnosis_result: enhancedResult as any,
            severity_level: enhancedResult.severity,
            user_id: user?.id
          }).select().single();

          if (dbData) {
            setDiagnosisId(dbData.id);
          }
        } catch (dbError) {
          console.error('Error storing diagnosis:', dbError);
        }

        return enhancedResult;
      }
      
      throw new Error("No data returned from AI");
    } catch (error) {
      console.error('Gemini AI error:', error);
      toast.error("AI Analysis failed. Make sure your Gemini API key is active.");
      // Throw error to break out and stop the UI loader
      throw error;
    }
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
    setIsThermalMode(false);
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
        return 'border-destructive/30 bg-destructive/10';
      case 'medium':
        return 'border-accent/30 bg-accent/10';
      case 'minor':
        return 'border-emerald-500/30 bg-emerald-500/10';
      default:
        return 'border-border bg-muted';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      
      {!uploadedImage ? (
        <div
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 smart-glass ${
            dragActive 
              ? 'border-primary bg-primary/20 scale-[1.02]' 
              : 'border-white/10 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="p-6 rounded-full bg-primary/10 w-fit mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
            <Upload className="h-12 w-12 text-primary animate-bounce" />
          </div>
          <h3 className="text-xl font-black text-foreground mb-2">
            AI Vision Diagnosis
          </h3>
          <p className="text-muted-foreground mb-6 font-medium">
            Drop your device image here, or click to browse
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> Screen Cracks
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <CheckCircle className="w-3 h-3 text-blue-500" /> Water Damage
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <CheckCircle className="w-3 h-3 text-red-500" /> Hardware Safety
            </div>
          </div>

          {!uploadedImage && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <Label htmlFor="thermal-mode-toggle" className={`font-bold transition-colors ${isThermalMode ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {isThermalMode ? '🔥 Thermal Camera Mode' : '📷 Standard Scan Mode'}
              </Label>
              <Switch
                id="thermal-mode-toggle"
                checked={isThermalMode}
                onCheckedChange={setIsThermalMode}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            aria-label="Upload device image"
            title="Upload device image"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 rounded-xl shadow-lg shadow-primary/20">
            <Upload className="mr-2 h-4 w-4" />
            SELECT IMAGE
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 smart-glass">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Scan className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label htmlFor="synthetic-stimuli-photo" className="text-sm font-bold">
                    Synthetic Stimuli Overlay
                  </Label>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    AR measurement & analysis guides
                  </p>
                </div>
              </div>
              <Switch
                id="synthetic-stimuli-photo"
                checked={syntheticStimuli}
                onCheckedChange={setSyntheticStimuli}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            
            {syntheticStimuli && (
              <div className="p-4 bg-card rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Stimuli Type</Label>
                    <Select value={stimuliType} onValueChange={(val) => setStimuliType(val as any)}>
                      <SelectTrigger className="w-full mt-1 bg-background/50 border-white/10">
                        <SelectValue placeholder="Select Stimuli" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Measurement Grid</SelectItem>
                        <SelectItem value="crosshair">Targeting Crosshair</SelectItem>
                        <SelectItem value="measurement">Scale Ruler</SelectItem>
                        <SelectItem value="thermal">Thermal Overlay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Intensity: {Math.round(stimuliIntensity * 100)}%</Label>
                    <input
                      type="range"
                      aria-label="Stimuli Intensity"
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
            <div className="text-center py-12 smart-glass rounded-3xl border-none shadow-xl">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">
                Neural Analysis Initiated...
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm px-4">
                Our AI model is currently scanning damage patterns and cross-referencing hardware failure databases.
              </p>
            </div>
          ) : diagnosisResult ? (
            <>
              <div className={`border-none rounded-3xl p-8 smart-glass shadow-2xl overflow-hidden relative ${getSeverityColor(diagnosisResult.severity)}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Brain className="w-24 h-24" />
                </div>
                
                <div className="flex items-start gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-white/10 shadow-inner">
                    {getSeverityIcon(diagnosisResult.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-2xl font-black text-foreground">
                        {(diagnosisResult as any).device_type || diagnosisResult.issue}
                      </h3>
                      <Badge variant="outline" className="bg-white/5 border-white/10 font-bold">
                        {Math.round(diagnosisResult.confidence * 100)}% Confidence
                      </Badge>
                    </div>
                    <p className="text-xs uppercase tracking-widest font-black text-muted-foreground">
                      Diagnostic ID: {diagnosisId?.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {(diagnosisResult as any).visual_analysis && (
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                         <h4 className="text-xs font-black uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                           <Scan className="w-3 h-3" /> Visual Observation
                         </h4>
                        <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                          {(diagnosisResult as any).visual_analysis}
                        </p>
                      </div>
                    )}
                    
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <h4 className="text-xs font-black uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" /> Primary Issue
                      </h4>
                      <p className="text-lg font-bold text-foreground">
                        {diagnosisResult.issue}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
                      <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
                        <Scan className="w-3 h-3" /> Schematic Vault Search
                      </h4>
                      <div className="flex flex-col gap-2">
                         <Label className="text-xs text-muted-foreground font-bold">Board Model Number</Label>
                         <div className="flex gap-2">
                           <input 
                             type="text" 
                             defaultValue={diagnosisResult.modelNumber || ''} 
                             placeholder="e.g. 820-3437, LA-C701P" 
                             className="flex-1 bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
                             id="schematic-model-input"
                           />
                           <Button 
                             onClick={() => {
                               const val = (document.getElementById('schematic-model-input') as HTMLInputElement)?.value;
                               if (val) {
                                 window.open(`https://www.google.com/search?q=filetype:pdf+OR+filetype:brd+"${val}"+schematic+DOWNLOAD`, '_blank');
                               } else {
                                 toast.error("Please enter a model number to search");
                               }
                             }}
                             className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 rounded-xl"
                           >
                             Find PDF
                           </Button>
                         </div>
                         {diagnosisResult.modelNumber ? (
                           <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                             <CheckCircle className="w-3 h-3" /> AI successfully extracted model number
                           </p>
                         ) : (
                           <p className="text-[10px] text-muted-foreground mt-1">
                             Type the model printed on the silk-screen to find its schematic
                           </p>
                         )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white/10 rounded-2xl shadow-inner border border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                      <Wrench className="w-3 h-3" /> Repair Protocol
                    </h4>
                    <ul className="space-y-3">
                      {diagnosisResult.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-foreground/80 flex items-start gap-3 group">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                          <span className="font-medium">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 ${
                    diagnosisResult.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                    diagnosisResult.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      diagnosisResult.severity === 'critical' ? 'bg-red-500' :
                      diagnosisResult.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-emerald-500'
                    }`} />
                    {diagnosisResult.severity} PRIORITY STATUS
                  </div>
                  <Button
                    onClick={clearImage}
                    variant="ghost"
                    className="smart-glass border-white/5 hover:bg-white/10 font-bold px-6 rounded-xl transition-all hover:scale-105"
                  >
                    Diagnose Another
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
