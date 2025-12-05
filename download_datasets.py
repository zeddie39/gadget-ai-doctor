import requests
import pandas as pd
import numpy as np
from urllib.parse import urlparse
import os

def download_uci_datasets():
    """Download UCI ML datasets for device diagnosis"""
    
    datasets = {
        'smartphone_activity': 'https://archive.ics.uci.edu/ml/machine-learning-databases/00240/UCI%20HAR%20Dataset.zip',
        'gas_sensor': 'https://archive.ics.uci.edu/ml/machine-learning-databases/00224/Dataset.zip',
        'condition_monitoring': 'https://archive.ics.uci.edu/ml/machine-learning-databases/00347/condition_monitoring_of_hydraulic_systems.zip'
    }
    
    for name, url in datasets.items():
        try:
            print(f"Downloading {name}...")
            response = requests.get(url, stream=True)
            filename = f"{name}.zip"
            
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Downloaded: {filename}")
        except Exception as e:
            print(f"Failed to download {name}: {e}")

def create_synthetic_datasets():
    """Create additional synthetic datasets with different patterns"""
    
    # Battery degradation dataset
    battery_data = []
    for i in range(1000):
        cycles = np.random.randint(0, 2000)
        capacity = 100 - (cycles * 0.02) + np.random.normal(0, 5)
        voltage = 3.7 - (cycles * 0.0001) + np.random.normal(0, 0.1)
        temperature = 25 + np.random.normal(0, 10)
        
        # Label: 1 if battery needs replacement
        label = 1 if capacity < 80 or voltage < 3.2 else 0
        
        battery_data.append([cycles, capacity, voltage, temperature, label])
    
    battery_df = pd.DataFrame(battery_data, columns=['cycles', 'capacity', 'voltage', 'temperature', 'needs_replacement'])
    
    # Screen damage dataset
    screen_data = []
    for i in range(800):
        impact_force = np.random.uniform(0, 100)
        drop_height = np.random.uniform(0, 200)
        screen_age = np.random.randint(0, 1000)
        material_quality = np.random.uniform(0, 10)
        
        # Probability of damage based on physics
        damage_prob = (impact_force * drop_height) / (material_quality * 1000)
        label = 1 if damage_prob > 0.5 or impact_force > 80 else 0
        
        screen_data.append([impact_force, drop_height, screen_age, material_quality, label])
    
    screen_df = pd.DataFrame(screen_data, columns=['impact_force', 'drop_height', 'age_days', 'material_quality', 'is_damaged'])
    
    # Save datasets
    battery_df.to_csv('battery_degradation_dataset.csv', index=False)
    screen_df.to_csv('screen_damage_dataset.csv', index=False)
    
    # Convert to .npz format for training
    battery_X = battery_df.drop('needs_replacement', axis=1).values.astype(np.float32)
    battery_y = battery_df['needs_replacement'].values.astype(np.float32)
    np.savez('battery_training_data.npz', x=battery_X, y=battery_y)
    
    screen_X = screen_df.drop('is_damaged', axis=1).values.astype(np.float32)
    screen_y = screen_df['is_damaged'].values.astype(np.float32)
    np.savez('screen_training_data.npz', x=screen_X, y=screen_y)
    
    print("Created battery_training_data.npz")
    print("Created screen_training_data.npz")

def download_sample_iot_data():
    """Download sample IoT sensor data"""
    
    # Create IoT sensor failure dataset
    iot_data = []
    
    for i in range(1500):
        # Sensor readings
        temperature = np.random.normal(25, 15)
        humidity = np.random.uniform(20, 80)
        vibration = np.random.exponential(2)
        power_consumption = np.random.uniform(0.5, 5.0)
        signal_strength = np.random.uniform(-100, -30)
        uptime_hours = np.random.uniform(0, 8760)  # Hours in a year
        
        # Failure conditions
        temp_failure = temperature > 60 or temperature < -10
        vibration_failure = vibration > 8
        power_failure = power_consumption > 4.5
        signal_failure = signal_strength < -85
        
        label = 1 if any([temp_failure, vibration_failure, power_failure, signal_failure]) else 0
        
        iot_data.append([temperature, humidity, vibration, power_consumption, signal_strength, uptime_hours, label])
    
    iot_df = pd.DataFrame(iot_data, columns=[
        'temperature', 'humidity', 'vibration', 'power_consumption', 
        'signal_strength', 'uptime_hours', 'sensor_failure'
    ])
    
    # Save as CSV and NPZ
    iot_df.to_csv('iot_sensor_dataset.csv', index=False)
    
    iot_X = iot_df.drop('sensor_failure', axis=1).values.astype(np.float32)
    iot_y = iot_df['sensor_failure'].values.astype(np.float32)
    np.savez('iot_sensor_training_data.npz', x=iot_X, y=iot_y)
    
    print("Created iot_sensor_training_data.npz")

if __name__ == "__main__":
    print("Downloading and creating training datasets...")
    
    # Create synthetic datasets (always works)
    create_synthetic_datasets()
    download_sample_iot_data()
    
    # Try to download real datasets (may fail due to network)
    try:
        download_uci_datasets()
    except Exception as e:
        print(f"UCI downloads failed: {e}")
    
    print("\nAvailable training files:")
    npz_files = [f for f in os.listdir('.') if f.endswith('.npz')]
    for file in npz_files:
        print(f"  - {file}")
    
    print("\nReady to train multiple models with different datasets!")