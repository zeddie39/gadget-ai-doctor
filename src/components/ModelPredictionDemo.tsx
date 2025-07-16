import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Target, Zap } from 'lucide-react';
import { DeviceDiagnosisModel } from '@/lib/tensorflowModel';
import { toast } from 'sonner';

const ModelPredictionDemo: React.FC = () => {
  const [model, setModel] = useState<DeviceDiagnosisModel | null>(null);
  const [features, setFeatures] = useState({
    helpfulScore: 0.5,
    featureType: 'photo_diagnosis',
    responseQuality: 0.6,
    userSatisfaction: 0.7
  });
  const [prediction, setPrediction] = useState<{
    prediction: number;
    confidence: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Try to load saved model
    const loadExistingModel = async () => {
      try {
        const deviceModel = new DeviceDiagnosisModel({
          inputSize: 4,
          hiddenLayers: [16, 8],
          outputSize: 2,
          learningRate: 0.001,
          batchSize: 32,
          epochs: 50
        });
        
        // Try to load previously saved model
        await deviceModel.loadModel('device-diagnosis-model');
        setModel(deviceModel);
        toast.success('Loaded existing model');
      } catch (error) {
        console.log('No existing model found, create one first');
        // Create a new untrained model
        const deviceModel = new DeviceDiagnosisModel({
          inputSize: 4,
          hiddenLayers: [16, 8],
          outputSize: 2,
          learningRate: 0.001,
          batchSize: 32,
          epochs: 50
        });
        setModel(deviceModel);
      }
    };

    loadExistingModel();
  }, []);

  const handlePredict = async () => {
    if (!model) {
      toast.error('No model loaded');
      return;
    }

    setIsLoading(true);
    try {
      const featureVector = [
        features.helpfulScore,
        encodeFeatureType(features.featureType),
        features.responseQuality,
        features.userSatisfaction
      ];

      const result = await model.predict(featureVector);
      setPrediction(result);
      
      toast.success(`Prediction: ${result.prediction === 1 ? 'Helpful' : 'Not Helpful'} (${(result.confidence * 100).toFixed(1)}% confidence)`);
    } catch (error) {
      console.error('Prediction failed:', error);
      toast.error('Prediction failed. Make sure the model is trained first.');
    } finally {
      setIsLoading(false);
    }
  };

  const encodeFeatureType = (featureType: string): number => {
    const typeMapping: { [key: string]: number } = {
      'photo_diagnosis': 0.1,
      'battery_health': 0.2,
      'storage_analysis': 0.3,
      'troubleshooting': 0.4,
      'health_score': 0.5,
      'chat_assistance': 0.6
    };
    return typeMapping[featureType] || 0;
  };

  const updateFeature = (key: string, value: any) => {
    setFeatures(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <CardTitle>Real-time Prediction Demo</CardTitle>
        </div>
        <CardDescription>
          Test your trained model with custom input features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="helpfulScore">Helpful Score</Label>
            <Input
              id="helpfulScore"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={features.helpfulScore}
              onChange={(e) => updateFeature('helpfulScore', parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="featureType">Feature Type</Label>
            <Select value={features.featureType} onValueChange={(value) => updateFeature('featureType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo_diagnosis">Photo Diagnosis</SelectItem>
                <SelectItem value="battery_health">Battery Health</SelectItem>
                <SelectItem value="storage_analysis">Storage Analysis</SelectItem>
                <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                <SelectItem value="health_score">Health Score</SelectItem>
                <SelectItem value="chat_assistance">Chat Assistance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responseQuality">Response Quality</Label>
            <Input
              id="responseQuality"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={features.responseQuality}
              onChange={(e) => updateFeature('responseQuality', parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userSatisfaction">User Satisfaction</Label>
            <Input
              id="userSatisfaction"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={features.userSatisfaction}
              onChange={(e) => updateFeature('userSatisfaction', parseFloat(e.target.value))}
            />
          </div>
        </div>

        <Button 
          onClick={handlePredict}
          disabled={isLoading || !model}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-spin" />
              Predicting...
            </>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              Make Prediction
            </>
          )}
        </Button>

        {prediction && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Prediction Result</span>
              <Badge variant={prediction.prediction === 1 ? 'default' : 'destructive'}>
                {prediction.prediction === 1 ? 'Helpful' : 'Not Helpful'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confidence</span>
                <span className="text-sm font-bold">
                  {(prediction.confidence * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${prediction.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Feature Explanation</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Helpful Score:</strong> Binary indicator (0 or 1)</li>
            <li>• <strong>Feature Type:</strong> Encoded diagnostic feature category</li>
            <li>• <strong>Response Quality:</strong> Quality score based on response complexity</li>
            <li>• <strong>User Satisfaction:</strong> Sentiment analysis of user comments</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelPredictionDemo;