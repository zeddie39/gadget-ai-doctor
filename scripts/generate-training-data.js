#!/usr/bin/env node

/**
 * Training Data Generator for ElectroDoctor AI
 * 
 * This script generates synthetic training data locally without storing
 * large files in the git repository. Run this when you need training data.
 * 
 * Usage: node scripts/generate-training-data.js
 */

const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('🤖 Generating synthetic training data...');

// Generate battery health dataset
function generateBatteryData(samples = 1000) {
  const data = [];
  const headers = ['battery_level', 'temperature', 'usage_hours', 'cpu_usage', 'health_status'];
  
  for (let i = 0; i < samples; i++) {
    const battery = Math.random() * 100;
    const temp = 20 + Math.random() * 60;
    const usage = Math.random() * 200;
    const cpu = Math.random() * 100;
    
    let health_status;
    if (battery > 70 && temp < 45 && cpu < 70) {
      health_status = 'Good';
    } else if (battery > 30 && temp < 60 && cpu < 85) {
      health_status = 'Warning';
    } else {
      health_status = 'Critical';
    }
    
    data.push([battery.toFixed(2), temp.toFixed(2), usage.toFixed(2), cpu.toFixed(2), health_status]);
  }
  
  return [headers, ...data];
}

// Convert array to CSV
function arrayToCSV(data) {
  return data.map(row => row.join(',')).join('\n');
}

// Generate and save datasets
try {
  console.log('📊 Generating battery health dataset...');
  const batteryData = generateBatteryData(1000);
  fs.writeFileSync(path.join(dataDir, 'battery_health_synthetic.csv'), arrayToCSV(batteryData));
  
  console.log('✅ Training data generated successfully!');
  console.log(`📁 Files saved to: ${dataDir}`);
  console.log('📝 Files: battery_health_synthetic.csv (1000 samples)');
  console.log('💡 Note: These files are ignored by git and generated locally only.');
  
} catch (error) {
  console.error('❌ Error generating training data:', error.message);
  process.exit(1);
}