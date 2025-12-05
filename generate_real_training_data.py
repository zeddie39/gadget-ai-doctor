import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

def generate_device_diagnosis_data(num_samples=1000):
    """Generate realistic device diagnosis training data"""
    
    # Device types and their common issues
    device_types = {
        'smartphone': ['battery_drain', 'overheating', 'screen_crack', 'charging_issue', 'software_lag'],
        'laptop': ['overheating', 'battery_issue', 'hard_drive_failure', 'ram_problem', 'keyboard_malfunction'],
        'tablet': ['battery_drain', 'screen_issue', 'charging_problem', 'wifi_connectivity', 'storage_full'],
        'smartwatch': ['battery_drain', 'sensor_malfunction', 'connectivity_issue', 'screen_damage', 'water_damage'],
        'headphones': ['audio_distortion', 'connectivity_issue', 'battery_drain', 'physical_damage', 'charging_issue']
    }
    
    # Symptom patterns for each issue type
    symptom_patterns = {
        'battery_drain': {
            'battery_level': (0, 30),
            'usage_hours': (8, 24),
            'temperature': (35, 45),
            'background_apps': (15, 50),
            'screen_brightness': (70, 100)
        },
        'overheating': {
            'temperature': (45, 80),
            'cpu_usage': (80, 100),
            'battery_level': (20, 80),
            'usage_hours': (4, 12),
            'ambient_temp': (25, 40)
        },
        'screen_crack': {
            'touch_sensitivity': (0, 40),
            'display_quality': (0, 30),
            'impact_detected': (1, 1),
            'usage_hours': (0, 24),
            'device_age_months': (1, 60)
        },
        'charging_issue': {
            'charging_speed': (0, 30),
            'battery_health': (0, 60),
            'connector_wear': (60, 100),
            'voltage_stability': (0, 40),
            'charging_cycles': (500, 2000)
        },
        'software_lag': {
            'ram_usage': (80, 100),
            'storage_usage': (85, 100),
            'cpu_usage': (70, 100),
            'background_processes': (20, 80),
            'device_age_months': (12, 60)
        }
    }
    
    data = []
    
    for i in range(num_samples):
        # Random device and issue
        device = random.choice(list(device_types.keys()))
        issue = random.choice(device_types[device])
        
        # Generate features based on issue pattern
        if issue in symptom_patterns:
            pattern = symptom_patterns[issue]
            features = {}
            
            for feature, (min_val, max_val) in pattern.items():
                if feature == 'impact_detected':
                    features[feature] = random.choice([0, 1])
                else:
                    features[feature] = round(random.uniform(min_val, max_val), 2)
        else:
            # Default random features
            features = {
                'battery_level': round(random.uniform(0, 100), 2),
                'temperature': round(random.uniform(20, 60), 2),
                'usage_hours': round(random.uniform(0, 24), 2),
                'cpu_usage': round(random.uniform(0, 100), 2),
                'ram_usage': round(random.uniform(0, 100), 2)
            }
        
        # Add device-specific features
        features['device_type'] = hash(device) % 10  # Encode device type
        features['device_age_months'] = random.randint(1, 60)
        features['user_rating'] = random.randint(1, 5)
        
        # Label: 1 if issue detected, 0 if healthy
        # Add some healthy devices (no issues)
        if random.random() < 0.3:  # 30% healthy devices
            label = 0
            issue = 'healthy'
            # Adjust features for healthy devices
            features['battery_level'] = random.uniform(50, 100)
            features['temperature'] = random.uniform(20, 35)
            features['cpu_usage'] = random.uniform(0, 50)
        else:
            label = 1
        
        # Create feature vector
        feature_vector = [
            features.get('battery_level', 50),
            features.get('temperature', 30),
            features.get('usage_hours', 8),
            features.get('cpu_usage', 30),
            features.get('ram_usage', 40),
            features.get('device_type', 0),
            features.get('device_age_months', 12),
            features.get('user_rating', 3),
            features.get('charging_speed', 50),
            features.get('screen_brightness', 50)
        ]
        
        data.append({
            'features': feature_vector,
            'label': label,
            'issue_type': issue,
            'device': device,
            'timestamp': datetime.now() - timedelta(days=random.randint(0, 365))
        })
    
    return data

def save_training_data(data, filename='real_device_training_data.npz'):
    """Save data in format expected by PyTorch model"""
    
    # Extract features and labels
    X = np.array([item['features'] for item in data], dtype=np.float32)
    y = np.array([item['label'] for item in data], dtype=np.float32)
    
    # Save as .npz file
    np.savez(filename, x=X, y=y)
    
    # Also save as CSV for analysis
    df_data = []
    feature_names = [
        'battery_level', 'temperature', 'usage_hours', 'cpu_usage', 'ram_usage',
        'device_type', 'device_age_months', 'user_rating', 'charging_speed', 'screen_brightness'
    ]
    
    for item in data:
        row = dict(zip(feature_names, item['features']))
        row['label'] = item['label']
        row['issue_type'] = item['issue_type']
        row['device'] = item['device']
        row['timestamp'] = item['timestamp']
        df_data.append(row)
    
    df = pd.DataFrame(df_data)
    df.to_csv(filename.replace('.npz', '.csv'), index=False)
    
    print(f"Generated {len(data)} samples")
    print(f"Saved to: {filename}")
    print(f"CSV saved to: {filename.replace('.npz', '.csv')}")
    print(f"Issues distribution:")
    print(df['issue_type'].value_counts())
    
    return filename

if __name__ == "__main__":
    # Generate training data
    print("Generating realistic device diagnosis training data...")
    
    data = generate_device_diagnosis_data(num_samples=2000)
    filename = save_training_data(data)
    
    print(f"\nReady to train! Upload '{filename}' to your AI training interface.")