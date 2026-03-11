import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, MessageCircle, Zap, Battery, Shield, Trash, FileText, BookOpen, AlertTriangle, Brain, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

const Hero = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleFeatureClick = (tab: string) => {
    if (!session) {
      navigate('/auth');
      return;
    }
    navigate(`/diagnose?tab=${tab}`);
  };

  const features = [
    { icon: Camera, label: 'Photo Diagnosis', tab: 'photo' },
    { icon: MessageCircle, label: 'AI Chat', tab: 'chat' },
    { icon: Battery, label: 'Battery Health', tab: 'battery' },
    { icon: Trash, label: 'Storage Cleaner', tab: 'storage' },
    { icon: Shield, label: 'Health Score', tab: 'health' },
    { icon: AlertTriangle, label: 'Security Alerts', tab: 'security' },
    { icon: FileText, label: 'Issue History', tab: 'history' },
    { icon: BookOpen, label: 'Knowledge Hub', tab: 'knowledge' },
    { icon: Brain, label: 'AI Training', tab: 'training' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

      <div className="mx-auto max-w-6xl text-center px-4 py-24 relative z-10 w-full">
        {/* Title */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 drop-shadow-lg">
            ElectroDoctor
          </span>
        </h1>
        <p className="text-xl sm:text-2xl text-amber-200 font-medium mb-4">Smart Gadget Doctor</p>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          AI-powered device diagnosis, repair tracking, optimization, and maintenance — all in one app.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Button
            onClick={() => handleFeatureClick('photo')}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Camera className="mr-2 h-5 w-5" />
            Start Diagnosis
          </Button>
          <Button
            onClick={() => handleFeatureClick('chat')}
            variant="outline"
            size="lg"
            className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            AI Assistant
          </Button>
          <Button
            onClick={() => navigate('/install')}
            variant="outline"
            size="lg"
            className="border-2 border-amber-400/40 bg-amber-500/10 backdrop-blur-sm text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/60 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Download className="mr-2 h-5 w-5" />
            Install App
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-3 max-w-3xl mx-auto mb-14">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <button
                key={index}
                onClick={() => handleFeatureClick(feature.tab)}
                className="group p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/15 hover:border-amber-400/30 transition-all duration-300 hover:scale-105"
              >
                <IconComponent className="h-6 w-6 mx-auto mb-2 text-amber-400 group-hover:text-white transition-colors" />
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {feature.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Feature highlights */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Instant AI Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50" />
            <span>Safe & Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50" />
            <span>Expert Recommendations</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-amber-500" />
            <span>Self-Learning AI</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
