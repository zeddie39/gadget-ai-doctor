import React from 'react';
import { ExternalLink, Download, FileText, CircuitBoard, Search, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface SchematicDownloadsProps {
  motherboardModel: string;
  deviceType: string;
}

interface SchematicSource {
  name: string;
  description: string;
  url: string;
  icon: React.ElementType;
  fileTypes: string[];
  color: string;
}

const SchematicDownloads: React.FC<SchematicDownloadsProps> = ({ motherboardModel, deviceType }) => {
  const cleanModel = motherboardModel.replace(/[^\w\s\-]/g, '').trim();

  const sources: SchematicSource[] = [
    {
      name: 'Phoneboard.co',
      description: 'Free boardview files and schematics for phones & tablets',
      url: `https://phoneboard.co/?s=${encodeURIComponent(cleanModel)}`,
      icon: CircuitBoard,
      fileTypes: ['.boardview', '.brd'],
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/20'
    },
    {
      name: 'BadCaps Forum',
      description: 'Community-driven electronics repair schematics & boardviews',
      url: `https://www.badcaps.net/forum/search.php?searchid=${encodeURIComponent(cleanModel)}`,
      icon: Database,
      fileTypes: ['.pdf', '.boardview'],
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/20'
    },
    {
      name: 'iFixit Teardown',
      description: 'Step-by-step teardowns with high-res board images',
      url: `https://www.ifixit.com/Search?query=${encodeURIComponent(cleanModel)}`,
      icon: Search,
      fileTypes: ['teardown', 'guide'],
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/20'
    },
    {
      name: 'GSM Forum',
      description: 'Professional repair resources, schematics & service manuals',
      url: `https://forum.gsmhosting.com/vbb/search.php?searchid=${encodeURIComponent(cleanModel + ' schematic')}`,
      icon: FileText,
      fileTypes: ['.pdf', '.rar'],
      color: 'from-green-500/20 to-emerald-500/10 border-green-500/20'
    },
    {
      name: 'ZXW Soft Search',
      description: 'Professional boardview & bitmap tool for phone repair',
      url: `https://www.google.com/search?q=${encodeURIComponent(cleanModel + ' ZXW boardview download')}`,
      icon: CircuitBoard,
      fileTypes: ['.zxw', '.bitmap'],
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/20'
    },
    {
      name: 'Google Schematic Search',
      description: 'Search the web for available schematics & service manuals',
      url: `https://www.google.com/search?q=${encodeURIComponent(cleanModel + ' schematic diagram PDF download')}`,
      icon: Search,
      fileTypes: ['.pdf', '.png'],
      color: 'from-red-500/20 to-orange-500/10 border-red-500/20'
    },
  ];

  const openSource = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium mb-4">
        📐 Find schematics, boardview files, and service manuals for <span className="text-foreground font-bold">{cleanModel}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((source, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => openSource(source.url)}
            className={`group relative p-4 rounded-2xl bg-gradient-to-br ${source.color} border hover:scale-[1.02] transition-all duration-300 text-left cursor-pointer`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/15 transition-colors">
                <source.icon className="w-5 h-5 text-foreground/80" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground/90 flex items-center gap-1.5">
                  {source.name}
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-relaxed">
                  {source.description}
                </p>
                <div className="flex gap-1.5 mt-2">
                  {source.fileTypes.map((ft, j) => (
                    <Badge key={j} variant="outline" className="text-[8px] px-1.5 py-0 bg-white/5 border-white/10 font-bold uppercase">
                      {ft}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Bulk search */}
      <div className="pt-2">
        <Button
          onClick={() => openSource(`https://www.google.com/search?q=${encodeURIComponent(cleanModel + ' boardview schematic download free')}`)}
          variant="outline"
          className="w-full smart-glass border-amber-500/20 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 rounded-xl gap-2 font-bold"
        >
          <Download className="w-4 h-4" />
          Search All Schematics for {cleanModel.slice(0, 30)}
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default SchematicDownloads;
