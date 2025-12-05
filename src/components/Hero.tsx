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
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      {/* ... keep existing code (background gradient circles) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="mx-auto max-w-7xl text-center">
        <div className="mx-auto max-w-4xl">
          {/* ... keep existing code (title and description) */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src="/favicon.ico" alt="ElectroDoctor Logo" className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
              ElectroDoctor
            </span>
          </h1>
          <p className="text-xl text-gray-600 mt-4 font-medium">Smart Gadget Doctor</p>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Complete AI-powered solution for device diagnosis, repair tracking, optimization, and maintenance. 
            From photo analysis to battery health monitoring - everything you need to keep your gadgets running perfectly.
          </p>
          
          {/* ... keep existing code (main action buttons) */}
          <div className="mt-10 flex items-center justify-center gap-x-6 flex-wrap">
            <Button 
              onClick={() => handleFeatureClick('photo')}
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Camera className="mr-2 h-5 w-5" />
              Start Diagnosis
            </Button>
            <Button 
              onClick={() => handleFeatureClick('chat')}
              variant="outline" 
              size="lg"
              className="border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              AI Assistant
            </Button>
          </div>

          {/* Feature Grid - Updated to 3x3 grid to accommodate new AI Training feature */}
          <div className="mt-16 grid grid-cols-3 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleFeatureClick(feature.tab)}
                  className={`group p-4 rounded-xl border-2 border-gray-200 hover:border-${feature.color}-300 bg-white hover:bg-${feature.color}-50 transition-all duration-300 hover:scale-105 hover:shadow-md`}
                >
                  <IconComponent className={`h-6 w-6 mx-auto mb-2 text-${feature.color}-600 group-hover:text-${feature.color}-700`} />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {feature.label}
                  </p>
                </button>
              );
            })}
          </div>
          
          {/* ... keep existing code (feature highlights) */}
          <div className="mt-16 flex justify-center items-center gap-8 text-sm text-gray-500 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Instant AI Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Safe & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Expert Recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <span>Complete Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span>Self-Learning AI</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
