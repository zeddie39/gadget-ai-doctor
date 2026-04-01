import { Button } from '@/components/ui/button';
import { Camera, Scan, CheckCircle, ArrowRight, CircuitBoard, Wrench, Search, Download, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Camera,
      title: "Scan the Board",
      description: "Point your camera at any motherboard or PCB, or upload an existing photo of the board",
      color: 'text-primary',
      bg: 'bg-primary/15 border-primary/30',
    },
    {
      icon: Scan,
      title: "AI Identifies & Detects",
      description: "AI identifies the motherboard model, detects all components, and finds faults like burns, corrosion & shorts",
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/15 border-cyan-500/30',
    },
    {
      icon: Wrench,
      title: "Get Repair Solutions",
      description: "Receive step-by-step repair instructions with difficulty rating and estimated cost",
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
    },
    {
      icon: Search,
      title: "Watch & Download",
      description: "Access matched YouTube repair tutorials and download schematics & boardview files",
      color: 'text-purple-400',
      bg: 'bg-purple-500/15 border-purple-500/30',
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-secondary/30 to-background relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/3 rounded-full blur-3xl -z-10" />

      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-black sm:text-5xl mb-4 text-foreground tracking-tight">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From scan to repair in 4 simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="text-center relative"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              <div className={`mx-auto w-20 h-20 rounded-3xl ${step.bg} border flex items-center justify-center mb-5 transition-transform duration-300 hover:scale-110`}>
                <step.icon className={`h-9 w-9 ${step.color}`} />
              </div>
              <div className="text-5xl font-black text-white/5 mb-2">{index + 1}</div>
              <h3 className="text-lg font-black text-foreground mb-2 tracking-tight">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>

              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-3 z-10">
                  <ArrowRight className={`h-5 w-5 ${step.color} opacity-40`} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Button
            onClick={() => navigate('/diagnose?tab=motherboard')}
            size="lg"
            className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-primary-foreground px-12 py-5 text-lg font-black rounded-2xl shadow-2xl shadow-primary/25 hover:shadow-primary/35 transition-all duration-300 hover:scale-105 gap-2"
          >
            <CircuitBoard className="h-5 w-5" />
            Start Scanning Now
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
