import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Smartphone, Laptop, Tablet, Clock, Wrench, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [sessionStartTime] = useState(() => Date.now());
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  const deviceTypes = [
    { value: 'smartphone', label: 'Smartphone', icon: Smartphone, color: 'bg-blue-500' },
    { value: 'laptop', label: 'Laptop', icon: Laptop, color: 'bg-green-500' },
    { value: 'tablet', label: 'Tablet', icon: Tablet, color: 'bg-purple-500' }
  ];

  useEffect(() => {
    if (deviceType && issueCategory) {
      const steps = troubleshootingSteps[deviceType]?.[issueCategory];
      if (steps) {
        setEstimatedTime(steps.length * 3); // Estimate 3 minutes per step
      }
    }
  }, [deviceType, issueCategory]);

  const issueCategories = {
    smartphone: [
      'Device won\'t turn on',
      'Overheating issues', 
      'Battery drains quickly',
      'Slow performance',
      'Screen problems',
      'Audio issues',
      'WiFi/Bluetooth problems',
      'Storage full',
      'App crashes',
      'Camera not working'
    ],
    laptop: [
      'Device won\'t turn on',
      'Overheating and fan noise',
      'Battery issues',
      'Slow performance',
      'Screen flickering/black',
      'Keyboard/trackpad issues',
      'WiFi connectivity',
      'Blue screen errors',
      'Hard drive problems',
      'Audio not working'
    ],
    tablet: [
      'Device won\'t turn on',
      'Touch screen unresponsive',
      'Battery problems',
      'Slow performance',
      'WiFi issues',
      'App crashes',
      'Storage problems',
      'Charging issues',
      'Screen rotation problems',
      'Audio issues'
    ]
  };

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
      ],
      "Battery drains quickly": [
        {
          id: 1,
          title: "Check Battery Usage",
          description: "Identify apps consuming excessive battery",
          instructions: [
            "Go to Settings > Battery > Battery Usage",
            "Identify apps using high battery percentage",
            "Force close unnecessary background apps",
            "Disable location services for non-essential apps"
          ],
          nextSteps: { "Found battery-draining apps": 2, "No obvious culprits": 3 }
        },
        {
          id: 2,
          title: "Optimize App Settings",
          description: "Reduce power consumption from problematic apps",
          instructions: [
            "Uninstall or disable unused apps",
            "Turn off background app refresh",
            "Reduce screen brightness and timeout",
            "Disable push notifications for non-essential apps"
          ],
          nextSteps: { "Battery life improved": 4, "Still draining fast": 3 }
        },
        {
          id: 3,
          title: "System-Level Optimization",
          description: "Apply comprehensive power saving measures",
          instructions: [
            "Enable Low Power Mode or Battery Saver",
            "Turn off WiFi, Bluetooth when not needed",
            "Disable automatic downloads and updates",
            "Check for iOS/Android system updates",
            "Restart device to clear memory leaks"
          ],
          nextSteps: { "Battery improved": 4, "Problem persists": 5 }
        },
        {
          id: 4,
          title: "Battery Health Optimized",
          description: "Your battery performance should be improved",
          instructions: [
            "Monitor battery usage over next few days",
            "Consider battery calibration (full discharge/charge cycle)",
            "Keep device updated with latest software",
            "Avoid extreme temperatures"
          ],
          nextSteps: {},
          isComplete: true
        },
        {
          id: 5,
          title: "Battery Replacement Needed",
          description: "Hardware issue - battery degradation",
          instructions: [
            "Check battery health in device settings",
            "If battery health < 80%, replacement recommended",
            "Contact authorized service center",
            "Backup data before service"
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
        },
        {
          id: 3,
          title: "Charger and Port Inspection",
          description: "Check charging components",
          instructions: [
            "Inspect AC adapter for damage or overheating",
            "Try different compatible charger if available",
            "Clean charging port with compressed air",
            "Check for bent pins or debris in port"
          ],
          nextSteps: { "Now getting power": 2, "Still no power": 6 }
        },
        {
          id: 4,
          title: "Success - Laptop Working",
          description: "Your laptop is now operational",
          instructions: [
            "Reinstall battery if it was removed",
            "Update BIOS and drivers",
            "Run system diagnostics",
            "Create system backup"
          ],
          nextSteps: {},
          isComplete: true
        },
        {
          id: 5,
          title: "BIOS/UEFI Reset",
          description: "Reset system firmware",
          instructions: [
            "Locate CMOS battery on motherboard",
            "Remove CMOS battery for 5 minutes",
            "Reinstall battery and try powering on",
            "If accessible, try BIOS reset jumper"
          ],
          nextSteps: { "Laptop starts": 4, "Still not working": 6 }
        },
        {
          id: 6,
          title: "Hardware Failure - Professional Repair",
          description: "Motherboard or power system failure",
          instructions: [
            "Likely motherboard, power supply, or CPU failure",
            "Contact manufacturer or certified repair center",
            "Check warranty status",
            "Consider data recovery if needed"
          ],
          nextSteps: {},
          isComplete: true
        }
      ],
      "Slow performance": [
        {
          id: 1,
          title: "Check System Resources",
          description: "Identify resource bottlenecks",
          instructions: [
            "Open Task Manager (Ctrl+Shift+Esc)",
            "Check CPU, Memory, and Disk usage",
            "Identify processes using high resources",
            "End unnecessary background processes"
          ],
          nextSteps: { "Found resource hogs": 2, "Resources look normal": 3 }
        },
        {
          id: 2,
          title: "Optimize Running Programs",
          description: "Reduce system load",
          instructions: [
            "Uninstall unused programs",
            "Disable startup programs (Task Manager > Startup)",
            "Update or remove problematic software",
            "Run antivirus scan for malware"
          ],
          nextSteps: { "Performance improved": 5, "Still slow": 3 }
        },
        {
          id: 3,
          title: "Storage and System Cleanup",
          description: "Free up disk space and optimize system",
          instructions: [
            "Run Disk Cleanup utility",
            "Delete temporary files and browser cache",
            "Check available disk space (need >15% free)",
            "Defragment hard drive (if HDD, not SSD)",
            "Run Windows Update"
          ],
          nextSteps: { "Performance better": 5, "Still having issues": 4 }
        },
        {
          id: 4,
          title: "Hardware Upgrade Consideration",
          description: "System may need hardware improvements",
          instructions: [
            "Check RAM usage - consider upgrade if consistently >80%",
            "Consider SSD upgrade if using traditional hard drive",
            "Clean internal components (dust removal)",
            "Check system temperatures"
          ],
          nextSteps: { "Hardware upgraded": 5, "Cannot upgrade": 6 }
        },
        {
          id: 5,
          title: "Performance Optimized",
          description: "Your laptop should now run faster",
          instructions: [
            "Monitor performance over next few days",
            "Keep system updated",
            "Regular maintenance (monthly cleanup)",
            "Consider performance monitoring tools"
          ],
          nextSteps: {},
          isComplete: true
        },
        {
          id: 6,
          title: "System Limitations Reached",
          description: "Hardware may be insufficient for current needs",
          instructions: [
            "Consider lighter software alternatives",
            "Reduce visual effects and animations",
            "Use cloud-based applications when possible",
            "Plan for system upgrade or replacement"
          ],
          nextSteps: {},
          isComplete: true
        }
      ]
    },
    tablet: {
      "Touch screen unresponsive": [
        {
          id: 1,
          title: "Basic Touch Screen Reset",
          description: "Simple fixes for touch responsiveness",
          instructions: [
            "Clean screen with microfiber cloth",
            "Remove screen protector temporarily",
            "Restart the tablet completely",
            "Remove any cases or covers"
          ],
          nextSteps: { "Touch working now": 4, "Still unresponsive": 2 }
        },
        {
          id: 2,
          title: "Calibration and Settings",
          description: "Recalibrate touch sensitivity",
          instructions: [
            "Go to Settings > Display > Touch Sensitivity",
            "Adjust touch sensitivity settings",
            "Disable any accessibility touch features",
            "Check for system updates"
          ],
          nextSteps: { "Touch improved": 4, "No improvement": 3 }
        },
        {
          id: 3,
          title: "Factory Reset Consideration",
          description: "Software-level troubleshooting",
          instructions: [
            "Backup all important data",
            "Boot into safe mode and test touch",
            "If touch works in safe mode, uninstall recent apps",
            "Consider factory reset as last software solution"
          ],
          nextSteps: { "Touch working": 4, "Hardware issue": 5 }
        },
        {
          id: 4,
          title: "Touch Screen Fixed",
          description: "Your tablet's touch functionality is restored",
          instructions: [
            "Test all areas of screen thoroughly",
            "Reinstall screen protector if needed",
            "Keep system updated",
            "Handle device carefully to prevent future issues"
          ],
          nextSteps: {},
          isComplete: true
        },
        {
          id: 5,
          title: "Hardware Repair Required",
          description: "Touch screen digitizer may need replacement",
          instructions: [
            "Touch screen hardware failure detected",
            "Contact manufacturer or repair service",
            "Get repair cost estimate",
            "Consider device age vs repair cost"
          ],
          nextSteps: {},
          isComplete: true
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
      toast.success(`Moving to step ${nextStepId}`);
    }
    
    // Save progress
    saveSession();
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
                  {issueCategories[deviceType as keyof typeof issueCategories]?.map((category) => (
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
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Est. {estimatedTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wrench className="h-4 w-4" />
                    <span>Interactive Guide</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    <span>Real Solutions</span>
                  </div>
                </div>
                <Button 
                  onClick={startTroubleshooting}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                >
                  Start Troubleshooting
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
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
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Step {currentStep}: {currentStepData.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {issueCategory}
              </Badge>
            </div>
          </div>
          <Button onClick={resetWizard} variant="outline" size="sm">
            Start Over
          </Button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{completedSteps.length + 1} of {troubleshootingSteps[deviceType]?.[issueCategory]?.length || 0} steps</span>
          </div>
          <Progress 
            value={((completedSteps.length + 1) / (troubleshootingSteps[deviceType]?.[issueCategory]?.length || 1)) * 100} 
            className="h-2"
          />
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
