
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Smartphone, Laptop, Tablet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TroubleshootingStep {
  id: number;
  title: string;
  description: string;
  instructions: string[];
  nextSteps: { [key: string]: number };
  isComplete?: boolean;
}

const TroubleshootingWizard = () => {
  const [deviceType, setDeviceType] = useState<string>('');
  const [issueCategory, setIssueCategory] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [sessionId] = useState(() => `troubleshoot_${Date.now()}`);

  const deviceTypes = [
    { value: 'smartphone', label: 'Smartphone', icon: Smartphone },
    { value: 'laptop', label: 'Laptop', icon: Laptop },
    { value: 'tablet', label: 'Tablet', icon: Tablet }
  ];

  const issueCategories = [
    'Device won\'t turn on',
    'Overheating issues',
    'Battery problems',
    'Slow performance',
    'Screen problems',
    'Audio issues',
    'Connectivity problems',
    'Storage issues'
  ];

  const troubleshootingSteps: { [key: string]: { [key: string]: TroubleshootingStep[] } } = {
    smartphone: {
      "Device won't turn on": [
        {
          id: 1,
          title: "Check Battery Connection",
          description: "First, let's ensure your phone has power",
          instructions: [
            "Connect your phone to the original charger",
            "Wait for at least 15 minutes before attempting to turn on",
            "Look for charging indicator (LED light or on-screen battery icon)"
          ],
          nextSteps: { "Charging indicator visible": 2, "No charging indicator": 3 }
        },
        {
          id: 2,
          title: "Force Restart",
          description: "Perform a force restart to wake up the device",
          instructions: [
            "Hold Power button + Volume Down for 10-15 seconds",
            "For iPhones: Quickly press Volume Up, then Volume Down, then hold Power button",
            "Wait for device logo to appear"
          ],
          nextSteps: { "Device turned on": 4, "Still not working": 5 }
        },
        {
          id: 3,
          title: "Check Charger and Port",
          description: "Verify charging components are working",
          instructions: [
            "Try a different charging cable and adapter",
            "Clean charging port with compressed air or soft brush",
            "Check for physical damage to charging port",
            "Try wireless charging if available"
          ],
          nextSteps: { "Now charging": 2, "Still no charge": 6 }
        },
        {
          id: 4,
          title: "Success! Device is Working",
          description: "Your device is now operational",
          instructions: [
            "Check battery health in settings",
            "Update your device software",
            "Consider backing up important data",
            "Monitor for recurring issues"
          ],
          nextSteps: {},
          isComplete: true
        },
        {
          id: 5,
          title: "Safe Mode Check",
          description: "Try booting in safe mode",
          instructions: [
            "Hold Power button until power menu appears",
            "Long press 'Power Off' option",
            "Select 'Safe Mode' when prompted",
            "If successful, restart normally and uninstall recent apps"
          ],
          nextSteps: { "Safe mode works": 4, "Safe mode fails": 6 }
        },
        {
          id: 6,
          title: "Professional Repair Needed",
          description: "Hardware issue detected",
          instructions: [
            "Your device likely has a hardware problem",
            "Contact manufacturer support or authorized repair center",
            "Backup data if device occasionally turns on",
            "Consider warranty coverage if applicable"
          ],
          nextSteps: {},
          isComplete: true
        }
      ],
      "Overheating issues": [
        {
          id: 1,
          title: "Immediate Safety Check",
          description: "First priority is device and user safety",
          instructions: [
            "Stop using the device immediately if it's very hot",
            "Remove from charging cable",
            "Remove case/cover to allow heat dissipation",
            "Place in cool, dry area (NOT refrigerator/freezer)"
          ],
          nextSteps: { "Device cooling down": 2, "Still very hot": 3 }
        },
        {
          id: 2,
          title: "Identify Heat Source",
          description: "Determine what's causing the overheating",
          instructions: [
            "Check running apps in background",
            "Close all unnecessary applications",
            "Reduce screen brightness",
            "Turn off GPS, Bluetooth, and WiFi temporarily"
          ],
          nextSteps: { "Temperature normal": 4, "Still overheating": 3 }
        },
        {
          id: 3,
          title: "Advanced Cooling Protocol",
          description: "More intensive cooling measures",
          instructions: [
            "Turn off device completely",
            "Remove battery if removable",
            "Wait 30 minutes in cool environment",
            "Check charger for damage or overheating"
          ],
          nextSteps: { "Cooled down successfully": 4, "Problem persists": 5 }
        },
        {
          id: 4,
          title: "Prevention and Monitoring",
          description: "Keep your device running cool",
          instructions: [
            "Enable adaptive battery/power saving mode",
            "Avoid using device while charging",
            "Keep device out of direct sunlight",
            "Update apps and operating system",
            "Monitor battery health regularly"
          ],
          nextSteps: {},
          isComplete: true
        },
        {
          id: 5,
          title: "Hardware Issue - Seek Repair",
          description: "Professional intervention required",
          instructions: [
            "Persistent overheating indicates hardware problem",
            "Stop using device to prevent further damage",
            "Contact manufacturer or repair service",
            "Possible battery replacement needed"
          ],
          nextSteps: {},
          isComplete: true
        }
      ]
    },
    laptop: {
      "Device won't turn on": [
        {
          id: 1,
          title: "Power Supply Check",
          description: "Verify power connection and battery",
          instructions: [
            "Connect AC adapter and check charging LED",
            "Try different power outlet",
            "Remove battery (if removable) and try AC power only",
            "Check for loose connections"
          ],
          nextSteps: { "Power LED on": 2, "No power LED": 3 }
        },
        {
          id: 2,
          title: "Hard Reset",
          description: "Perform hardware reset",
          instructions: [
            "Disconnect all peripherals and AC adapter",
            "Remove battery if possible",
            "Hold power button for 30 seconds",
            "Reconnect AC adapter (leave battery out) and try turning on"
          ],
          nextSteps: { "Laptop starts": 4, "Still not starting": 5 }
        }
      ]
    }
  };

  const saveSession = async () => {
    try {
      await supabase.from('troubleshooting_sessions').insert({
        device_type: deviceType,
        issue_category: issueCategory,
        current_step: currentStep,
        session_data: {
          completed_steps: completedSteps,
          device_type: deviceType,
          issue_category: issueCategory
        }
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const startTroubleshooting = () => {
    if (deviceType && issueCategory) {
      setCurrentStep(1);
      saveSession();
    }
  };

  const handleStepComplete = (nextStepChoice: string) => {
    const currentSteps = troubleshootingSteps[deviceType]?.[issueCategory];
    if (!currentSteps) return;

    const current = currentSteps.find(step => step.id === currentStep);
    if (!current) return;

    setCompletedSteps(prev => [...prev, currentStep]);
    
    const nextStepId = current.nextSteps[nextStepChoice];
    if (nextStepId) {
      setCurrentStep(nextStepId);
    }
  };

  const goToPreviousStep = () => {
    if (completedSteps.length > 0) {
      const prevStep = completedSteps[completedSteps.length - 1];
      setCompletedSteps(prev => prev.slice(0, -1));
      setCurrentStep(prevStep);
    } else {
      setCurrentStep(0);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setDeviceType('');
    setIssueCategory('');
  };

  const getCurrentStep = () => {
    const currentSteps = troubleshootingSteps[deviceType]?.[issueCategory];
    return currentSteps?.find(step => step.id === currentStep);
  };

  const currentStepData = getCurrentStep();

  if (currentStep === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Let's Fix Your Device Together
          </h3>
          <p className="text-gray-600">
            Follow our step-by-step guide to diagnose and resolve common issues
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Your Device Type</CardTitle>
            <CardDescription>Choose the device you're having trouble with</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {deviceTypes.map((device) => (
                <Button
                  key={device.value}
                  onClick={() => setDeviceType(device.value)}
                  variant={deviceType === device.value ? "default" : "outline"}
                  className="h-20 flex flex-col gap-2"
                >
                  <device.icon className="h-6 w-6" />
                  {device.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {deviceType && (
          <Card>
            <CardHeader>
              <CardTitle>What Issue Are You Experiencing?</CardTitle>
              <CardDescription>Select the problem that best describes your situation</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={issueCategory} onValueChange={setIssueCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an issue category" />
                </SelectTrigger>
                <SelectContent>
                  {issueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {deviceType && issueCategory && (
          <div className="text-center">
            <Button 
              onClick={startTroubleshooting}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              Start Troubleshooting
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!currentStepData) {
    return (
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          No troubleshooting steps available for this combination.
        </p>
        <Button onClick={resetWizard}>Start Over</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Step {currentStep}: {currentStepData.title}
          </h3>
          <Button onClick={resetWizard} variant="outline" size="sm">
            Start Over
          </Button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-medium mb-2">{currentStepData.description}</p>
          <div className="space-y-2">
            {currentStepData.instructions.map((instruction, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-blue-700">{instruction}</span>
              </div>
            ))}
          </div>
        </div>

        {currentStepData.isComplete ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-green-800 mb-2">
              {currentStepData.title}
            </h4>
            <p className="text-green-700 mb-4">{currentStepData.description}</p>
            <Button onClick={resetWizard} className="bg-green-600 hover:bg-green-700">
              Troubleshoot Another Issue
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">What happened after following these steps?</h4>
            <div className="grid gap-3">
              {Object.keys(currentStepData.nextSteps).map((choice) => (
                <Button
                  key={choice}
                  onClick={() => handleStepComplete(choice)}
                  variant="outline"
                  className="justify-start text-left h-auto p-4"
                >
                  <span>{choice}</span>
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button
            onClick={goToPreviousStep}
            variant="outline"
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Step
          </Button>
          
          <div className="text-sm text-gray-500">
            Progress: {completedSteps.length + 1} steps completed
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingWizard;
