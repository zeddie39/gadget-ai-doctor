import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor, ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-10 transition-colors">
          <ArrowLeft className="h-5 w-5" /> Back to home
        </button>

        <div className="text-center mb-12">
          <Download className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Install ElectroDoctor</h1>
          <p className="text-gray-400 text-lg">Get the full app experience on your device — works offline!</p>
        </div>

        {installed ? (
          <div className="text-center py-12 bg-green-500/10 border border-green-500/20 rounded-2xl">
            <Check className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-300 mb-2">App Installed!</h2>
            <p className="text-gray-400">You can now find ElectroDoctor on your home screen.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Automatic install */}
            {deferredPrompt && (
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center">
                <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-3">One-Tap Install</h2>
                <p className="text-gray-400 mb-6">Your browser supports direct installation.</p>
                <Button onClick={handleInstall} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 text-lg rounded-xl">
                  <Download className="mr-2 h-5 w-5" /> Install Now
                </Button>
              </div>
            )}

            {/* Manual instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Android */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <Smartphone className="h-10 w-10 text-green-400 mb-4" />
                <h3 className="text-xl font-bold mb-4">Android</h3>
                <ol className="space-y-3 text-gray-400 text-sm">
                  <li className="flex gap-3"><span className="text-primary font-bold">1.</span> Open this page in Chrome</li>
                  <li className="flex gap-3"><span className="text-primary font-bold">2.</span> Tap the menu (⋮) in the top-right</li>
                  <li className="flex gap-3"><span className="text-primary font-bold">3.</span> Tap "Add to Home screen"</li>
                  <li className="flex gap-3"><span className="text-primary font-bold">4.</span> Tap "Add" to confirm</li>
                </ol>
              </div>

              {/* iOS */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <Monitor className="h-10 w-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold mb-4">iPhone / iPad</h3>
                <ol className="space-y-3 text-gray-400 text-sm">
                  <li className="flex gap-3"><span className="text-primary font-bold">1.</span> Open this page in Safari</li>
                  <li className="flex gap-3"><span className="text-primary font-bold">2.</span> Tap the Share button (↑)</li>
                  <li className="flex gap-3"><span className="text-primary font-bold">3.</span> Scroll and tap "Add to Home Screen"</li>
                  <li className="flex gap-3"><span className="text-primary font-bold">4.</span> Tap "Add" to confirm</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Install;
