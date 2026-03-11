import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, MessageCircle, Shield, Zap, Smartphone, AlertTriangle } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Camera,
      title: "Photo Diagnosis",
      description: "Upload photos of damaged devices and get instant AI analysis for cracked screens, water damage, and hardware issues.",
    },
    {
      icon: MessageCircle,
      title: "Smart Chat Support",
      description: "Describe your device problems in plain language and receive personalized troubleshooting steps and solutions.",
    },
    {
      icon: Shield,
      title: "Safety Monitoring",
      description: "Get real-time warnings about overheating, battery health, and potential safety hazards with your devices.",
    },
    {
      icon: Zap,
      title: "Performance Optimization",
      description: "Receive AI-powered recommendations to improve battery life, free up storage, and optimize device performance.",
    },
    {
      icon: Smartphone,
      title: "Device Health Check",
      description: "Comprehensive analysis of your device's overall health including battery, storage, and system performance metrics.",
    },
    {
      icon: AlertTriangle,
      title: "Emergency Diagnostics",
      description: "Quick diagnosis for critical issues like devices not turning on, overheating, or showing error messages.",
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold sm:text-5xl mb-4 text-foreground">
            Powerful AI-Driven Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Advanced diagnostic tools and intelligent recommendations to keep your gadgets running at their best
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.03] border border-border bg-card backdrop-blur-md"
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold text-card-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-center leading-relaxed">
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
