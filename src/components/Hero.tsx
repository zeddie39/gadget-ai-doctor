
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, MessageCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const handleDiagnoseClick = () => {
    navigate('/diagnose');
  };

  const handleChatClick = () => {
    navigate('/diagnose?tab=chat');
  };

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
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Upload photos or describe issues with your electronic gadgets and get instant AI-powered repair advice, 
            safety tips, and smart recommendations to keep your devices running perfectly.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6 flex-wrap">
            <Button 
              onClick={handleDiagnoseClick}
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Camera className="mr-2 h-5 w-5" />
              Diagnose with Photo
            </Button>
            <Button 
              onClick={handleChatClick}
              variant="outline" 
              size="lg"
              className="border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat Support
            </Button>
          </div>
          
          <div className="mt-16 flex justify-center items-center gap-8 text-sm text-gray-500">
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
