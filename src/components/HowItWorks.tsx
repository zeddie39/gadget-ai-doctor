import { Button } from '@/components/ui/button';
import { Upload, Scan, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Upload,
      title: "Upload or Describe",
      description: "Take a photo of your device issue or describe the problem in your own words",
    },
    {
      icon: Scan,
      title: "AI Analysis",
      description: "Our advanced AI analyzes the image or text to identify potential issues and causes",
    },
    {
      icon: CheckCircle,
      title: "Get Solutions",
      description: "Receive detailed repair guidance, safety tips, and personalized recommendations",
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold sm:text-5xl mb-4 text-foreground">
            How ElectroDoctor Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Get expert device diagnostics in three simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="text-center relative"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110">
                <step.icon className="h-10 w-10 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary/30 mb-2">{index + 1}</div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-4 z-10">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            onClick={() => navigate('/diagnose')}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-4 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Diagnosing Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
