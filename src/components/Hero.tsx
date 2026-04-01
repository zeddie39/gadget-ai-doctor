import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, MessageCircle, Zap, Battery, Shield, FileText, BookOpen, AlertTriangle, Brain, Download, CircuitBoard, Wrench, Search, Cpu, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

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
    { icon: CircuitBoard, label: 'Board Scanner', tab: 'motherboard', color: 'text-primary' },
    { icon: Camera, label: 'Photo Scan', tab: 'photo', color: 'text-amber-400' },
    { icon: MessageCircle, label: 'AI Chat', tab: 'chat', color: 'text-emerald-400' },
    { icon: Battery, label: 'Battery Health', tab: 'battery', color: 'text-red-400' },
    { icon: Shield, label: 'Health Score', tab: 'health', color: 'text-cyan-400' },
    { icon: AlertTriangle, label: 'Security', tab: 'security', color: 'text-purple-400' },
    { icon: Wrench, label: 'Wizard', tab: 'troubleshoot', color: 'text-blue-400' },
    { icon: BookOpen, label: 'Knowledge', tab: 'knowledge', color: 'text-green-400' },
    { icon: Brain, label: 'AI Training', tab: 'training', color: 'text-pink-400' },
  ];

  const tickerItems = [
    'Motherboard Scanning', 'Component Detection', 'Fault Analysis', 'Repair Guides',
    'YouTube Tutorials', 'Schematic Downloads', 'Boardview Files', 'AI Diagnostics',
    'Battery Health', 'PCB Analysis', 'Micro-Soldering', 'IC Identification',
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat scale-105 bg-[url('/hero-bg.jpg')]"
      />
      {/* Dark overlay with gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      {/* Particle background */}
      <div className="absolute inset-0 -z-5 particle-bg" />

      <div className="mx-auto max-w-6xl text-center px-4 py-28 relative z-10 w-full">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">AI-Powered • Trusted by 3,000+ Technicians</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 drop-shadow-lg">
            ElectroDoctor
          </span>
        </motion.h1>

        <motion.p
          className="text-xl sm:text-2xl text-accent font-bold mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Smart Gadget Repair Assistant
        </motion.p>

        <motion.p
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Scan any motherboard, identify faults instantly, get repair steps, YouTube tutorials & schematic downloads — all powered by AI.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <Button
            onClick={() => handleFeatureClick('motherboard')}
            size="lg"
            className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-primary-foreground px-8 py-5 text-lg font-black rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 gap-2 neon-glow-subtle"
          >
            <CircuitBoard className="h-5 w-5" />
            Scan Motherboard
          </Button>
          <Button
            onClick={() => handleFeatureClick('chat')}
            variant="outline"
            size="lg"
            className="border-2 border-white/10 smart-glass text-foreground hover:bg-white/10 px-8 py-5 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            AI Assistant
          </Button>
          <Button
            onClick={() => navigate('/install')}
            variant="outline"
            size="lg"
            className="border-2 border-primary/30 bg-primary/5 text-accent hover:bg-primary/15 px-8 py-5 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 gap-2"
          >
            <Download className="h-5 w-5" />
            Install App
          </Button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {[
            { icon: Cpu, text: '500+ Board Models', color: 'text-cyan-400' },
            { icon: Zap, text: 'Instant AI Analysis', color: 'text-primary' },
            { icon: Users, text: '3,000+ Technicians', color: 'text-emerald-400' },
            { icon: Brain, text: 'Self-Learning AI', color: 'text-purple-400' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
              <span className="text-xs font-bold text-muted-foreground">{badge.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-3 max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.button
                key={index}
                onClick={() => handleFeatureClick(feature.tab)}
                className="group p-4 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.08] hover:border-primary/20 transition-all duration-300 hover:scale-105"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.04 }}
              >
                <IconComponent className={`h-6 w-6 mx-auto mb-2 ${feature.color} group-hover:scale-110 transition-transform`} />
                <p className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  {feature.label}
                </p>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Scrolling tech ticker */}
        <motion.div
          className="overflow-hidden max-w-4xl mx-auto opacity-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <div className="ticker-scroll">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {item} •
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
