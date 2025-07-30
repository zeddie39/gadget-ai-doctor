
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Bot, User, Mic, MicOff, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
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
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // Check if we have OpenRouter API key for real AI responses
    if (openrouterApiKey) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'AI Gadget Doctor'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert AI gadget doctor specializing in diagnosing and fixing electronic devices. 
                You have extensive knowledge about Samsung, iPhone, Infinix, and other popular device brands.
                
                Your expertise includes:
                - Hardware diagnostics and repair
                - Software troubleshooting 
                - Battery optimization
                - Performance tuning
                - Safety protocols for device repair
                - Brand-specific issues and solutions
                
                Always provide practical, safe, and actionable advice. If something is dangerous (like swollen batteries or water damage), emphasize safety first. Be concise but thorough.`
              },
              {
                role: 'user',
                content: userInput
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('AI response failed:', error);
        toast.error('AI response failed, using fallback mode');
        // Fall back to hardcoded responses
      }
    }

    // Fallback to hardcoded responses when no API key
    const input = userInput.toLowerCase();
    
    // Brand-specific responses
    if (input.includes('samsung')) {
      if (input.includes('overheating')) {
        return "Samsung devices can overheat due to intensive apps or poor ventilation. Try: 1) Close background apps using the recent apps button, 2) Remove the case temporarily, 3) Avoid using while charging, 4) Check for software updates in Settings > Software update. If it's a Galaxy S series, ensure Game Booster isn't running unnecessarily.";
      } else if (input.includes('battery')) {
        return "Samsung battery optimization: Enable Adaptive Battery in Settings > Battery > More battery settings. Use Protect Battery to limit charging to 85%. For older Galaxy devices, consider replacing the battery if it's swollen or lasting less than 4 hours of use.";
      }
    } else if (input.includes('iphone') || input.includes('ios')) {
      if (input.includes('battery')) {
        return "iPhone battery tips: Check Battery Health in Settings > Battery > Battery Health & Charging. If below 80%, consider replacement. Enable Optimized Battery Charging. For older iPhones, Low Power Mode helps extend usage. Avoid wireless charging if the phone gets hot.";
      } else if (input.includes('slow')) {
        return "iPhone performance: Try Settings > General > iPhone Storage and offload unused apps. Restart your iPhone weekly. Update to latest iOS. If very old (iPhone 6s or earlier), performance might be throttled due to battery age - check Battery Health.";
      }
    } else if (input.includes('infinix')) {
      return "Infinix devices (XOS): Common issues include bloatware slowing performance. Go to Settings > Apps > disable unnecessary Infinix apps. For battery, use Ultra Power Saving mode. Keep XOS updated through System Update. Infinix phones benefit from regular restarts due to aggressive background management.";
    }

    // General responses
    if (input.includes('overheating') || input.includes('hot')) {
      return "🔥 OVERHEATING ALERT: Stop using immediately! Cool down steps: 1) Turn off device, 2) Remove case/charger, 3) Place in cool area (NOT freezer), 4) Check for damaged charger, 5) Close all apps when restarting. If persistent, hardware issue likely - avoid further use and seek repair.";
    } else if (input.includes('slow') || input.includes('lag')) {
      return "⚡ Performance boost: 1) Restart device (fixes 60% of slowdowns), 2) Clear cache (Android: Settings > Storage), 3) Free up storage (keep 15% free), 4) Update apps and OS, 5) Disable animations in Developer options (Android), 6) Check for malware. If still slow, hardware may be aging.";
    } else if (input.includes('battery') || input.includes('charge')) {
      return "🔋 Battery optimization: 1) Charge between 20-80% when possible, 2) Use original charger, 3) Avoid overnight charging, 4) Enable battery optimization settings, 5) Reduce screen brightness, 6) Turn off location when not needed. If battery drains fast suddenly, check for rogue apps in battery usage stats.";
    } else if (input.includes('screen') || input.includes('display')) {
      return "📱 Screen issues: For flickering - restart and check auto-brightness. For cracks - avoid pressure, use screen protector immediately. For dead pixels - try pixel fixing apps. For touch issues - clean screen, restart, check for screen protector bubbles. Severe damage needs professional repair.";
    } else if (input.includes('water') || input.includes('wet')) {
      return "💧 WATER DAMAGE PROTOCOL: 1) Turn off IMMEDIATELY, 2) Remove battery if possible, 3) Dry externally, 4) Place in rice/silica gel for 48+ hours, 5) DO NOT use rice if ports are damaged, 6) DO NOT turn on early. Success depends on quick action and water type (saltwater is worse).";
    } else if (input.includes('storage') || input.includes('space')) {
      return "💾 Storage cleanup: 1) Delete photos/videos (backup to cloud first), 2) Clear app caches, 3) Uninstall unused apps, 4) Move apps to SD card (Android), 5) Use storage optimization tools built into your OS. Keep 15% free for optimal performance.";
    } else {
      return "I'm here to help with any gadget issue! I specialize in Samsung, iPhone, and Infinix devices, but can assist with any brand. Try asking about: overheating, battery life, slow performance, screen problems, water damage, storage issues, or optimization tips. What specific problem are you facing?";
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
      const aiMessage: Message = {
        id: messages.length + 2,
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      await storeMessage(aiResponse, false);
      setIsTyping(false);
      
      // Text-to-speech for AI responses
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiResponse);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    }, 2000);
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
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-96 flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.isUser ? 'bg-blue-600' : 'bg-green-600'
            }`}>
              {message.isUser ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
              message.isUser
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border'
            }`}>
              <p className="text-sm">{message.text}</p>
              {!message.isUser && (
                <Button
                  onClick={() => speakText(message.text)}
                  size="sm"
                  variant="ghost"
                  className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              )}
            </div>
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
      
      <div className="flex gap-2 mb-4">
        <Input
          type="password"
          placeholder="Enter OpenRouter API key for enhanced AI responses"
          value={openrouterApiKey}
          onChange={(e) => setOpenrouterApiKey(e.target.value)}
          className="flex-1"
        />
      </div>
      
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
        <Button onClick={handleSendMessage} className="bg-green-600 hover:bg-green-700">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AIChat;
