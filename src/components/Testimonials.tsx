import React from 'react';
import { Card } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'James Mwangi',
    role: 'Phone Technician, Nairobi',
    text: 'This app saved me hours of troubleshooting. I scanned an iPhone 13 board and it immediately found the burnt PMIC. Incredible!',
    rating: 5,
    avatar: 'JM'
  },
  {
    name: 'Sarah Kimani',
    role: 'Electronics Repair Shop Owner',
    text: 'The YouTube tutorials and schematic links are exactly what my team needed. We use ElectroDoctor daily for every repair job.',
    rating: 5,
    avatar: 'SK'
  },
  {
    name: 'David Ochieng',
    role: 'Samsung Certified Technician',
    text: 'Best repair assistant I\'ve ever used. The AI is surprisingly accurate at identifying faulty components on Samsung boards.',
    rating: 5,
    avatar: 'DO'
  },
  {
    name: 'Grace Wanjiru',
    role: 'Freelance Repair Tech',
    text: 'I used to spend 30 minutes diagnosing a board. Now I scan it in 30 seconds and get repair steps + video tutorials. Game changer!',
    rating: 5,
    avatar: 'GW'
  },
  {
    name: 'Kevin Otieno',
    role: 'Laptop Repair Specialist',
    text: 'The boardview and schematic downloads feature is pure gold. I can find schematics for any device in seconds.',
    rating: 4,
    avatar: 'KO'
  },
  {
    name: 'Mercy Akinyi',
    role: 'Mobile Repair Trainer',
    text: 'I use this app to train my students. The AI analysis teaches them what to look for on a damaged board. Brilliant tool!',
    rating: 5,
    avatar: 'MA'
  },
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-black sm:text-5xl mb-3 text-foreground tracking-tight">
            Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400">Technicians</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See why repair professionals across Africa rely on ElectroDoctor
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="smart-glass border-none p-6 rounded-3xl h-full group hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
                {/* Quote decoration */}
                <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < t.rating ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`}
                    />
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-sm text-foreground/80 leading-relaxed mb-6 font-medium">
                  "{t.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-amber-500/20 border border-primary/20 flex items-center justify-center">
                    <span className="text-xs font-black text-primary">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
