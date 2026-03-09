import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, MessageCircle, Zap, Shield, Trash, Battery, FileText, BookOpen, AlertTriangle, Brain } from 'lucide-react';
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
    { icon: Camera, label: 'Photo Diagnosis', tab: 'photo', color: 'blue' },
    { icon: MessageCircle, label: 'AI Chat', tab: 'chat', color: 'green' },
    { icon: Battery, label: 'Battery Health', tab: 'battery', color: 'orange' },
    { icon: Trash, label: 'Storage Cleaner', tab: 'storage', color: 'purple' },
    { icon: Shield, label: 'Health Score', tab: 'health', color: 'indigo' },
    { icon: AlertTriangle, label: 'Security Alerts', tab: 'security', color: 'red' },
    { icon: FileText, label: 'Issue History', tab: 'history', color: 'blue' },
    { icon: BookOpen, label: 'Knowledge Hub', tab: 'knowledge', color: 'teal' },
    { icon: Brain, label: 'AI Training', tab: 'training', color: 'purple' },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32 min-h-[90vh] flex items-center">
      {/* Stunning Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient - Deep tech colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>

        {/* Animated mesh gradient overlay */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 40%),
              radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 40%),
              radial-gradient(circle at 40% 70%, rgba(6, 182, 212, 0.3) 0%, transparent 35%),
              radial-gradient(circle at 70% 30%, rgba(168, 85, 247, 0.3) 0%, transparent 35%)
            `
          }}
        ></div>

        {/* Circuit pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2360a5fa' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Floating animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>

        {/* Glowing lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/30 to-transparent"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent"></div>

        {/* Bottom fade for smooth transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      </div>

      <div className="mx-auto max-w-7xl text-center relative z-10 w-full">
        <div className="mx-auto max-w-4xl">
          {/* Premium Title with enhanced visibility */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl drop-shadow-2xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)',
                filter: 'drop-shadow(0 0 30px rgba(96, 165, 250, 0.5))'
              }}
            >
              ElectroDoctor
            </span>
          </h1>
          <p className="text-2xl text-blue-200 mt-4 font-medium tracking-wide drop-shadow-lg">Smart Gadget Doctor</p>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto drop-shadow-md">
            Complete AI-powered solution for device diagnosis, repair tracking, optimization, and maintenance.
            From photo analysis to battery health monitoring - everything you need to keep your gadgets running perfectly.
          </p>

          {/* Action Buttons with glass effect */}
          <div className="mt-10 flex items-center justify-center gap-x-6 flex-wrap">
            <Button
              onClick={() => handleFeatureClick('photo')}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 border border-white/20"
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
          </div>

          {/* Feature Grid with glass effect cards */}
          <div className="mt-16 grid grid-cols-3 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleFeatureClick(feature.tab)}
                  className="group p-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <IconComponent className="h-6 w-6 mx-auto mb-2 text-blue-300 group-hover:text-white transition-colors" />
                  <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {feature.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Feature highlights */}
          <div className="mt-16 flex justify-center items-center gap-8 text-sm text-gray-400 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Instant AI Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
              <span>Safe & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"></div>
              <span>Expert Recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"></div>
              <span>Complete Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span>Self-Learning AI</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
