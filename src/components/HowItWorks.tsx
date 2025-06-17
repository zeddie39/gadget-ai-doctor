
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Scan, CheckCircle, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload or Describe",
      description: "Take a photo of your device issue or describe the problem in your own words",
      color: "text-blue-600"
    },
    {
      icon: Scan,
      title: "AI Analysis",
      description: "Our advanced AI analyzes the image or text to identify potential issues and causes",
      color: "text-purple-600"
    },
    {
      icon: CheckCircle,
      title: "Get Solutions",
      description: "Receive detailed repair guidance, safety tips, and personalized recommendations",
      color: "text-green-600"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-blue-50">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            How ZediFix Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get expert device diagnostics in three simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              <div className={`mx-auto w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className={`h-10 w-10 ${step.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
              
              {/* Arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-4 z-10">
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Diagnosing Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
