import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Shield, Battery, Zap, AlertTriangle, Lightbulb, TrendingUp, Clock, ArrowLeft, Star } from 'lucide-react';

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
    },
    {
      id: '7',
      title: 'Complete Guide to Phone Storage Management',
      summary: 'Master storage optimization techniques to keep your device running smoothly',
      content: `# Storage Management Mastery

## Understanding Storage Types
- System storage: OS and pre-installed apps
- App storage: Downloaded applications and their data
- Media storage: Photos, videos, music files
- Cache storage: Temporary files and app caches

## Quick Storage Cleanup
- Delete unused apps and games
- Clear app caches monthly
- Move photos/videos to cloud storage
- Remove downloaded files and documents
- Empty trash/recycle bin

## Advanced Storage Techniques
- Use storage analyzer apps
- Enable automatic cloud backup
- Compress large video files
- Use external storage devices
- Regular system cleanup

## Storage Optimization Settings
- Enable smart storage management
- Set automatic cache clearing
- Configure cloud sync settings
- Use storage recommendations`,
      category: 'performance',
      tags: ['storage', 'cleanup', 'optimization', 'space'],
      readTime: 6,
      difficulty: 'intermediate',
      trending: false
    },
    {
      id: '8',
      title: 'WiFi and Connectivity Troubleshooting',
      summary: 'Solve common network and connectivity issues with proven methods',
      content: `# Network Connectivity Solutions

## WiFi Connection Problems
- Restart your router and device
- Forget and reconnect to network
- Check WiFi password accuracy
- Move closer to router
- Update network drivers

## Slow Internet Speeds
- Run speed tests at different times
- Check for background downloads
- Switch to 5GHz band if available
- Clear DNS cache
- Contact your ISP if persistent

## Bluetooth Issues
- Clear Bluetooth cache
- Unpair and re-pair devices
- Check device compatibility
- Update Bluetooth drivers
- Reset network settings

## Mobile Data Problems
- Check data plan limits
- Verify APN settings
- Toggle airplane mode
- Contact carrier support
- Check for carrier updates`,
      category: 'troubleshooting',
      tags: ['wifi', 'bluetooth', 'network', 'connectivity'],
      readTime: 7,
      difficulty: 'intermediate',
      trending: true
    },
    {
      id: '9',
      title: 'App Crashes and Freezing Solutions',
      summary: 'Diagnose and fix app stability issues effectively',
      content: `# App Stability Troubleshooting

## Common Causes of App Crashes
- Insufficient RAM or storage
- Outdated app versions
- Corrupted app data
- OS compatibility issues
- Hardware limitations

## Immediate Solutions
- Force close and restart the app
- Restart your device
- Clear app cache and data
- Update the app to latest version
- Free up storage space

## Advanced Troubleshooting
- Check app permissions
- Disable conflicting apps
- Boot in safe mode
- Reinstall the problematic app
- Factory reset as last resort

## Prevention Strategies
- Keep apps updated regularly
- Maintain adequate free storage
- Close unused background apps
- Regular device restarts
- Monitor app reviews before updating`,
      category: 'troubleshooting',
      tags: ['apps', 'crashes', 'freezing', 'stability'],
      readTime: 5,
      difficulty: 'beginner',
      trending: false
    },
    {
      id: '10',
      title: 'Camera and Photo Quality Optimization',
      summary: 'Enhance your device camera performance and photo quality',
      content: `# Camera Performance Guide

## Camera Settings Optimization
- Use highest resolution available
- Enable HDR for better dynamic range
- Adjust ISO settings manually
- Use grid lines for composition
- Enable image stabilization

## Cleaning and Maintenance
- Clean camera lens regularly
- Remove fingerprints and dust
- Use microfiber cloth only
- Avoid harsh chemicals
- Check for lens scratches

## Photo Quality Tips
- Ensure adequate lighting
- Hold device steady
- Use timer for group photos
- Avoid digital zoom when possible
- Shoot in RAW format if available

## Storage and Backup
- Enable automatic cloud backup
- Regularly transfer photos to computer
- Use high-quality compression
- Organize photos in albums
- Delete blurry or duplicate photos`,
      category: 'maintenance',
      tags: ['camera', 'photos', 'quality', 'optimization'],
      readTime: 4,
      difficulty: 'beginner',
      trending: false
    },
    {
      id: '11',
      title: 'Advanced Security and Privacy Settings',
      summary: 'Comprehensive guide to securing your device and protecting privacy',
      content: `# Complete Security Setup

## Essential Security Features
- Enable screen lock with strong password
- Set up biometric authentication
- Enable two-factor authentication
- Use encrypted messaging apps
- Regular security updates

## Privacy Protection
- Review app permissions regularly
- Disable location tracking for unnecessary apps
- Use VPN for public WiFi
- Enable private browsing mode
- Clear browsing data regularly

## Advanced Security Measures
- Enable remote wipe capability
- Use secure folder for sensitive files
- Install reputable antivirus software
- Enable app verification
- Use secure payment methods

## Data Protection
- Regular encrypted backups
- Use strong, unique passwords
- Enable automatic screen lock
- Avoid public charging stations
- Monitor account activity regularly`,
      category: 'security',
      tags: ['security', 'privacy', 'encryption', 'protection'],
      readTime: 8,
      difficulty: 'advanced',
      trending: true
    },
    {
      id: '12',
      title: 'Device Overheating Prevention and Solutions',
      summary: 'Keep your device cool and prevent thermal damage',
      content: `# Thermal Management Guide

## Common Overheating Causes
- Intensive gaming or video streaming
- Direct sunlight exposure
- Faulty charging cables
- Background app overload
- Hardware malfunction

## Immediate Cooling Steps
- Stop using the device temporarily
- Remove from direct heat sources
- Take off protective case
- Close unnecessary apps
- Turn off WiFi and Bluetooth

## Prevention Strategies
- Avoid using while charging
- Keep device in cool, ventilated areas
- Regular app updates
- Monitor CPU usage
- Use original chargers only

## Long-term Solutions
- Clean device vents regularly
- Limit intensive app usage
- Enable power saving mode
- Consider thermal management apps
- Professional inspection if persistent`,
      category: 'maintenance',
      tags: ['overheating', 'cooling', 'thermal', 'prevention'],
      readTime: 6,
      difficulty: 'intermediate',
      trending: false
    },
    {
      id: '13',
      title: 'Smartphone Audio and Speaker Issues',
      summary: 'Troubleshoot and fix common audio problems on your device',
      content: `# Audio Troubleshooting Guide

## Common Audio Problems
- No sound from speakers
- Distorted or crackling audio
- Low volume levels
- Microphone not working
- Headphone jack issues

## Quick Audio Fixes
- Check volume settings and mute status
- Clean speaker grilles and ports
- Restart audio services
- Test with different audio sources
- Check for software updates

## Speaker Maintenance
- Remove dust and debris regularly
- Avoid exposure to liquids
- Use compressed air carefully
- Test speaker balance
- Protect from physical damage

## Advanced Solutions
- Reset audio settings to default
- Clear audio app cache
- Check for conflicting apps
- Factory reset if necessary
- Professional repair consultation`,
      category: 'troubleshooting',
      tags: ['audio', 'speakers', 'microphone', 'sound'],
      readTime: 5,
      difficulty: 'beginner',
      trending: false
    },
    {
      id: '14',
      title: 'Data Backup and Recovery Strategies',
      summary: 'Comprehensive guide to protecting and recovering your important data',
      content: `# Complete Data Protection

## Backup Essentials
- Automatic cloud backups
- Local device backups
- External storage solutions
- Regular backup scheduling
- Backup verification

## Cloud Backup Services
- Google Drive for Android
- iCloud for iOS devices
- OneDrive integration
- Dropbox synchronization
- Third-party backup apps

## Data Recovery Methods
- Recent backups restoration
- Deleted file recovery
- Factory reset recovery
- Professional data recovery
- Partial data restoration

## Best Practices
- Multiple backup locations
- Regular backup testing
- Encrypted backup storage
- Important file prioritization
- Recovery plan documentation`,
      category: 'security',
      tags: ['backup', 'recovery', 'data', 'cloud'],
      readTime: 7,
      difficulty: 'intermediate',
      trending: true
    },
    {
      id: '15',
      title: 'Optimizing Device Performance for Gaming',
      summary: 'Maximize your device performance for the best gaming experience',
      content: `# Gaming Performance Optimization

## Performance Settings
- Enable high performance mode
- Close background applications
- Adjust graphics settings
- Disable unnecessary animations
- Free up RAM and storage

## Thermal Management
- Use cooling accessories
- Take regular breaks
- Avoid direct sunlight
- Remove device case while gaming
- Monitor temperature levels

## Network Optimization
- Use stable WiFi connection
- Enable gaming mode if available
- Close bandwidth-heavy apps
- Use wired connection when possible
- Optimize router settings

## Battery Considerations
- Gaming while plugged in
- Battery saver mode adjustments
- Monitor battery temperature
- Reduce screen brightness
- Disable haptic feedback`,
      category: 'performance',
      tags: ['gaming', 'performance', 'optimization', 'fps'],
      readTime: 6,
      difficulty: 'intermediate',
      trending: true
    },
    {
      id: '16',
      title: 'Screen Repair and Replacement Guide',
      summary: 'Everything you need to know about screen damage and repair options',
      content: `# Screen Repair Complete Guide

## Damage Assessment
- Surface scratches vs deep cracks
- Touch functionality testing
- Display quality evaluation
- Digitizer damage signs
- Frame and bezel inspection

## Temporary Solutions
- Screen protector application
- Clear tape for small cracks
- Avoiding pressure on damaged areas
- Data backup before repair
- Using external display options

## Repair Options
- Authorized service centers
- Third-party repair shops
- DIY repair kits
- Insurance claim process
- Warranty coverage check

## Prevention Strategies
- Quality screen protectors
- Protective cases with raised edges
- Careful handling practices
- Avoiding extreme temperatures
- Regular inspection for wear`,
      category: 'screen',
      tags: ['screen', 'repair', 'replacement', 'cracks'],
      readTime: 8,
      difficulty: 'advanced',
      trending: false
    },
    {
      id: '17',
      title: 'USB-C and Charging Port Maintenance',
      summary: 'Keep your charging ports clean and functional for reliable charging',
      content: `# Charging Port Care Guide

## Port Inspection
- Visual damage assessment
- Debris and lint removal
- Connector wear evaluation
- Pin alignment checking
- Corrosion detection

## Cleaning Procedures
- Power off device completely
- Use compressed air carefully
- Soft brush for stubborn debris
- Isopropyl alcohol for corrosion
- Avoid metal tools

## Common Port Issues
- Loose connection problems
- Slow charging speeds
- Intermittent charging
- Port not recognizing cables
- Physical damage signs

## Preventive Measures
- Use dust covers when possible
- Gentle cable insertion
- Regular cleaning schedule
- Quality cable usage
- Avoid forcing connections`,
      category: 'maintenance',
      tags: ['charging', 'usb-c', 'ports', 'maintenance'],
      readTime: 4,
      difficulty: 'beginner',
      trending: false
    },
    {
      id: '18',
      title: 'Mobile Hotspot and Tethering Setup',
      summary: 'Share your mobile internet connection with other devices effectively',
      content: `# Mobile Hotspot Mastery

## Hotspot Setup
- Enable mobile hotspot feature
- Configure network name and password
- Set data usage limits
- Choose security protocols
- Manage connected devices

## Performance Optimization
- Position device for best signal
- Limit number of connected devices
- Monitor data consumption
- Use 5GHz band when available
- Close unnecessary background apps

## Battery Management
- Keep device plugged in when possible
- Enable battery saver mode
- Reduce screen brightness
- Disable unused features
- Monitor temperature levels

## Troubleshooting
- Reset network settings
- Update carrier settings
- Check data plan limitations
- Restart hotspot feature
- Contact carrier support`,
      category: 'troubleshooting',
      tags: ['hotspot', 'tethering', 'internet', 'sharing'],
      readTime: 5,
      difficulty: 'intermediate',
      trending: false
    },
    {
      id: '19',
      title: 'Biometric Security Setup and Troubleshooting',
      summary: 'Configure and maintain fingerprint, face unlock, and other biometric features',
      content: `# Biometric Security Guide

## Fingerprint Setup
- Clean sensor before enrollment
- Register multiple finger angles
- Use different fingers for backup
- Regular sensor cleaning
- Re-enrollment if accuracy drops

## Face Recognition
- Proper lighting during setup
- Remove glasses if needed
- Multiple angle registration
- Update for appearance changes
- Backup authentication methods

## Voice Recognition
- Clear pronunciation during setup
- Quiet environment training
- Regular voice model updates
- Multiple phrase registration
- Noise cancellation settings

## Security Best Practices
- Combine multiple biometric methods
- Strong backup PIN/password
- Regular security updates
- Biometric data encryption
- Privacy settings review`,
      category: 'security',
      tags: ['biometric', 'fingerprint', 'face-unlock', 'security'],
      readTime: 6,
      difficulty: 'intermediate',
      trending: false
    },
    {
      id: '20',
      title: 'Device Accessibility Features and Setup',
      summary: 'Configure accessibility options to make your device easier to use',
      content: `# Accessibility Configuration

## Visual Accessibility
- Large text and font scaling
- High contrast display modes
- Color inversion and filters
- Screen reader setup
- Magnification gestures

## Motor Accessibility
- Touch accommodations
- Voice control setup
- Switch control configuration
- Gesture customization
- One-handed mode activation

## Hearing Accessibility
- Hearing aid compatibility
- Visual notification alerts
- Subtitle and caption settings
- Sound amplification
- Vibration pattern customization

## Cognitive Accessibility
- Simplified interface options
- Guided access modes
- Reminder and alert systems
- Voice assistant setup
- Easy mode configuration`,
      category: 'maintenance',
      tags: ['accessibility', 'features', 'setup', 'assistance'],
      readTime: 7,
      difficulty: 'beginner',
      trending: false
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
      case 'beginner': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'intermediate': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'advanced': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.id === category);
    const IconComponent = categoryData?.icon || BookOpen;
    return <IconComponent className="h-4 w-4" />;
  };

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-inter">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Button 
            onClick={() => setSelectedArticle(null)}
            variant="outline" 
            className="mb-8 font-medium hover:bg-blue-50 border-blue-200 text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Hub
          </Button>
          
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold mb-4 text-slate-900 leading-tight">
                    {selectedArticle.title}
                  </CardTitle>
                  <CardDescription className="text-lg text-slate-600 leading-relaxed">
                    {selectedArticle.summary}
                  </CardDescription>
                </div>
                {selectedArticle.trending && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 bg-blue-50 border-blue-200 text-blue-700">
                  {getCategoryIcon(selectedArticle.category)}
                  {selectedArticle.category}
                </Badge>
                <Badge className={`${getDifficultyColor(selectedArticle.difficulty)} font-medium px-3 py-1`}>
                  {selectedArticle.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-4 h-4" />
                  {selectedArticle.readTime} min read
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="prose max-w-none">
                <div className="formatted-content">
                  {selectedArticle.content.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-3xl font-bold mt-8 mb-6 text-slate-900 border-b-2 border-blue-200 pb-3">{line.substring(2)}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-2xl font-semibold mt-8 mb-4 text-slate-800">{line.substring(3)}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-xl font-medium mt-6 mb-3 text-slate-700">{line.substring(4)}</h3>;
                    }
                    
                    if (line.startsWith('- ')) {
                      return (
                        <div key={index} className="flex items-start gap-3 mb-3 ml-6">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-2.5 flex-shrink-0 shadow-sm"></div>
                          <span className="text-slate-700 leading-relaxed">{line.substring(2)}</span>
                        </div>
                      );
                    }
                    
                    if (/^\d+\. /.test(line)) {
                      const number = line.match(/^(\d+)\. /)?.[1];
                      const text = line.replace(/^\d+\. /, '');
                      return (
                        <div key={index} className="flex items-start gap-4 mb-3 ml-6">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 shadow-md font-medium">
                            {number}
                          </div>
                          <span className="text-slate-700 leading-relaxed">{text}</span>
                        </div>
                      );
                    }
                    
                    if (line.trim() === '') {
                      return <div key={index} className="h-4"></div>;
                    }
                    
                    return <p key={index} className="text-slate-700 mb-4 leading-relaxed text-base">{line}</p>;
                  })}
                </div>
              </div>
              
              <div className="mt-10 pt-8 border-t border-slate-200">
                <h4 className="font-semibold mb-4 text-slate-800 text-lg">Related Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border-0 px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-inter">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
            Knowledge Hub
          </h1>
          <p className="text-xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
            Expert tips and guides for device care and troubleshooting
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg mx-auto mb-10">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-base bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl transition-shadow"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200 ${
                  selectedCategory === category.id 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl' 
                    : 'bg-white/80 backdrop-blur-sm border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 shadow-md'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {category.name}
                <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-600 text-xs">
                  {category.count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Trending Section */}
        <Card className="mb-12 shadow-2xl border-0 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              Trending Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {knowledgeArticles.filter(article => article.trending).map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="p-6 bg-white/90 backdrop-blur-sm rounded-xl border border-white/50 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
                      <Star className="w-3 h-3 mr-1" />
                      Hot
                    </Badge>
                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                      <Clock className="w-3 h-3" />
                      {article.readTime}m
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-3 text-slate-900 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-slate-600 mb-4 leading-relaxed">{article.summary}</p>
                  <Badge className={`${getDifficultyColor(article.difficulty)} font-medium`}>
                    {article.difficulty}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 border-0 shadow-xl bg-white/90 backdrop-blur-sm group overflow-hidden"
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 font-medium px-3 py-1"
                  >
                    {getCategoryIcon(article.category)}
                    {article.category}
                  </Badge>
                  {article.trending && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Hot
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors mb-3">
                  {article.title}
                </CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  {article.summary}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`${getDifficultyColor(article.difficulty)} font-medium px-3 py-1`}>
                    {article.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1 text-slate-500 text-sm">
                    <Clock className="w-3 h-3" />
                    {article.readTime} min read
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {article.tags.slice(0, 3).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-blue-100 text-blue-700 border-0"
                    >
                      +{article.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <BookOpen className="h-16 w-16 mx-auto mb-6 text-slate-400" />
              <p className="text-slate-500 text-lg mb-2">No articles found matching your search</p>
              <p className="text-slate-400">Try different keywords or browse all categories</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default KnowledgeHub;