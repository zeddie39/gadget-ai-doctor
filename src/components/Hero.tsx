
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, MessageCircle, Zap, Shield, Trash, Battery, FileText, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const handleFeatureClick = (tab: string) => {
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
  ];

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      {/* Background gradient circles */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="mx-auto max-w-7xl text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
              ZediFix
            </span>
          </h1>
          <p className="text-xl text-gray-600 mt-4 font-medium">Smart Gadget Doctor</p>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Complete AI-powered solution for device diagnosis, repair tracking, optimization, and maintenance. 
            From photo analysis to battery health monitoring - everything you need to keep your gadgets running perfectly.
          </p>
          
          {/* Main Action Buttons */}
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

          {/* Feature Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
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
          
          {/* Feature Highlights */}
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
