import React from 'react';
import { ExternalLink, Play, Search, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface YouTubeTutorialsProps {
  motherboardModel: string;
  deviceType: string;
  faults: string[];
}

const YouTubeTutorials: React.FC<YouTubeTutorialsProps> = ({ motherboardModel, deviceType, faults }) => {
  const generateSearchQueries = () => {
    const queries: { title: string; query: string; tag: string }[] = [];

    // Main device repair
    const cleanModel = motherboardModel.replace(/[^\w\s]/g, '').trim();
    queries.push({
      title: `${cleanModel} Motherboard Repair`,
      query: `${cleanModel} motherboard repair tutorial`,
      tag: 'Full Repair'
    });

    // Fault-specific tutorials
    faults.slice(0, 3).forEach(fault => {
      const cleanFault = fault.replace(/[^\w\s]/g, '').trim().slice(0, 50);
      queries.push({
        title: `Fix: ${cleanFault.slice(0, 40)}...`,
        query: `${deviceType} ${cleanFault} repair tutorial`,
        tag: 'Fault Fix'
      });
    });

    // General tutorials based on device type
    queries.push({
      title: `${deviceType} Board-Level Repair Guide`,
      query: `${deviceType} board level repair soldering tutorial`,
      tag: 'Guide'
    });

    queries.push({
      title: `${deviceType} Schematic Reading`,
      query: `${deviceType} schematic reading boardview tutorial`,
      tag: 'Schematic'
    });

    return queries.slice(0, 6);
  };

  const openYouTube = (query: string) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const tutorials = generateSearchQueries();

  const tagColors: Record<string, string> = {
    'Full Repair': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Fault Fix': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Guide': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Schematic': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium mb-4">
        🎬 AI-generated search queries based on your scan results. Click to find repair videos on YouTube.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tutorials.map((tutorial, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => openYouTube(tutorial.query)}
            className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 text-left cursor-pointer hover:scale-[1.02]"
          >
            {/* YouTube play button mockup */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/20 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:from-red-500/40 group-hover:to-red-600/30 transition-colors">
                <Play className="w-5 h-5 text-red-400 group-hover:text-red-300 ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tagColors[tutorial.tag] || tagColors.Guide}`}>
                    {tutorial.tag}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground/90 group-hover:text-foreground truncate">
                  {tutorial.title}
                </h4>
                <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                  <Youtube className="w-3 h-3" /> Search on YouTube
                  <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* General search button */}
      <div className="pt-2">
        <Button
          onClick={() => openYouTube(`${motherboardModel} repair tutorial ${deviceType}`)}
          variant="outline"
          className="w-full smart-glass border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl gap-2 font-bold"
        >
          <Search className="w-4 h-4" />
          Search All Repair Videos for {motherboardModel.slice(0, 30)}
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default YouTubeTutorials;
