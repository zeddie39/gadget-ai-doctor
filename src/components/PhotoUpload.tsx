
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera, X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

  const analyzeImage = async (imageData: string) => {
    // Simulate AI analysis with realistic results
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
    
    // Store in database
    try {
      await supabase.from('image_diagnostics').insert({
        image_url: imageData,
        diagnosis_result: randomResult,
        severity_level: randomResult.severity
      });
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

  const clearImage = () => {
    setUploadedImage(null);
    setAnalyzing(false);
    setDiagnosisResult(null);
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
          <div className="relative">
            <img
              src={uploadedImage}
              alt="Uploaded device"
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button
              onClick={clearImage}
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
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
            <div className={`border rounded-lg p-6 ${getSeverityColor(diagnosisResult.severity)}`}>
              <div className="flex items-start gap-3 mb-4">
                {getSeverityIcon(diagnosisResult.severity)}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {diagnosisResult.issue} Detected
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Confidence: {Math.round(diagnosisResult.confidence * 100)}%
                  </p>
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
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
