import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Upload, Camera, RefreshCw, Plus, Brain, Trash2 } from 'lucide-react';

interface TrainingClass {
  id: string;
  name: string;
  sampleCount: number;
}

export default function CustomVisionTrainer() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [classes, setClasses] = useState<TrainingClass[]>([
    { id: 'class-0', name: 'Intact Component', sampleCount: 0 },
    { id: 'class-1', name: 'Burnt Component', sampleCount: 0 }
  ]);
  const [newClassName, setNewClassName] = useState('');
  const [activeTestImage, setActiveTestImage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{label: string, confidence: number}[]>([]);

  // Refs for TensorFlow models
  const classifierRef = useRef<knnClassifier.KNNClassifier | null>(null);
  const mobilenetRef = useRef<mobilenet.MobileNet | null>(null);

  useEffect(() => {
    initModels();
  }, []);

  const initModels = async () => {
    try {
      setIsInitializing(true);
      await tf.ready();
      
      // Load mobilenet
      const mn = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      mobilenetRef.current = mn;

      // Create empty KNN classifier
      classifierRef.current = knnClassifier.create();
      
      setIsInitializing(false);
      toast.success('Transfer learning engine initialized! Ready to train.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to initialize AI engine');
      setIsInitializing(false);
    }
  };

  const addClass = () => {
    if (!newClassName.trim()) return;
    const newClass = {
      id: `class-${Date.now()}`,
      name: newClassName.trim(),
      sampleCount: 0
    };
    setClasses([...classes, newClass]);
    setNewClassName('');
  };

  const removeClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    toast.info('Class removed from UI. To clear AI memory, click Reset Training.');
  };

  const resetTraining = () => {
    if (classifierRef.current) {
      classifierRef.current.clearAllClasses();
      setClasses(classes.map(c => ({ ...c, sampleCount: 0 })));
      setTestResults([]);
      setActiveTestImage(null);
      toast.success('AI memory wiped successfully.');
    }
  };

  // Process uploaded images into a specific class
  const handleUploadToClass = async (e: React.ChangeEvent<HTMLInputElement>, classId: string, className: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    if (!classifierRef.current || !mobilenetRef.current) {
      toast.error("Models not ready yet!");
      return;
    }

    toast.info(`Processing ${files.length} images for ${className}...`);
    
    let processed = 0;
    for (const file of files) {
      try {
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();
        img.src = imageUrl;
        
        await new Promise((resolve) => {
          img.onload = async () => {
            // Get intermediate features from mobilenet
            const features = mobilenetRef.current!.infer(img, true);
            // Add example to KNN classifier
            classifierRef.current!.addExample(features, className);
            
            URL.revokeObjectURL(imageUrl);
            resolve(true);
          };
        });
        processed++;
      } catch (err) {
        console.error("Error processing image: ", err);
      }
    }
    
    // Update sample count in UI
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, sampleCount: c.sampleCount + processed } : c
    ));
    
    toast.success(`Successfully trained on ${processed} images!`);
  };

  // Test the model
  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const imageUrl = URL.createObjectURL(file);
    setActiveTestImage(imageUrl);
    
    if (!classifierRef.current || !mobilenetRef.current || classifierRef.current.getNumClasses() === 0) {
      toast.error("Please add training data to at least one class first!");
      return;
    }

    const img = new Image();
    img.src = imageUrl;
    img.onload = async () => {
      try {
        // Get intermediate features
        const features = mobilenetRef.current!.infer(img, true);
        
        // Use KNN to predict
        const result = await classifierRef.current!.predictClass(features);
        
        // Format results
        const rawConfidences = result.confidences;
        const formatted = Object.entries(rawConfidences)
            .map(([label, score]) => ({ label, confidence: score as number }))
            .sort((a, b) => b.confidence - a.confidence);
            
        setTestResults(formatted);
        
        if (formatted[0].confidence > 0.6) {
          toast.success(`AI Prediction: ${formatted[0].label}`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Prediction failed");
      }
    };
  };

  const totalSamples = classes.reduce((sum, c) => sum + c.sampleCount, 0);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-7xl animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
          Custom Vision Trainer
        </h1>
        <p className="text-muted-foreground w-full md:w-2/3">
          Upload bulk image datasets from Kaggle to train a custom hardware defect detector 
          directly in your browser. Powered by <strong>MobileNet Transfer Learning</strong>. No data leaves your device.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-sm glass">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl">Training Data Classes</CardTitle>
                <CardDescription>Upload image datasets into specific categories</CardDescription>
              </div>
              <Badge variant={isInitializing ? "secondary" : "default"} className={isInitializing ? "" : "bg-green-500/20 text-green-500"}>
                {isInitializing ? (
                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Engine Booting</>
                ) : (
                  <><Brain className="w-3 h-3 mr-1" /> Engine Ready</>
                )}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                
                {classes.map((cls) => (
                  <div key={cls.id} className="flex flex-col md:flex-row items-start md:items-center p-4 border rounded-lg bg-card/30 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{cls.name}</h3>
                        <Badge variant="outline" className={cls.sampleCount > 0 ? "text-blue-500 border-blue-500/30" : "text-muted-foreground"}>
                          {cls.sampleCount} images
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a folder of images to teach the AI what to look for.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative w-full md:w-auto">
                        <Input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => handleUploadToClass(e, cls.id, cls.name)}
                          disabled={isInitializing}
                        />
                        <Button variant="outline" className="w-full md:w-auto shrink-0 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/30">
                          <Upload className="w-4 h-4 mr-2" />
                          Add Images
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeClass(cls.id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-2">
                  <Input 
                    placeholder="E.g., Component Missing, Scratched Lens" 
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addClass()}
                    className="flex-1"
                  />
                  <Button onClick={addClass} variant="secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Class
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-border/40">
            <div>
              <p className="font-medium">Total Training Examples: {totalSamples}</p>
              <p className="text-xs text-muted-foreground">Aim for at least 20-50 images per class for decent accuracy.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetTraining}>
                <RefreshCw className="w-4 h-4 mr-2 text-red-500" />
                Reset Model
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-border/40 shadow-sm glass h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Live Test</CardTitle>
              <CardDescription>Test your custom model against new images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="relative border-2 border-dashed border-border/60 rounded-xl aspect-square flex flex-col items-center justify-center bg-background/30 overflow-hidden hover:bg-background/50 transition-colors">
                <Input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleTestUpload}
                />
                
                {activeTestImage ? (
                  <img src={activeTestImage} alt="Test" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                      <Camera className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="font-medium">Click or Drag Image to Test</p>
                  </div>
                )}
              </div>

              {testResults.length > 0 && (
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/40">
                  <h4 className="font-semibold text-sm">Prediction Results:</h4>
                  {testResults.map((result, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={idx === 0 ? "font-bold text-primary" : "text-muted-foreground"}>{result.label}</span>
                        <span className={idx === 0 ? "font-bold" : "text-muted-foreground"}>{Math.round(result.confidence * 100)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <style>{`._cv_bar_${idx} { width: ${result.confidence * 100}%; }`}</style>
                        <div 
                          className={`h-2 rounded-full _cv_bar_${idx} ${idx === 0 ? 'bg-blue-500' : 'bg-muted-foreground/30'}`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
