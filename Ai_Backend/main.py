from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import numpy as np
import json
import os

app = Flask(__name__)
CORS(app)

# Simple neural network model
class DeviceDiagnosisModel(nn.Module):
    def __init__(self, input_size=4, hidden_size=16, output_size=3):
        super(DeviceDiagnosisModel, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, 8)
        self.fc3 = nn.Linear(8, output_size)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
        
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return torch.softmax(x, dim=1)

# Global model variable
model = None
model_path = 'model.pth'

def load_model():
    global model
    model = DeviceDiagnosisModel()
    if os.path.exists(model_path):
        try:
            model.load_state_dict(torch.load(model_path, map_location='cpu'))
            print("Model loaded successfully")
        except RuntimeError as e:
            print(f"Model architecture mismatch: {e}")
            print("Removing old model file and creating new one")
            os.remove(model_path)
            print("Old model removed, will create new one")
    else:
        print("No existing model found, will create new one")
    model.eval()

@app.route('/train', methods=['POST'])
def train_model():
    try:
        global model
        
        # Get training configuration
        config = json.loads(request.form.get('config', '{}'))
        epochs = config.get('epochs', 10)
        batch_size = config.get('batch_size', 10)
        
        # Load training data
        if 'file' not in request.files:
            return jsonify({'error': 'No training file provided'}), 400
            
        file = request.files['file']
        
        # For demo, create synthetic training data
        X = torch.randn(1000, 4)  # battery_level, temperature, usage_hours, cpu_usage
        y = torch.randint(0, 3, (1000,))  # 0: good, 1: warning, 2: critical
        
        # Initialize model if not exists
        if model is None:
            model = DeviceDiagnosisModel()
        
        # Training setup
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        
        model.train()
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = model(X)
            loss = criterion(outputs, y)
            loss.backward()
            optimizer.step()
        
        # Save model
        torch.save(model.state_dict(), model_path)
        model.eval()
        
        return jsonify({
            'message': f'Model trained successfully for {epochs} epochs',
            'loss': float(loss.item())
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        global model
        
        if model is None:
            load_model()
        
        if 'file' not in request.files:
            return jsonify({'error': 'No data file provided'}), 400
        
        file = request.files['file']
        
        # Read the binary data and convert to numpy array
        data_bytes = file.read()
        data_array = np.frombuffer(data_bytes, dtype=np.float32)
        
        if len(data_array) != 4:
            return jsonify({'error': f'Expected 4 features, got {len(data_array)}'}), 400
        
        # Convert to tensor and make prediction
        input_tensor = torch.FloatTensor(data_array).unsqueeze(0)
        
        with torch.no_grad():
            prediction = model(input_tensor)
            predicted_class = torch.argmax(prediction, dim=1).item()
            confidence = torch.max(prediction).item()
        
        # Map prediction to classification
        classifications = ['Good', 'Warning', 'Critical']
        classification = classifications[predicted_class]
        
        return jsonify({
            'predictions': prediction.numpy().tolist()[0],
            'classification': classification,
            'confidence': confidence
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'ElectroDoctor AI Backend is running!',
        'status': 'online',
        'model_loaded': model is not None,
        'endpoints': {
            'train': 'POST /train',
            'predict': 'POST /predict', 
            'health': 'GET /health'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'Backend is running', 'model_loaded': model is not None})

if __name__ == '__main__':
    load_model()
    print("Starting AI Backend Server...")
    print("Server will run on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)