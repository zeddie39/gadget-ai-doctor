import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, MessageCircle, Shield, Zap, CircuitBoard, AlertTriangle, Search, Wrench, Download, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

const Features = () => {
  const features = [
    {
      icon: CircuitBoard,
      title: "Motherboard Scanner",
      description: "Scan any motherboard with your camera. AI identifies the model, detects faulty components, and provides repair solutions instantly.",
      color: 'from-primary/20 to-amber-500/10',
      iconColor: 'text-primary',
    },
    {
      icon: AlertTriangle,
      title: "Fault Detection",
      description: "Detects burn marks, corrosion, swollen capacitors, short circuits, missing components, and cold solder joints with AI precision.",
      color: 'from-red-500/20 to-orange-500/10',
      iconColor: 'text-red-400',
    },
    {
      icon: Wrench,
      title: "Repair Instructions",
      description: "Get step-by-step repair protocols tailored to the exact fault detected. Includes estimated cost and difficulty level.",
      color: 'from-emerald-500/20 to-green-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Search,
      title: "YouTube Tutorials",
      description: "AI generates smart search queries and links you directly to relevant repair tutorial videos on YouTube for your specific board.",
      color: 'from-red-500/15 to-pink-500/10',
      iconColor: 'text-red-400',
    },
    {
      icon: Download,
      title: "Schematics & Boardview",
      description: "Find and download schematic diagrams and boardview files from trusted sources like Phoneboard, BadCaps, and iFixit.",
      color: 'from-purple-500/20 to-indigo-500/10',
      iconColor: 'text-purple-400',
    },
    {
      icon: Camera,
      title: "Photo Diagnosis",
      description: "Upload photos of damaged devices and get instant AI analysis for cracked screens, water damage, and hardware issues.",
      color: 'from-amber-500/20 to-yellow-500/10',
      iconColor: 'text-amber-400',
    },
    {
      icon: MessageCircle,
      title: "Smart Chat Support",
      description: "Describe your device problems in plain language and receive personalized troubleshooting steps and solutions.",
      color: 'from-blue-500/20 to-cyan-500/10',
      iconColor: 'text-blue-400',
    },
    {
      icon: Shield,
      title: "Safety Monitoring",
      description: "Get real-time warnings about overheating, battery health, and potential safety hazards with your devices.",
      color: 'from-cyan-500/20 to-teal-500/10',
      iconColor: 'text-cyan-400',
    },
    {
      icon: Brain,
      title: "Self-Learning AI",
      description: "Our AI continuously improves from technician feedback, making diagnostic accuracy better with every scan.",
      color: 'from-pink-500/20 to-purple-500/10',
      iconColor: 'text-pink-400',
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Powerful Features</span>
          </motion.div>

          <h2 className="text-4xl font-black sm:text-5xl mb-4 text-foreground tracking-tight">
            Everything a Technician Needs
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From motherboard scanning to schematic downloads — the complete AI-powered repair toolkit
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Card className={`group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:scale-[1.03] border border-white/5 bg-gradient-to-br ${feature.color} backdrop-blur-md h-full rounded-2xl overflow-hidden`}>
                <CardHeader className="text-center pb-3">
                  <div className={`mx-auto w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300`}>
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg font-black text-card-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-center leading-relaxed text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
