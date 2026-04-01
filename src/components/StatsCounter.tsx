import React, { useEffect, useState, useRef } from 'react';
import { Scan, Cpu, Users, Zap } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

const stats: StatItem[] = [
  { icon: Scan, value: 15000, suffix: '+', label: 'Boards Scanned', color: 'text-primary' },
  { icon: Cpu, value: 500, suffix: '+', label: 'Motherboard Models', color: 'text-cyan-400' },
  { icon: Users, value: 3000, suffix: '+', label: 'Active Technicians', color: 'text-emerald-400' },
  { icon: Zap, value: 95, suffix: '%', label: 'Detection Accuracy', color: 'text-purple-400' },
];

const AnimatedCounter: React.FC<{ target: number; suffix: string; isVisible: boolean }> = ({ target, suffix, isVisible }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const StatsCounter: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 px-4 sm:px-6 lg:px-8 relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="text-center p-6 rounded-3xl smart-glass border-none group hover:bg-white/[0.08] transition-all duration-300"
            >
              <div className={`mx-auto w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`text-3xl sm:text-4xl font-black tracking-tight ${stat.color}`}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} isVisible={isInView} />
              </div>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-muted-foreground mt-2">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
