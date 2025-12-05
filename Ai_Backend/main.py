from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import numpy as np
import io
import os
import json
import psutil

app = Flask(__name__)
CORS(app)

class SimpleNN(nn.Module):
    def __init__(self, input_size=10):
        super(SimpleNN, self).__init__()
        self.fc1 = nn.Linear(input_size, 64)
        self.fc2 = nn.Linear(64, 1)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.sigmoid(self.fc2(x))
        return x

model = None
model_path = "model.pth"

def load_model():
    global model
    if os.path.exists(model_path) and model is None:
        try:
            # Try to load the saved model to get the correct input size
            checkpoint = torch.load(model_path)
            # Get input size from the first layer weight shape
            input_size = checkpoint['fc1.weight'].shape[1]
            model = SimpleNN(input_size)
            model.load_state_dict(checkpoint)
            model.eval()
            print(f"Model loaded with input size: {input_size}")
        except Exception as e:
            print(f"Failed to load model: {e}")
            model = None

@app.route("/train", methods=["POST"])
def train_model():
    global model
    try:
        config_str = request.form.get('config')
        config = json.loads(config_str)
        epochs = config['epochs']
        batch_size = config['batch_size']
        file = request.files['file']
        data = np.load(io.BytesIO(file.read()))
        x_train = torch.tensor(data['x'], dtype=torch.float32)
        y_train = torch.tensor(data['y'], dtype=torch.float32).unsqueeze(1)

        input_size = x_train.shape[1]
        model = SimpleNN(input_size)
        criterion = nn.BCELoss()
        optimizer = torch.optim.Adam(model.parameters())

        for epoch in range(epochs):
            for i in range(0, len(x_train), batch_size):
                batch_x = x_train[i:i+batch_size]
                batch_y = y_train[i:i+batch_size]
                optimizer.zero_grad()
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()

        torch.save(model.state_dict(), model_path)
        return jsonify({"message": "Model trained and saved!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not trained yet"}), 400
    try:
        file = request.files['file']
        # Read raw bytes and convert to numpy array
        raw_data = file.read()
        # Convert bytes to float32 array
        data_array = np.frombuffer(raw_data, dtype=np.float32)
        # Reshape to match expected input (1 sample, N features)
        x = torch.tensor(data_array.reshape(1, -1), dtype=torch.float32)
        
        with torch.no_grad():
            predictions = model(x).squeeze().numpy()
        
        # Convert to probability and classification
        probability = float(predictions)
        classification = "Issue Detected" if probability > 0.5 else "Device Healthy"
        
        return jsonify({
            "predictions": [probability],
            "classification": classification,
            "confidence": abs(probability - 0.5) * 2  # Confidence score 0-1
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/models", methods=["GET"])
def list_models():
    if os.path.exists(model_path):
        return jsonify({"models": ["model.pth"]})
    return jsonify({"models": []})

@app.route("/models/<model_name>", methods=["DELETE"])
def delete_model(model_name):
    if model_name == "model.pth" and os.path.exists(model_path):
        os.remove(model_path)
        global model
        model = None
        return jsonify({"message": "Model deleted"})
    return jsonify({"error": "Model not found"}), 404

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})

@app.route("/metrics", methods=["GET"])
def get_metrics():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    return jsonify({
        "cpu_usage": cpu_percent,
        "memory_usage": memory.percent,
        "memory_used": memory.used,
        "memory_total": memory.total
    })

@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "AI Backend Server is running", "status": "active"})

if __name__ == "__main__":
    load_model()  # Load existing model if available
    app.run(debug=True, host='0.0.0.0', port=5000)
