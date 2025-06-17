
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, MessageCircle, Shield, Zap, Smartphone, AlertTriangle } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Camera,
      title: "Photo Diagnosis",
      description: "Upload photos of damaged devices and get instant AI analysis for cracked screens, water damage, and hardware issues.",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: MessageCircle,
      title: "Smart Chat Support",
      description: "Describe your device problems in plain language and receive personalized troubleshooting steps and solutions.",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: Shield,
      title: "Safety Monitoring",
      description: "Get real-time warnings about overheating, battery health, and potential safety hazards with your devices.",
      gradient: "from-green-500 to-teal-600"
    },
    {
      icon: Zap,
      title: "Performance Optimization",
      description: "Receive AI-powered recommendations to improve battery life, free up storage, and optimize device performance.",
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      icon: Smartphone,
      title: "Device Health Check",
      description: "Comprehensive analysis of your device's overall health including battery, storage, and system performance metrics.",
      gradient: "from-indigo-500 to-blue-600"
    },
    {
      icon: AlertTriangle,
      title: "Emergency Diagnostics",
      description: "Quick diagnosis for critical issues like devices not turning on, overheating, or showing error messages.",
      gradient: "from-red-500 to-pink-600"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Powerful AI-Driven Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced diagnostic tools and intelligent recommendations to keep your gadgets running at their best
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
