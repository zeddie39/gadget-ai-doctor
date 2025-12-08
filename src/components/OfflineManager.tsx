import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Download, Smartphone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const OfflineManager: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [offlineData, setOfflineData] = useState({
    knowledgeBase: true,
    aiModels: false,
    userHistory: true
  });

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing data...');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You\'re offline. App will continue working!');
    };

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Check if already installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      toast.success('ElectroDoctor installed successfully!');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        toast.success('Installing ElectroDoctor...');
      }
      
      setDeferredPrompt(null);
    }
  };

  const downloadOfflineData = async () => {
    toast.info('Downloading offline data...');
    
    // Simulate downloading AI models and knowledge base
    const items = ['Knowledge Base', 'AI Models', 'Troubleshooting Guides'];
    
    for (let i = 0; i < items.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${items[i]} downloaded for offline use`);
    }
    
    setOfflineData({
      knowledgeBase: true,
      aiModels: true,
      userHistory: true
    });
    
    // Store in localStorage for offline access
    localStorage.setItem('offlineData', JSON.stringify({
      timestamp: Date.now(),
      knowledgeBase: true,
      aiModels: true
    }));
    
    toast.success('All data ready for offline use!');
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <CardTitle>Connection Status</CardTitle>
            </div>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {isOnline 
              ? "You're connected to the internet. All features available."
              : "You're offline. Core features still work with cached data."
            }
          </p>
        </CardContent>
      </Card>

      {/* PWA Installation */}
      {!isInstalled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              <CardTitle>Install ElectroDoctor</CardTitle>
            </div>
            <CardDescription>
              Install as an app for the best offline experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Benefits of installing:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Works completely offline</li>
                  <li>• Faster loading times</li>
                  <li>• Desktop/home screen shortcut</li>
                  <li>• No browser address bar</li>
                  <li>• Push notifications</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {isInstallable ? (
              <Button onClick={installApp} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Install ElectroDoctor App
              </Button>
            ) : (
              <div className="text-sm text-gray-600">
                Installation prompt will appear when available. 
                You can also install manually from your browser menu.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isInstalled && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>ElectroDoctor is installed!</strong> You can now use it completely offline.
          </AlertDescription>
        </Alert>
      )}

      {/* Offline Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Offline Data</CardTitle>
          <CardDescription>
            Download data for full offline functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${offlineData.knowledgeBase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <p className="text-xs">Knowledge Base</p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${offlineData.aiModels ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <p className="text-xs">AI Models</p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${offlineData.userHistory ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <p className="text-xs">User History</p>
            </div>
          </div>
          
          {!offlineData.aiModels && (
            <Button onClick={downloadOfflineData} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download for Offline Use
            </Button>
          )}
          
          {offlineData.aiModels && (
            <div className="text-center text-sm text-green-600">
              ✅ All data available offline
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offline Features */}
      <Card>
        <CardHeader>
          <CardTitle>Available Offline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>AI Chat (cached responses)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Troubleshooting Wizard</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Knowledge Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Battery Health Checker</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Photo Analysis (basic)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>System Monitor</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineManager;