
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Shield, Battery, Zap, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';

interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'battery' | 'screen' | 'performance' | 'security' | 'maintenance' | 'troubleshooting';
  tags: string[];
  readTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  trending: boolean;
}

const KnowledgeHub = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  const knowledgeArticles: KnowledgeArticle[] = [
    {
      id: '1',
      title: 'How to Protect Your Battery Life',
      summary: 'Essential tips to maximize your device battery lifespan and performance',
      content: `# Battery Protection Guide

## Optimal Charging Practices
- Charge between 20-80% when possible
- Avoid overnight charging regularly
- Use original chargers
- Don't let battery drop to 0% frequently

## Temperature Management
- Keep device cool during charging
- Avoid using intensive apps while charging
- Remove phone case if it gets warm

## Settings Optimization
- Enable battery optimization in settings
- Reduce screen brightness
- Turn off unnecessary background apps
- Use dark mode on OLED displays

## Warning Signs
- Battery draining faster than usual
- Device getting hot during normal use
- Sudden shutdowns
- Swelling or physical deformation`,
      category: 'battery',
      tags: ['battery', 'charging', 'optimization', 'lifespan'],
      readTime: 5,
      difficulty: 'beginner',
      trending: true
    },
    {
      id: '2',
      title: 'Why Your Phone May Explode During Charging',
      summary: 'Critical safety information about charging hazards and prevention',
      content: `# Charging Safety: Preventing Device Explosions

## Common Causes
- Overheating due to faulty chargers
- Swollen or damaged batteries
- Poor ventilation during charging
- Using non-certified accessories

## Warning Signs
- Excessive heat during charging
- Unusual smells or sounds
- Visible battery swelling
- Charging port damage

## Prevention Steps
- Use only certified chargers
- Charge in well-ventilated areas
- Remove phone cases during charging
- Replace damaged cables immediately
- Never charge under pillows/blankets

## Emergency Response
- If device becomes extremely hot, unplug immediately
- Move to a safe, open area
- Contact professional repair service
- Do not attempt to use the device`,
      category: 'security',
      tags: ['safety', 'charging', 'explosion', 'emergency'],
      readTime: 7,
      difficulty: 'beginner',
      trending: true
    },
    {
      id: '3',
      title: 'Screen Protection and Crack Prevention',
      summary: 'Complete guide to keeping your screen safe and pristine',
      content: `# Screen Protection Master Guide

## Prevention is Key
- Use quality screen protectors
- Invest in a good case with raised edges
- Avoid placing phone face-down
- Keep away from keys and coins

## Types of Screen Protectors
- Tempered glass: Best protection, feels like original screen
- Plastic film: Basic protection, cheaper option
- Liquid screen protectors: Invisible but limited protection

## Handling Cracks
- Apply clear tape for temporary fix
- Avoid pressing on cracked areas
- Back up data immediately
- Professional repair recommended

## Cleaning Best Practices
- Use microfiber cloths only
- Avoid harsh chemicals
- Clean gently in circular motions
- Turn off device before cleaning`,
      category: 'screen',
      tags: ['screen', 'protection', 'cracks', 'maintenance'],
      readTime: 4,
      difficulty: 'beginner',
      trending: false
    },
    {
      id: '4',
      title: 'Advanced Performance Optimization',
      summary: 'Pro tips to maximize your device speed and responsiveness',
      content: `# Advanced Performance Tuning

## Developer Options (Android)
- Enable developer options
- Reduce animation scales to 0.5x
- Force GPU rendering for 2D apps
- Background process limit to 2

## iOS Optimization
- Reduce motion effects
- Disable background app refresh selectively
- Clear Safari cache regularly
- Restart device weekly

## Storage Management
- Keep 15-20% storage free
- Move photos to cloud storage
- Clear app caches monthly
- Uninstall unused apps

## Network Optimization
- Use 5GHz WiFi when available
- Clear network settings if slow
- Disable automatic downloads
- Use airplane mode to reset connections`,
      category: 'performance',
      tags: ['performance', 'speed', 'optimization', 'advanced'],
      readTime: 8,
      difficulty: 'advanced',
      trending: false
    },
    {
      id: '5',
      title: 'Water Damage Emergency Response',
      summary: 'Step-by-step guide to save your device from water damage',
      content: `# Water Damage Recovery Protocol

## Immediate Actions (First 5 minutes)
1. Turn off device immediately
2. Remove from water source
3. Remove battery if possible (Android)
4. Dry external surfaces gently

## Drying Process
- Place in rice or silica gel packets
- Leave for 48-72 hours minimum
- Avoid heat sources (hair dryer, oven)
- Don't shake or tap the device

## What NOT to do
- Don't turn on to "test" it
- Don't charge the device
- Don't use compressed air
- Don't put in microwave

## Professional Help
- If saltwater exposure, seek help immediately
- Complex devices need professional cleaning
- Data recovery may be possible even if device fails`,
      category: 'troubleshooting',
      tags: ['water', 'damage', 'emergency', 'recovery'],
      readTime: 6,
      difficulty: 'intermediate',
      trending: false
    },
    {
      id: '6',
      title: 'Security Threats and Malware Detection',
      summary: 'Identify and protect against mobile security threats',
      content: `# Mobile Security Essentials

## Common Threats
- Malicious apps from unknown sources
- Phishing messages and emails
- Public WiFi vulnerabilities
- Fake charging stations

## Warning Signs
- Unusual battery drain
- Slow performance
- Unexpected data usage
- Pop-up ads outside apps
- Apps crashing frequently

## Protection Strategies
- Install apps only from official stores
- Keep OS and apps updated
- Use strong, unique passwords
- Enable two-factor authentication
- Avoid public WiFi for sensitive activities

## If Compromised
- Change all important passwords
- Check bank and credit card statements
- Run security scans
- Consider factory reset if severely infected`,
      category: 'security',
      tags: ['security', 'malware', 'protection', 'threats'],
      readTime: 9,
      difficulty: 'intermediate',
      trending: true
    }
  ];

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpen, count: knowledgeArticles.length },
    { id: 'battery', name: 'Battery', icon: Battery, count: knowledgeArticles.filter(a => a.category === 'battery').length },
    { id: 'screen', name: 'Screen', icon: Shield, count: knowledgeArticles.filter(a => a.category === 'screen').length },
    { id: 'performance', name: 'Performance', icon: Zap, count: knowledgeArticles.filter(a => a.category === 'performance').length },
    { id: 'security', name: 'Security', icon: AlertTriangle, count: knowledgeArticles.filter(a => a.category === 'security').length },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: Lightbulb, count: knowledgeArticles.filter(a => a.category === 'troubleshooting').length },
  ];

  const filteredArticles = knowledgeArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.id === category);
    const IconComponent = categoryData?.icon || BookOpen;
    return <IconComponent className="h-4 w-4" />;
  };

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={() => setSelectedArticle(null)}
          variant="outline" 
          className="mb-6"
        >
          ← Back to Knowledge Hub
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{selectedArticle.title}</CardTitle>
                <CardDescription className="text-base">{selectedArticle.summary}</CardDescription>
              </div>
              {selectedArticle.trending && (
                <Badge className="bg-orange-100 text-orange-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <Badge variant="outline" className="flex items-center gap-1">
                {getCategoryIcon(selectedArticle.category)}
                {selectedArticle.category}
              </Badge>
              <Badge className={getDifficultyColor(selectedArticle.difficulty)}>
                {selectedArticle.difficulty}
              </Badge>
              <span className="text-sm text-gray-500">{selectedArticle.readTime} min read</span>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                {selectedArticle.content}
              </pre>
            </div>
            
            <div className="mt-8 pt-6 border-t">
              <h4 className="font-medium mb-3">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Knowledge Hub</h1>
        <p className="text-gray-600">Expert tips and guides for device care and troubleshooting</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {category.name}
              <Badge variant="secondary" className="ml-1">
                {category.count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Trending Section */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Trending Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeArticles.filter(article => article.trending).map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="p-4 bg-white rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{article.summary}</p>
                <div className="flex items-center justify-between">
                  <Badge className={getDifficultyColor(article.difficulty)}>
                    {article.difficulty}
                  </Badge>
                  <span className="text-xs text-gray-500">{article.readTime} min</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <Card
            key={article.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedArticle(article)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getCategoryIcon(article.category)}
                  {article.category}
                </Badge>
                {article.trending && (
                  <Badge className="bg-orange-100 text-orange-800">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Hot
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{article.title}</CardTitle>
              <CardDescription>{article.summary}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge className={getDifficultyColor(article.difficulty)}>
                  {article.difficulty}
                </Badge>
                <span className="text-sm text-gray-500">{article.readTime} min read</span>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-3">
                {article.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {article.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{article.tags.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No articles found matching your search</p>
            <p className="text-sm text-gray-400">Try different keywords or browse all categories</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KnowledgeHub;
