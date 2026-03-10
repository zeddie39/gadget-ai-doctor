import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-consent');
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-white/10 backdrop-blur-xl rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="h-8 w-8 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-white font-medium mb-1">We use cookies 🍪</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            ElectroDoctor uses cookies and local storage to improve your experience, remember preferences, and provide offline functionality. By continuing to use the app, you consent to our use of cookies.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={handleDecline} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            Decline
          </Button>
          <Button onClick={handleAccept} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Accept
          </Button>
        </div>
        <button onClick={handleDecline} className="absolute top-3 right-3 text-gray-500 hover:text-white sm:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
