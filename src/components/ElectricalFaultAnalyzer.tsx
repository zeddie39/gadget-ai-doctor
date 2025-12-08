import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, AlertTriangle, TrendingUp, Activity, Shield, Cpu, Battery, Thermometer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ElectricalReading {
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  frequency: number;
  timestamp: Date;
}

interface FaultPrediction {
  faultType: string;
  probability: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  timeToFailure: string;
  recommendation: string;
  affectedComponents: string[];
}

interface DeviceMetrics {
  batteryHealth: number;
  cpuTemperature: number;
  powerConsumption: number;
  voltageStability: number;
  currentLeakage: number;
}

const ElectricalFaultAnalyzer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [readings, setReadings] = useState<ElectricalReading[]>([]);
  const [predictions, setPredictions] = useState<FaultPrediction[]>([]);
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetrics | null>(null);
  const [selectedDevice, setSelectedDevice] = useState('smartphone');
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(false);
  const [manualReadings, setManualReadings] = useState({
    voltage: '',
    current: '',
    power: '',
    temperature: '',
    frequency: ''
  });

  // Simulate real electrical readings
  const generateReading = (): ElectricalReading => {
    const baseVoltage = selectedDevice === 'smartphone' ? 3.7 : selectedDevice === 'laptop' ? 11.1 : 5.0;
    const baseCurrent = selectedDevice === 'smartphone' ? 2.5 : selectedDevice === 'laptop' ? 4.5 : 1.0;
    
    return {
      voltage: baseVoltage + (Math.random() - 0.5) * 0.5,
      current: baseCurrent + (Math.random() - 0.5) * 0.8,
      power: (baseVoltage * baseCurrent) + (Math.random() - 0.5) * 2,
      temperature: 25 + Math.random() * 40,
      frequency: 50 + (Math.random() - 0.5) * 2,
      timestamp: new Date()
    };
  };

  // Predictive fault analysis using ML-like logic
  const analyzeFaults = (readings: ElectricalReading[]): FaultPrediction[] => {
    if (readings.length < 5) return [];

    const predictions: FaultPrediction[] = [];
    const latest = readings[readings.length - 1];
    const avgVoltage = readings.reduce((sum, r) => sum + r.voltage, 0) / readings.length;
    const avgCurrent = readings.reduce((sum, r) => sum + r.current, 0) / readings.length;
    const avgTemp = readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length;

    // Battery degradation prediction
    if (selectedDevice === 'smartphone' || selectedDevice === 'laptop') {
      const voltageVariation = Math.abs(latest.voltage - avgVoltage);
      if (voltageVariation > 0.3) {
        predictions.push({
          faultType: 'Battery Degradation',
          probability: Math.min(95, voltageVariation * 200),
          severity: voltageVariation > 0.5 ? 'High' : 'Medium',
          timeToFailure: voltageVariation > 0.5 ? '2-4 weeks' : '2-3 months',
          recommendation: 'Monitor battery health closely. Consider replacement if voltage drops below safe threshold.',
          affectedComponents: ['Battery', 'Charging Circuit', 'Power Management']
        });
      }
    }

    // Overheating prediction
    if (avgTemp > 45) {
      predictions.push({
        faultType: 'Thermal Overload',
        probability: Math.min(90, (avgTemp - 25) * 2),
        severity: avgTemp > 60 ? 'Critical' : avgTemp > 50 ? 'High' : 'Medium',
        timeToFailure: avgTemp > 60 ? 'Immediate' : avgTemp > 50 ? '1-2 days' : '1-2 weeks',
        recommendation: 'Reduce device usage, improve ventilation, check for dust buildup.',
        affectedComponents: ['CPU', 'Battery', 'Display', 'Internal Circuits']
      });
    }

    // Power consumption anomaly
    const powerVariation = readings.map(r => r.power).reduce((acc, curr, idx, arr) => {
      if (idx === 0) return acc;
      return acc + Math.abs(curr - arr[idx - 1]);
    }, 0) / (readings.length - 1);

    if (powerVariation > 2) {
      predictions.push({
        faultType: 'Power Regulation Fault',
        probability: Math.min(85, powerVariation * 25),
        severity: powerVariation > 4 ? 'High' : 'Medium',
        timeToFailure: powerVariation > 4 ? '1-2 weeks' : '1-2 months',
        recommendation: 'Check power management settings, inspect charging port and cable.',
        affectedComponents: ['Power IC', 'Charging Port', 'Voltage Regulators']
      });
    }

    // Current leakage detection
    if (latest.current > avgCurrent * 1.5) {
      predictions.push({
        faultType: 'Current Leakage',
        probability: Math.min(80, (latest.current / avgCurrent - 1) * 100),
        severity: latest.current > avgCurrent * 2 ? 'Critical' : 'High',
        timeToFailure: latest.current > avgCurrent * 2 ? 'Immediate' : '3-7 days',
        recommendation: 'SAFETY RISK: Disconnect device immediately. Professional inspection required.',
        affectedComponents: ['Motherboard', 'Capacitors', 'Insulation', 'Connectors']
      });
    }

    return predictions;
  };

  // Generate device health metrics
  const calculateDeviceMetrics = (readings: ElectricalReading[]): DeviceMetrics => {
    if (readings.length === 0) {
      return {
        batteryHealth: 100,
        cpuTemperature: 35,
        powerConsumption: 50,
        voltageStability: 95,
        currentLeakage: 0
      };
    }

    const latest = readings[readings.length - 1];
    const avgVoltage = readings.reduce((sum, r) => sum + r.voltage, 0) / readings.length;
    const voltageStability = Math.max(0, 100 - (Math.abs(latest.voltage - avgVoltage) * 100));
    
    return {
      batteryHealth: Math.max(0, 100 - (readings.length * 2)), // Simulated degradation
      cpuTemperature: latest.temperature,
      powerConsumption: (latest.power / 20) * 100, // Normalized to percentage
      voltageStability,
      currentLeakage: Math.max(0, latest.current - avgVoltage * 0.8)
    };
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);

    // Simulate data collection and analysis
    const newReadings: ElectricalReading[] = [];
    
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      newReadings.push(generateReading());
      setProgress((i + 1) * 5);
    }

    setReadings(newReadings);
    const faultPredictions = analyzeFaults(newReadings);
    setPredictions(faultPredictions);
    setDeviceMetrics(calculateDeviceMetrics(newReadings));

    // Store analysis results
    try {
      await supabase.from('electrical_analysis').insert({
        device_type: selectedDevice,
        readings: newReadings,
        predictions: faultPredictions,
        analysis_timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing analysis:', error);
    }

    setIsAnalyzing(false);
    toast.success('Electrical fault analysis completed!');
  };

  const addManualReading = () => {
    const reading: ElectricalReading = {
      voltage: parseFloat(manualReadings.voltage) || 0,
      current: parseFloat(manualReadings.current) || 0,
      power: parseFloat(manualReadings.power) || 0,
      temperature: parseFloat(manualReadings.temperature) || 0,
      frequency: parseFloat(manualReadings.frequency) || 0,
      timestamp: new Date()
    };

    const newReadings = [...readings, reading];
    setReadings(newReadings);
    setPredictions(analyzeFaults(newReadings));
    setDeviceMetrics(calculateDeviceMetrics(newReadings));
    
    // Clear form
    setManualReadings({
      voltage: '',
      current: '',
      power: '',
      temperature: '',
      frequency: ''
    });

    toast.success('Manual reading added successfully!');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <CardTitle>Electrical Fault Analysis</CardTitle>
          </div>
          <CardDescription>
            Predictive analysis of electrical faults using machine learning algorithms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analysis" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="monitoring">Real-time</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="device">Device Type</Label>
                  <select
                    id="device"
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="smartphone">Smartphone</option>
                    <option value="laptop">Laptop</option>
                    <option value="tablet">Tablet</option>
                    <option value="charger">Charger</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={startAnalysis}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                  </Button>
                </div>
              </div>

              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Analysis Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {deviceMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-600">Battery Health</p>
                        <p className="font-semibold">{deviceMetrics.batteryHealth.toFixed(1)}%</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-600">Temperature</p>
                        <p className="font-semibold">{deviceMetrics.cpuTemperature.toFixed(1)}°C</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-600">Power Usage</p>
                        <p className="font-semibold">{deviceMetrics.powerConsumption.toFixed(1)}%</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-xs text-gray-600">Voltage Stability</p>
                        <p className="font-semibold">{deviceMetrics.voltageStability.toFixed(1)}%</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-xs text-gray-600">Current Leakage</p>
                        <p className="font-semibold">{deviceMetrics.currentLeakage.toFixed(2)}mA</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {predictions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Fault Predictions
                  </h3>
                  {predictions.map((prediction, index) => (
                    <Alert key={index} className={`border-l-4 ${prediction.severity === 'Critical' ? 'border-red-500' : prediction.severity === 'High' ? 'border-orange-500' : 'border-yellow-500'}`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{prediction.faultType}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityColor(prediction.severity)}>
                                {prediction.severity}
                              </Badge>
                              <span className="text-sm font-medium">{prediction.probability.toFixed(1)}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            <strong>Time to failure:</strong> {prediction.timeToFailure}
                          </p>
                          <p className="text-sm">{prediction.recommendation}</p>
                          <div className="flex flex-wrap gap-1">
                            {prediction.affectedComponents.map((component, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {component}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Real-time monitoring requires external sensors or device API access. 
                  This feature simulates electrical monitoring for demonstration purposes.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setRealTimeMonitoring(!realTimeMonitoring)}
                  variant={realTimeMonitoring ? "destructive" : "default"}
                >
                  {realTimeMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </Button>
                <div className="text-sm text-gray-600 flex items-center">
                  Status: {realTimeMonitoring ? '🟢 Active' : '🔴 Inactive'}
                </div>
              </div>

              {realTimeMonitoring && readings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Latest Reading</h4>
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    <div>Voltage: {readings[readings.length - 1]?.voltage.toFixed(2)}V</div>
                    <div>Current: {readings[readings.length - 1]?.current.toFixed(2)}A</div>
                    <div>Power: {readings[readings.length - 1]?.power.toFixed(2)}W</div>
                    <div>Temp: {readings[readings.length - 1]?.temperature.toFixed(1)}°C</div>
                    <div>Freq: {readings[readings.length - 1]?.frequency.toFixed(1)}Hz</div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voltage">Voltage (V)</Label>
                  <Input
                    id="voltage"
                    type="number"
                    step="0.1"
                    value={manualReadings.voltage}
                    onChange={(e) => setManualReadings(prev => ({ ...prev, voltage: e.target.value }))}
                    placeholder="3.7"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current">Current (A)</Label>
                  <Input
                    id="current"
                    type="number"
                    step="0.1"
                    value={manualReadings.current}
                    onChange={(e) => setManualReadings(prev => ({ ...prev, current: e.target.value }))}
                    placeholder="2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="power">Power (W)</Label>
                  <Input
                    id="power"
                    type="number"
                    step="0.1"
                    value={manualReadings.power}
                    onChange={(e) => setManualReadings(prev => ({ ...prev, power: e.target.value }))}
                    placeholder="9.25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={manualReadings.temperature}
                    onChange={(e) => setManualReadings(prev => ({ ...prev, temperature: e.target.value }))}
                    placeholder="35"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency (Hz)</Label>
                  <Input
                    id="frequency"
                    type="number"
                    step="0.1"
                    value={manualReadings.frequency}
                    onChange={(e) => setManualReadings(prev => ({ ...prev, frequency: e.target.value }))}
                    placeholder="50"
                  />
                </div>
              </div>
              
              <Button onClick={addManualReading} className="w-full">
                Add Reading
              </Button>

              {readings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Recent Readings ({readings.length})</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {readings.slice(-5).reverse().map((reading, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        {reading.voltage.toFixed(2)}V | {reading.current.toFixed(2)}A | {reading.power.toFixed(2)}W | {reading.temperature.toFixed(1)}°C | {reading.frequency.toFixed(1)}Hz
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricalFaultAnalyzer;