
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, Bot, User, Mic, MicOff, Volume2, VolumeX, ThumbsUp, ThumbsDown, Smartphone, Zap, Shield, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  feedback?: 'positive' | 'negative' | null;
  deviceInfo?: {
    type: string;
    brand: string;
    model?: string;
    issue?: string;
  };
  quickActions?: string[];
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your AI gadget doctor. I can help with Samsung, iPhone, Infinix, and other device issues. I can also provide safety tips and optimization tricks. What's troubling your device today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect user's device information
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      
      let deviceType = 'Unknown';
      let brand = 'Unknown';
      
      // Device type detection
      if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        if (/iPad/i.test(userAgent)) {
          deviceType = 'Tablet';
          brand = 'Apple';
        } else if (/iPhone/i.test(userAgent)) {
          deviceType = 'Smartphone';
          brand = 'Apple';
        } else if (/Android/i.test(userAgent)) {
          deviceType = screenWidth > 768 ? 'Tablet' : 'Smartphone';
          if (/Samsung/i.test(userAgent)) brand = 'Samsung';
          else if (/Huawei/i.test(userAgent)) brand = 'Huawei';
          else if (/Xiaomi/i.test(userAgent)) brand = 'Xiaomi';
          else brand = 'Android';
        }
      } else {
        deviceType = 'Computer';
        if (/Mac/i.test(platform)) brand = 'Apple';
        else if (/Win/i.test(platform)) brand = 'Windows';
        else if (/Linux/i.test(platform)) brand = 'Linux';
      }
      
      setDeviceInfo({
        type: deviceType,
        brand,
        userAgent,
        screenResolution: `${screenWidth}x${screenHeight}`,
        platform
      });
    };
    
    detectDevice();
    
    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Create chat session
    const createSession = async () => {
      try {
        await supabase.from('chat_sessions').insert({
          session_id: sessionId
        });
      } catch (error) {
        console.error('Error creating session:', error);
      }
    };
    createSession();
  }, [sessionId]);

  const storeMessage = async (message: string, isUser: boolean) => {
    try {
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        message,
        is_user: isUser
      });
    } catch (error) {
      console.error('Error storing message:', error);
    }
  };

  const generateAIResponse = async (userInput: string): Promise<string> => {
    // Check if offline and use cached responses
    if (!navigator.onLine) {
      const cachedResponse = getCachedResponse(userInput);
      if (cachedResponse) {
        return cachedResponse;
      }
      // Continue with offline knowledge base below
    }
    
    try {
      // Use Lovable AI Gateway via edge function
      const { data, error } = await supabase.functions.invoke('openrouter-ai', {
        body: {
          prompt: userInput,
          model: 'google/gemini-2.5-flash',
          systemPrompt: `You are an expert AI gadget doctor specializing in diagnosing and fixing electronic devices. 
          You have extensive knowledge about Samsung, iPhone, Infinix, and other popular device brands.
          
          Your expertise includes:
          - Hardware diagnostics and repair
          - Software troubleshooting 
          - Battery optimization
          - Performance tuning
          - Safety protocols for device repair
          - Brand-specific issues and solutions
          
          Current user device: ${deviceInfo?.brand || 'Unknown'} ${deviceInfo?.type || 'Unknown'} (${deviceInfo?.screenResolution || 'Unknown'})
          
          Always provide practical, safe, and actionable advice. If something is dangerous (like swollen batteries or water damage), emphasize safety first. Be concise but thorough. Use emojis sparingly for clarity.`
        }
      });

      if (!error && data?.response) {
        cacheResponse(userInput, data.response);
        return data.response;
      }
      
      // Handle rate limit / credit errors
      if (data?.error) {
        console.warn('AI Gateway error:', data.error);
        toast.error(data.error);
      }
    } catch (error) {
      console.error('AI API error:', error);
    }
    
    // Fallback to offline knowledge base
    const response = generateOfflineResponse(userInput);
    cacheResponse(userInput, response);
    return response;
  };
  
  const getCachedResponse = (input: string): string | null => {
    try {
      const cached = localStorage.getItem('aiChatCache');
      if (cached) {
        const cache = JSON.parse(cached);
        const key = input.toLowerCase().trim();
        return cache[key] || null;
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  };
  
  const cacheResponse = (input: string, response: string) => {
    try {
      const cached = localStorage.getItem('aiChatCache') || '{}';
      const cache = JSON.parse(cached);
      const key = input.toLowerCase().trim();
      cache[key] = response;
      
      // Limit cache size to prevent storage issues
      const keys = Object.keys(cache);
      if (keys.length > 100) {
        delete cache[keys[0]];
      }
      
      localStorage.setItem('aiChatCache', JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching response:', error);
    }
  };
  
  const generateOfflineResponse = (userInput: string): string => {

    const input = userInput.toLowerCase();
    const currentDevice = deviceInfo?.brand?.toLowerCase() || '';
    const deviceType = deviceInfo?.type?.toLowerCase() || '';
    
    // Handle casual greetings and conversations
    if (input.includes('hello') || input.includes('hi') || input.includes('hey') || input.includes('good morning') || input.includes('good afternoon') || input.includes('good evening')) {
      const greetings = [
        `Hello! 👋 I'm your AI gadget doctor. I can help fix issues with your ${deviceInfo?.brand || ''} ${deviceInfo?.type || 'device'}.`,
        `Hey there! 😊 Ready to solve some tech problems? I specialize in ${deviceInfo?.brand || 'all'} devices.`,
        `Hi! 🔧 I'm here to help with any device issues you're having. What's troubling your gadget today?`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    if (input.includes('how are you') || input.includes('how do you do')) {
      return `I'm doing great! 🤖 Ready to help diagnose and fix any issues with your ${deviceInfo?.brand || ''} ${deviceInfo?.type || 'device'}. What can I help you with today?`;
    }
    
    if (input.includes('thank') || input.includes('thanks')) {
      return `You're welcome! 😊 Happy to help! If you have any other device issues, just ask. I'm here 24/7 to keep your gadgets running smoothly! 🔧`;
    }
    
    if (input.includes('bye') || input.includes('goodbye') || input.includes('see you')) {
      return `Goodbye! 👋 Remember, I'm always here when you need tech support. Keep your devices safe and running smooth! 🛡️`;
    }
    
    // Electrical fault detection and safety
    if (input.includes('electrical') || input.includes('electric') || input.includes('power') || input.includes('voltage') || input.includes('current') || input.includes('short circuit')) {
      if (input.includes('fault') || input.includes('problem') || input.includes('issue') || input.includes('failure')) {
        return `⚡ **ELECTRICAL FAULT DETECTION** ⚡

🚨 **Immediate Safety Signs:**
• Device gets extremely hot during charging
• Sparks, smoke, or burning smell
• Charging port feels loose or damaged
• Battery swelling or bulging
• Electrical shocks when touching device

🔍 **Common Electrical Faults:**
• **Battery degradation** - Voltage drops, inconsistent charging
• **Power regulation failure** - Device shuts down randomly
• **Current leakage** - Excessive heat, fast battery drain
• **Charging circuit failure** - Won't charge or charges very slowly
• **Short circuits** - Device won't turn on, blown fuses

🛡️ **SAFETY PROTOCOL:**
1. **STOP using device immediately** if you notice any danger signs
2. Unplug from power source
3. Move to safe, ventilated area
4. Do NOT attempt DIY repair on electrical faults
5. Seek professional help immediately

🔧 **Professional diagnosis recommended** for electrical issues. What specific symptoms are you experiencing?`;
      } else if (input.includes('safe') || input.includes('prevent') || input.includes('avoid')) {
        return `⚡ **ELECTRICAL SAFETY GUIDE** 🛡️

🔋 **Charging Safety:**
• Use only original or certified chargers
• Avoid charging overnight unattended
• Don't charge on soft surfaces (beds, couches)
• Unplug when device gets hot
• Replace damaged cables immediately

🔍 **Early Warning Signs:**
• Unusual heat during normal use
• Battery drains faster than normal
• Device restarts randomly
• Charging takes much longer
• Strange noises from device

🧹 **Preventive Maintenance:**
• Keep charging ports clean and dry
• Avoid extreme temperatures
• Don't overcharge (unplug at 100%)
• Regular software updates
• Professional inspection yearly

⚠️ **Never ignore electrical symptoms** - they can lead to fire or injury!`;
      }
    }
    
    // Computer safety and maintenance questions
    if ((input.includes('safe') || input.includes('protect') || input.includes('security') || input.includes('maintain')) && (input.includes('computer') || input.includes('pc') || input.includes('laptop') || deviceType.includes('computer'))) {
      return `Great question! 🛡️ Here's how to keep your Windows computer safe and running smoothly:

🔒 **Security Essentials:**
• Keep Windows updated (Settings > Update & Security)
• Use Windows Defender or reliable antivirus
• Enable Windows Firewall
• Don't click suspicious links or download unknown files

🧹 **Regular Maintenance:**
• Restart weekly to clear memory
• Run Disk Cleanup monthly (search "Disk Cleanup")
• Keep 15% of storage free
• Update drivers via Device Manager

⚡ **Performance Tips:**
• Disable startup programs you don't need
• Use Task Manager to check what's using resources
• Clean dust from vents every 3-6 months
• Don't install too many programs

🔄 **Backup Important Data:**
• Use OneDrive or external drive
• Create system restore points

What specific area would you like me to explain more? 🤔`;
    }
    
    // General safety questions
    if (input.includes('safe') || input.includes('protect') || input.includes('security') || input.includes('maintain')) {
      if (deviceType.includes('smartphone') || deviceType.includes('tablet')) {
        return `Here's how to keep your ${deviceInfo?.brand || ''} ${deviceType} safe! 📱🛡️

🔒 **Security:**
• Use screen lock (PIN, pattern, fingerprint)
• Keep OS updated
• Only install apps from official stores
• Enable Find My Device/Find My iPhone

🔋 **Battery Care:**
• Charge between 20-80% when possible
• Avoid extreme temperatures
• Use original chargers

🧹 **Maintenance:**
• Restart weekly
• Clear cache monthly
• Keep storage under 85% full
• Clean screen and ports gently

Need specific help with any of these? 😊`;
      }
    }
    
    // Real diagnostic knowledge base with specific technical solutions
    const knowledgeBase = {
      // Battery Issues - Technical Solutions
      battery: {
        samsung: {
          'draining_fast': 'Samsung battery optimization: Go to Settings > Device care > Battery > More battery settings > Adaptive battery (ON). Enable "Put unused apps to sleep" and "Auto-disable unused apps". Check Settings > Apps > Show system apps > find "Android System" and "Android OS" - if using >20% each, factory reset needed. For Galaxy S20+: Disable 5G if not needed (Settings > Connections > Mobile networks > Network mode > LTE). Use Bixby Routines to auto-enable power saving at low battery.',
          'not_charging': 'Samsung charging issues: 1) Clean USB-C port with compressed air and soft brush, 2) Try different cable (Samsung original recommended), 3) Enable "Fast charging" in Settings > Device care > Battery > Charging, 4) Check for moisture detection (Settings > Battery > More battery settings > Wireless PowerShare should be available if no moisture), 5) Boot into Safe mode - if charges normally, uninstall recent apps, 6) If wireless charging works but wired doesn\'t = port replacement needed ($80-120).'
        },
        apple: {
          'draining_fast': 'iPhone battery optimization: Settings > Battery > Battery Health - if <80% capacity, replacement needed. Check Battery Usage by App - if "Background App Refresh" apps using >20%, disable in Settings > General > Background App Refresh. Enable "Optimized Battery Charging" and "Low Power Mode". For iOS 15+: Settings > Focus > Do Not Disturb > Turn on automatically. Disable "Hey Siri" if not used. Location Services > System Services > disable "iPhone Analytics", "Popular Near Me", "Routing & Traffic".',
          'not_charging': 'iPhone charging troubleshooting: 1) Clean Lightning/USB-C port with wooden toothpick (NOT metal), 2) Try different Apple-certified cable, 3) Force restart (iPhone 8+: Volume Up, Volume Down, hold Power), 4) Check for iOS updates, 5) If MagSafe: remove case and ensure proper alignment, 6) DFU mode restore if software issue suspected, 7) If nothing works = charging port replacement needed ($100-200 depending on model).'
        }
      },
      
      // Performance Issues - Real Solutions
      performance: {
        android: {
          'slow_general': 'Android performance optimization: 1) Settings > Storage > Free up space (keep >15% free), 2) Settings > Apps > Show all apps > sort by "Last used" > Force stop apps not used in weeks, 3) Developer options > Animation scale > 0.5x (all 3 settings), 4) Settings > Device care/Maintenance > Memory > Clean now, 5) Uninstall Facebook app (use browser version - saves 500MB+ RAM), 6) Disable live wallpapers, 7) Settings > Accessibility > Remove animations > ON.',
          'lag_specific': 'Android lag diagnosis: Check Settings > Developer options > GPU rendering profile > On screen as bars. If bars consistently above green line during lag = GPU overload (reduce resolution/refresh rate). If RAM usage >85% consistently = need more RAM or factory reset. Thermal throttling if device hot during lag = cooling needed.'
        },
        ios: {
          'slow_general': 'iPhone performance: Settings > General > iPhone Storage > Offload Unused Apps (ON). Settings > General > Background App Refresh > OFF for non-essential apps. Settings > Privacy & Security > Analytics & Improvements > Share iPhone Analytics (OFF). Reduce Motion (ON) in Accessibility. For older iPhones: Settings > Battery > Battery Health - if "Peak Performance Capability" shows throttling, battery replacement will restore full speed.',
          'specific_apps': 'iOS app-specific slowness: Double-tap home button > swipe up on problematic apps to force close. Settings > General > iPhone Storage > tap app > Offload App (keeps data) or Delete App. Clear Safari cache: Settings > Safari > Clear History and Website Data. For persistent issues: Settings > General > Transfer or Reset iPhone > Reset > Reset All Settings (keeps data).'
        }
      },
      
      // Screen Issues - Technical Diagnostics
      screen: {
        'touch_unresponsive': 'Touch screen diagnosis: 1) Clean with 70% isopropyl alcohol on microfiber cloth, 2) Remove screen protector and test, 3) Force restart device, 4) Test in Safe Mode (Android) or after force restart (iOS), 5) Check for software updates, 6) Hardware test: Settings > Support > Samsung Members > Get help > Interactive checks > Touch screen (Samsung) or Settings > General > About > Diagnostics (iPhone with Apple Support app). If hardware test fails = digitizer replacement needed ($150-300).',
        'flickering': 'Screen flickering solutions: 1) Adjust refresh rate (Android: Settings > Display > Motion smoothness), 2) Disable adaptive brightness temporarily, 3) Check if occurs in specific apps (app issue) or system-wide (hardware), 4) Boot into Safe Mode - if flickering stops = third-party app causing issue, 5) For OLED screens: avoid static images, use dark mode, 6) If flickering with green/pink lines = panel failure, replacement needed ($200-400).',
        'dead_pixels': 'Dead pixel solutions: 1) Pixel fixing apps (PixelHealer, Dead Pixels Test), 2) Gentle pressure with soft cloth while running pixel test, 3) Temperature method: cool device in fridge 10min, then warm to room temp, 4) For stuck pixels (colored): display pure colors (red, green, blue) for 30min each, 5) Manufacturing defect if <6 months old = warranty replacement, 6) Multiple dead pixels = panel replacement needed.'
      },
      
      // Overheating - Safety-First Solutions
      overheating: {
        'immediate_action': '🚨 OVERHEATING PROTOCOL: 1) STOP using device immediately, 2) Turn OFF completely, 3) Remove from charger and case, 4) Place in cool, dry area (NOT refrigerator), 5) Wait 30+ minutes before turning on, 6) Check charger for damage/overheating, 7) If device is too hot to touch = potential battery swelling (DANGEROUS - seek immediate professional help).',
        'prevention': 'Overheating prevention: 1) Close background apps regularly, 2) Avoid using while charging, 3) Keep out of direct sunlight, 4) Remove case during intensive tasks, 5) Lower screen brightness, 6) Disable unnecessary features (GPS, Bluetooth, 5G), 7) Update software regularly, 8) Clean charging port monthly, 9) Use original chargers only.',
        'gaming_overheating': 'Gaming overheating solutions: Enable performance mode with thermal limits: Samsung Game Booster > Advanced game features > Thermal guardian. iPhone: Settings > Battery > Low Power Mode during gaming. Use external cooling fan for extended sessions. Reduce graphics settings in games. Take 15min breaks every hour.'
      }
    };
    
    // Smart knowledge base lookup
    const findSolution = (category: string, subcategory: string, brand?: string) => {
      const solutions = knowledgeBase[category as keyof typeof knowledgeBase];
      if (!solutions) return null;
      
      if (brand && solutions[brand as keyof typeof solutions]) {
        const brandSolutions = solutions[brand as keyof typeof solutions] as any;
        return brandSolutions[subcategory] || null;
      }
      
      // Fallback to general solutions
      const generalSolutions = solutions[subcategory as keyof typeof solutions];
      return generalSolutions || null;
    };
    
    // INTELLIGENT SOLUTION MATCHING - Real technical responses
    
    // Battery Issues
    if (input.includes('battery')) {
      if (input.includes('drain') || input.includes('fast') || input.includes('quick')) {
        const solution = findSolution('battery', 'draining_fast', currentDevice);
        if (solution) return solution;
      } else if (input.includes('charg') || input.includes('not charg') || input.includes('won\'t charge')) {
        const solution = findSolution('battery', 'not_charging', currentDevice);
        if (solution) return solution;
      }
    }
    
    // Performance Issues  
    if (input.includes('slow') || input.includes('lag') || input.includes('freeze') || input.includes('hang')) {
      const deviceOS = currentDevice === 'apple' ? 'ios' : 'android';
      if (input.includes('app') || input.includes('specific')) {
        const solution = findSolution('performance', 'specific_apps', deviceOS);
        if (solution) return solution;
      } else {
        const solution = findSolution('performance', 'slow_general', deviceOS);
        if (solution) return solution;
      }
    }
    
    // Screen Issues
    if (input.includes('screen') || input.includes('display') || input.includes('touch')) {
      if (input.includes('touch') || input.includes('unresponsive') || input.includes('not working')) {
        return findSolution('screen', 'touch_unresponsive') || knowledgeBase.screen.touch_unresponsive;
      } else if (input.includes('flicker') || input.includes('blink')) {
        return findSolution('screen', 'flickering') || knowledgeBase.screen.flickering;
      } else if (input.includes('dead') || input.includes('pixel') || input.includes('dot')) {
        return findSolution('screen', 'dead_pixels') || knowledgeBase.screen.dead_pixels;
      }
    }
    
    // Overheating - Critical Safety
    if (input.includes('hot') || input.includes('heat') || input.includes('overheat') || input.includes('warm')) {
      if (input.includes('gaming') || input.includes('game')) {
        return knowledgeBase.overheating.gaming_overheating;
      } else if (input.includes('prevent') || input.includes('avoid')) {
        return knowledgeBase.overheating.prevention;
      } else {
        return knowledgeBase.overheating.immediate_action;
      }
    }
    
    // Brand-specific advanced solutions
    if (currentDevice === 'samsung' || input.includes('samsung')) {
      if (input.includes('knox') || input.includes('secure folder')) {
        return "Samsung Knox/Secure Folder: If Knox triggered by root attempt, warranty void and Samsung Pay disabled permanently. Secure Folder issues: Settings > Biometrics and security > Secure Folder > More options > Settings > Reset Secure Folder. For Knox 0x1 status, device needs motherboard replacement (not economical).";
      } else if (input.includes('bixby')) {
        return "Samsung Bixby optimization: Disable Bixby Voice: Settings > Apps > Bixby Voice > Disable. Remap Bixby button: Download 'Button Mapper' app or use Samsung's built-in remapping in Settings > Advanced features > Side key. For Bixby Routines (useful): Settings > Advanced features > Bixby Routines - create automation for battery saving, Do Not Disturb, etc.";
      }
    } else if (currentDevice === 'apple' || input.includes('iphone') || input.includes('ios')) {
      if (input.includes('face id') || input.includes('touch id')) {
        return "iPhone biometric issues: Face ID: Settings > Face ID & Passcode > Reset Face ID, ensure clean TrueDepth camera, avoid direct sunlight. Touch ID: Settings > Touch ID & Passcode > Delete all fingerprints > re-add with clean, dry fingers. If hardware failure: Face ID repair $200-400, Touch ID repair $100-200. Water damage often causes permanent biometric failure.";
      } else if (input.includes('storage') || input.includes('other')) {
        return "iPhone 'Other' storage cleanup: Settings > General > iPhone Storage > System Data (was 'Other'). Solutions: 1) Restart device, 2) Update iOS, 3) Sync with iTunes/Finder to clear cache, 4) Settings > Messages > Keep Messages > 30 Days, 5) Clear Safari cache, 6) Delete and reinstall large apps, 7) Last resort: DFU restore (erases everything).";
      }
    }
    
    // Additional brand-specific solutions
    if (input.includes('infinix')) {
      return "Infinix devices (XOS): Common issues include bloatware slowing performance. Go to Settings > Apps > disable unnecessary Infinix apps. For battery, use Ultra Power Saving mode. Keep XOS updated through System Update. Infinix phones benefit from regular restarts due to aggressive background management.";
    } else if (input.includes('xiaomi') || input.includes('redmi') || input.includes('miui')) {
      return "Xiaomi/MIUI optimization: Disable MIUI Optimization in Developer Options for better app compatibility. Turn off ads in Settings > Privacy > Ad services. Use Security app's cleaner regularly. For battery, enable Ultra battery saver. MIUI can be aggressive with background apps - whitelist important apps in Battery settings.";
    } else if (input.includes('huawei') || input.includes('honor') || input.includes('emui')) {
      return "Huawei/EMUI tips: Enable Performance mode in Settings > Battery. Disable Power Genie for apps you want running in background. Use Phone Manager for optimization. For newer devices without Google services, use AppGallery and Petal Search for apps.";
    }

    // Specific computer issues
    if (deviceType.includes('computer') && (input.includes('slow') || input.includes('lag') || input.includes('freeze'))) {
      return `Windows computer running slow? Let's fix that! ⚡

🔍 **Quick Fixes:**
1. Restart your computer (fixes 70% of slowdowns)
2. Check Task Manager (Ctrl+Shift+Esc) for high CPU/memory usage
3. Run Disk Cleanup to free space
4. Disable startup programs you don't need

🧹 **Deep Clean:**
• Update Windows and drivers
• Run Windows Defender scan
• Clear browser cache and temp files
• Uninstall unused programs

🌡️ **Check Temperature:**
• Clean dust from vents with compressed air
• Ensure good ventilation
• Check if laptop is overheating

Try the restart first - it often works like magic! ✨ Need help with any specific step?`;
    }
    
    // General responses
    if (input.includes('overheating') || input.includes('hot')) {
      return "🔥 OVERHEATING ALERT: Stop using immediately! Cool down steps: 1) Turn off device, 2) Remove case/charger, 3) Place in cool area (NOT freezer), 4) Check for damaged charger, 5) Close all apps when restarting. If persistent, hardware issue likely - avoid further use and seek repair.";
    } else if (input.includes('slow') || input.includes('lag')) {
      return "⚡ Performance boost: 1) Restart device (fixes 60% of slowdowns), 2) Clear cache (Android: Settings > Storage), 3) Free up storage (keep 15% free), 4) Update apps and OS, 5) Disable animations in Developer options (Android), 6) Check for malware. If still slow, hardware may be aging.";
    } else if (input.includes('battery') || input.includes('charge')) {
      return "🔋 Battery optimization: 1) Charge between 20-80% when possible, 2) Use original charger, 3) Avoid overnight charging, 4) Enable battery optimization settings, 5) Reduce screen brightness, 6) Turn off location when not needed. If battery drains fast suddenly, check for rogue apps in battery usage stats.";
    } else if (input.includes('screen') || input.includes('display') || input.includes('touch') || input.includes('touching')) {
      if (input.includes('touch') || input.includes('touching') || input.includes('responsive') || input.includes('unresponsive')) {
        return "👆 Touch screen issues: 1) Clean screen with microfiber cloth, 2) Remove screen protector if present, 3) Restart device, 4) Check for software updates, 5) Calibrate touch (Android: Settings > Display > Touch), 6) If ghost touches occur - factory reset may be needed. For iPhone: Settings > General > Reset > Reset All Settings.";
      } else if (input.includes('crack') || input.includes('broken') || input.includes('shatter')) {
        return "💔 Screen damage: Avoid using cracked screens as they can cause injury. Use screen protector immediately. Professional repair needed for digitizer damage. Cost: $100-300 depending on device. iPhone screens are expensive to replace.";
      } else if (input.includes('flicker') || input.includes('blink')) {
        return "✨ Screen flickering: 1) Adjust brightness/auto-brightness, 2) Check refresh rate settings, 3) Update display drivers, 4) Hardware issue if persistent. For AMOLED screens (Samsung/iPhone), this can indicate panel failure.";
      } else {
        return "📱 Screen issues: For flickering - restart and check auto-brightness. For cracks - avoid pressure, use screen protector immediately. For dead pixels - try pixel fixing apps. For touch issues - clean screen, restart, check for screen protector bubbles. Severe damage needs professional repair.";
      }
    } else if (input.includes('water') || input.includes('wet') || input.includes('liquid')) {
      return "💧 WATER DAMAGE PROTOCOL: 1) Turn off IMMEDIATELY, 2) Remove battery if possible, 3) Dry externally, 4) Place in rice/silica gel for 48+ hours, 5) DO NOT use rice if ports are damaged, 6) DO NOT turn on early. Success depends on quick action and water type (saltwater is worse).";
    } else if (input.includes('storage') || input.includes('space') || input.includes('memory')) {
      return "💾 Storage cleanup: 1) Delete photos/videos (backup to cloud first), 2) Clear app caches, 3) Uninstall unused apps, 4) Move apps to SD card (Android), 5) Use storage optimization tools built into your OS. Keep 15% free for optimal performance.";
    } else if (input.includes('misbehav') || input.includes('weird') || input.includes('strange') || input.includes('acting up')) {
      return "🤔 Device misbehaving: 1) Restart device (solves 70% of issues), 2) Check for app conflicts (uninstall recently installed apps), 3) Clear cache and data, 4) Check system updates, 5) Run antivirus scan, 6) Factory reset if nothing works. Keep device cool and avoid extreme temperatures.";
    } else if (input.includes('freeze') || input.includes('hang') || input.includes('stuck')) {
      return "🧊 Device freezing: 1) Force restart (Android: hold power 10s, iPhone: volume up + power), 2) Close all apps, 3) Free up RAM, 4) Check for overheating, 5) Update software, 6) Hardware issue if frequent. Avoid running too many apps simultaneously.";
    } else {
      // Default response with device context
      const deviceSpecific = deviceInfo ? `I can see you're using a ${deviceInfo.brand} ${deviceInfo.type}. ` : '';
      
      if (deviceType.includes('computer')) {
        return `${deviceSpecific}I'm your AI computer doctor! 💻🩺 I can help with:

🛡️ Security & safety tips
⚡ Performance & speed issues
🌡️ Overheating problems
💾 Storage & memory issues
🔧 Hardware diagnostics
🧹 Maintenance & optimization

Just ask me things like:
• "How to keep my computer safe?"
• "My PC is running slow"
• "Computer gets too hot"
• "How to clean up storage?"

What can I help you with today? 🤔`;
      } else {
        return `${deviceSpecific}I'm your AI gadget doctor! 🩺 I can help with:

🔋 Battery & charging problems
🌡️ Overheating issues  
📱 Screen & touch problems
⚡ Performance & speed issues
💾 Storage & memory problems
🔧 Hardware diagnostics

Just describe your problem in simple terms like:
• "My phone battery dies quickly"
• "Screen is flickering"
• "Device gets very hot"
• "Phone is running slow"

What's going on with your device? 🤔`;
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await storeMessage(inputText, true);
    setInputText('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(inputText);
      // Generate quick action suggestions based on the response
      const quickActions = generateQuickActions(inputText, aiResponse);
      
      const aiMessage: Message = {
        id: messages.length + 2,
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        quickActions
      };
      setMessages(prev => [...prev, aiMessage]);
      await storeMessage(aiResponse, false);
      setIsTyping(false);
    }, 1500); // Faster response for better UX
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        // Convert to text using Web Speech API
        if ('webkitSpeechRecognition' in window) {
          const recognition = new (window as any).webkitSpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
            toast.success('Voice converted to text!');
          };

          recognition.onerror = () => {
            toast.error('Voice recognition failed. Please try again.');
          };

          recognition.start();
        } else {
          toast.error('Voice recognition not supported in this browser.');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      toast.success('Recording started...');
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success('Recording stopped. Converting to text...');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        // Stop speaking
        speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        // Start speaking
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        speechSynthesis.speak(utterance);
      }
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
  };

  const generateQuickActions = (userInput: string, aiResponse: string): string[] => {
    const input = userInput.toLowerCase();
    const actions: string[] = [];
    
    if (input.includes('battery')) {
      actions.push('Check battery health', 'Enable power saving mode', 'Close background apps');
    } else if (input.includes('slow') || input.includes('lag')) {
      actions.push('Restart device', 'Clear cache', 'Free up storage');
    } else if (input.includes('overheating')) {
      actions.push('Cool down device', 'Close all apps', 'Remove case');
    } else if (input.includes('screen') || input.includes('touch')) {
      actions.push('Clean screen', 'Restart device', 'Check screen protector');
    } else if (input.includes('storage') || input.includes('space')) {
      actions.push('Delete photos', 'Clear app data', 'Move to cloud');
    }
    
    return actions.slice(0, 3); // Limit to 3 actions
  };

  const handleQuickAction = (action: string) => {
    setInputText(action);
    handleSendMessage();
  };

  const submitFeedback = async (messageId: number, helpful: boolean, userInput?: string) => {
    try {
      // Find the AI response for this message
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      await supabase.from('ai_feedback').insert({
        diagnosis_id: messageId.toString(),
        feature_used: 'ai_chat',
        feedback_type: 'response_rating',
        helpful,
        ai_response_data: {
          user_input: userInput,
          ai_response: message.text,
          session_id: sessionId
        }
      });

      // Update local state to show feedback was submitted
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, feedback: helpful ? 'positive' : 'negative' }
          : m
      ));

      toast.success('Thanks for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Device Info Header */}
      {deviceInfo && (
        <Card className="p-3 bg-primary/10 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Detected: {deviceInfo.brand} {deviceInfo.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  Resolution: {deviceInfo.screenResolution}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                {isOnline ? "🟢 Online" : "🔴 Offline"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                AI Ready
              </Badge>
            </div>
          </div>
        </Card>
      )}
      
      {/* Chat Container */}
      <div className="h-96 flex flex-col border border-border rounded-lg bg-card shadow-sm">
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/30">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.isUser ? 'bg-primary' : 'bg-accent'
            }`}>
              {message.isUser ? (
                <User className="h-4 w-4 text-primary-foreground" />
              ) : (
                <Bot className="h-4 w-4 text-accent-foreground" />
              )}
            </div>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
              message.isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-card-foreground border border-border'
            }`}>
              <div className="text-sm whitespace-pre-line">{message.text}</div>
              {!message.isUser && (
                <Button
                  onClick={() => speakText(message.text)}
                  size="sm"
                  variant="ghost"
                  className={`absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isSpeaking ? 'bg-red-100 hover:bg-red-200' : ''
                  }`}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-3 w-3 text-red-600" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            {!message.isUser && message.feedback === undefined && (
              <div className="flex gap-1 mt-1 ml-12">
                <Button
                  onClick={() => submitFeedback(message.id, true, messages.find(m => m.id === message.id - 1)?.text)}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Good
                </Button>
                <Button
                  onClick={() => submitFeedback(message.id, false, messages.find(m => m.id === message.id - 1)?.text)}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Poor
                </Button>
              </div>
            )}
            {!message.isUser && message.feedback && (
              <div className="flex gap-1 mt-1 ml-12">
                <span className={`text-xs px-2 py-1 rounded ${
                  message.feedback === 'positive'
                    ? 'text-green-600 bg-green-50'
                    : 'text-red-600 bg-red-50'
                }`}>
                  {message.feedback === 'positive' ? '👍 Helpful' : '👎 Not helpful'}
                </span>
              </div>
            )}
            
            {/* Quick Actions */}
            {!message.isUser && message.quickActions && message.quickActions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-12">
                {message.quickActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about device issues, safety tips, or optimizations..."
          className="flex-1"
        />
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputText.trim() || isTyping}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2 mt-2">
            {['Battery draining fast', 'Device overheating', 'Screen not responding', 'Storage full'].map((suggestion) => (
              <Button
                key={suggestion}
                onClick={() => setInputText(suggestion)}
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
