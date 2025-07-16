import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';

export interface TrainingData {
  features: number[][];
  labels: number[];
  featureNames: string[];
  labelNames: string[];
}

export interface ModelConfig {
  inputSize: number;
  hiddenLayers: number[];
  outputSize: number;
  learningRate: number;
  batchSize: number;
  epochs: number;
}

export class DeviceDiagnosisModel {
  private model: tf.LayersModel | null = null;
  private config: ModelConfig;
  private isTraining = false;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  // Create and compile the neural network model
  createModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.dense({
      units: this.config.hiddenLayers[0],
      activation: 'relu',
      inputShape: [this.config.inputSize]
    }));

    // Hidden layers
    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      model.add(tf.layers.dense({
        units: this.config.hiddenLayers[i],
        activation: 'relu'
      }));
      model.add(tf.layers.dropout({ rate: 0.2 })); // Prevent overfitting
    }

    // Output layer
    model.add(tf.layers.dense({
      units: this.config.outputSize,
      activation: 'softmax'
    }));

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  // Preprocess feedback data for training
  async preprocessFeedbackData(): Promise<TrainingData> {
    const { data: feedbackData, error } = await supabase
      .from('ai_feedback')
      .select('*');

    if (error) {
      throw new Error(`Failed to load feedback data: ${error.message}`);
    }

    if (!feedbackData || feedbackData.length === 0) {
      throw new Error('No feedback data available for training');
    }

    // Extract features and labels
    const features: number[][] = [];
    const labels: number[] = [];
    const featureNames = ['helpful_score', 'feature_type', 'response_quality', 'user_satisfaction'];
    const labelNames = ['negative', 'positive'];

    feedbackData.forEach((feedback: any) => {
      // Create feature vector
      const featureVector = [
        feedback.helpful ? 1 : 0,
        this.encodeFeatureType(feedback.feature_used),
        this.encodeResponseQuality(feedback.ai_response_data),
        this.encodeUserSatisfaction(feedback.user_comments)
      ];

      features.push(featureVector);
      labels.push(feedback.helpful ? 1 : 0);
    });

    return {
      features,
      labels,
      featureNames,
      labelNames
    };
  }

  // Encode feature type as numerical value
  private encodeFeatureType(featureType: string): number {
    const typeMapping: { [key: string]: number } = {
      'photo_diagnosis': 0.1,
      'battery_health': 0.2,
      'storage_analysis': 0.3,
      'troubleshooting': 0.4,
      'health_score': 0.5,
      'chat_assistance': 0.6
    };
    return typeMapping[featureType] || 0;
  }

  // Encode response quality based on response data
  private encodeResponseQuality(responseData: any): number {
    if (!responseData) return 0;
    
    // Simple heuristic based on response length and structure
    const dataString = JSON.stringify(responseData);
    const length = dataString.length;
    
    if (length > 1000) return 0.8;
    if (length > 500) return 0.6;
    if (length > 100) return 0.4;
    return 0.2;
  }

  // Encode user satisfaction based on comments
  private encodeUserSatisfaction(comments: string | null): number {
    if (!comments) return 0.5;
    
    const positiveWords = ['good', 'great', 'excellent', 'helpful', 'accurate', 'perfect'];
    const negativeWords = ['bad', 'wrong', 'inaccurate', 'unhelpful', 'poor', 'terrible'];
    
    const lowerComments = comments.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerComments.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerComments.includes(word)).length;
    
    if (positiveCount > negativeCount) return 0.8;
    if (negativeCount > positiveCount) return 0.2;
    return 0.5;
  }

  // Train the model
  async trainModel(
    onProgress: (epoch: number, logs: any) => void,
    onComplete: (model: tf.LayersModel, history: any) => void
  ): Promise<void> {
    if (this.isTraining) {
      throw new Error('Model is already training');
    }

    this.isTraining = true;

    try {
      // Preprocess data
      const trainingData = await this.preprocessFeedbackData();
      
      if (trainingData.features.length < 10) {
        throw new Error('Insufficient training data. Need at least 10 samples.');
      }

      // Create model
      this.model = this.createModel();

      // Convert data to tensors
      const xs = tf.tensor2d(trainingData.features);
      const ys = tf.oneHot(trainingData.labels, 2);

      // Train the model
      const history = await this.model.fit(xs, ys, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            onProgress(epoch, logs);
          }
        }
      });

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      onComplete(this.model, history);
    } catch (error) {
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  // Evaluate model performance
  async evaluateModel(): Promise<{
    accuracy: number;
    loss: number;
    predictions: number[];
    actual: number[];
  }> {
    if (!this.model) {
      throw new Error('Model not trained yet');
    }

    const testData = await this.preprocessFeedbackData();
    const xs = tf.tensor2d(testData.features);
    const ys = tf.oneHot(testData.labels, 2);

    const evaluation = this.model.evaluate(xs, ys) as tf.Tensor[];
    const loss = await evaluation[0].data();
    const accuracy = await evaluation[1].data();

    const predictions = this.model.predict(xs) as tf.Tensor;
    const predictionData = await predictions.data();
    const predictedLabels = [];

    for (let i = 0; i < predictionData.length; i += 2) {
      predictedLabels.push(predictionData[i] > predictionData[i + 1] ? 0 : 1);
    }

    // Clean up tensors
    xs.dispose();
    ys.dispose();
    predictions.dispose();
    evaluation.forEach(tensor => tensor.dispose());

    return {
      accuracy: accuracy[0],
      loss: loss[0],
      predictions: predictedLabels,
      actual: testData.labels
    };
  }

  // Save model to browser storage
  async saveModel(name: string): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }

    await this.model.save(`localstorage://${name}`);
  }

  // Load model from browser storage
  async loadModel(name: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`localstorage://${name}`);
    } catch (error) {
      throw new Error(`Failed to load model: ${error}`);
    }
  }

  // Make prediction
  async predict(features: number[]): Promise<{ prediction: number; confidence: number }> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const inputTensor = tf.tensor2d([features]);
    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    const predictionData = await prediction.data();

    inputTensor.dispose();
    prediction.dispose();

    const confidence = Math.max(predictionData[0], predictionData[1]);
    const predictedClass = predictionData[0] > predictionData[1] ? 0 : 1;

    return {
      prediction: predictedClass,
      confidence: confidence
    };
  }

  getModel(): tf.LayersModel | null {
    return this.model;
  }

  isModelTraining(): boolean {
    return this.isTraining;
  }
}