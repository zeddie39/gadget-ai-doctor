import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, MessageSquare, MessageCircle, Settings, Battery, Wrench, Trash, Shield, BookOpen, FileText, AlertTriangle, Brain, LogOut, Lock, Video, Package, ShieldCheck, Activity, HardDrive, Cpu, User, LayoutDashboard, ScanLine, Sparkles, CircuitBoard, Calculator } from 'lucide-react';
import MotherboardScanner from '../components/MotherboardScanner';
import PhotoUpload from '../components/PhotoUpload';
import AIChat from '../components/AIChat';
import TroubleshootingWizard from '../components/TroubleshootingWizard';
import BatteryHealthChecker from '../components/BatteryHealthChecker';
import StorageOptimizer from '../components/StorageOptimizer';
import HealthScore from '../components/HealthScore';
import IssueHistory from '../components/IssueHistory';
import KnowledgeHub from '../components/KnowledgeHub';
import SecurityAlerts from '../components/SecurityAlerts';
import AITrainingDashboard from '../components/AITrainingDashboard';
import VideoRepairAnalyzer from '../components/VideoRepairAnalyzer';
import SparePartsInventoryManager from '../components/SparePartsInventoryManager';
import RepairCostEstimator from '../components/RepairCostEstimator';

const Diagnose = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('motherboard');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate('/auth');
      } else {
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      } else {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  // Real-time Health Metrics
  const [metrics, setMetrics] = useState({
    battery: 0,
    storage: 0,
    memory: 0,
    isCharging: false
  });

  useEffect(() => {
    const updateMetrics = async () => {
      // Battery
      if ('getBattery' in navigator) {
        const b = await (navigator as any).getBattery();
        setMetrics(prev => ({ ...prev, battery: Math.round(b.level * 100), isCharging: b.charging }));
      }
      
      // Storage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const { usage, quota } = await navigator.storage.estimate();
        if (usage && quota) {
          setMetrics(prev => ({ ...prev, storage: Math.round((usage / quota) * 100) }));
        }
      }

      // Memory (JS Heap)
      if ('memory' in performance) {
        const m = (performance as any).memory;
        setMetrics(prev => ({ ...prev, memory: Math.round((m.usedJSHeapSize / m.jsHeapSizeLimit) * 100) }));
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const validTabs = ['motherboard', 'photo', 'video', 'chat', 'troubleshoot', 'battery', 'storage', 'health', 'history', 'knowledge', 'security', 'training', 'inventory', 'cost-estimate'];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen premium-gradient p-2 sm:p-3 md:p-6 text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Proactive Health Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          {[
            { label: 'Battery', val: metrics.battery, icon: Battery, unit: '%', color: metrics.battery < 20 ? 'text-red-500' : 'text-emerald-500', sub: metrics.isCharging ? 'Charging' : 'On Battery' },
            { label: 'Storage', val: metrics.storage, icon: HardDrive, unit: '%', color: metrics.storage > 90 ? 'text-red-500' : 'text-cyan-500', sub: 'Capacity' },
            { label: 'Memory', val: metrics.memory, icon: Activity, unit: '%', color: metrics.memory > 80 ? 'text-orange-500' : 'text-purple-500', sub: 'JS Heap' }
          ].map((item, i) => (
            <Card key={i} className="smart-glass border-none group overflow-hidden rounded-2xl">
              <div className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                    <span className={`text-lg font-bold ${item.color}`}>{item.val}{item.unit}</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <style>{`._diag_bar_${i} { width: ${item.val}%; }`}</style>
                    <div 
                      className={`h-full transition-all duration-1000 ease-out _diag_bar_${i} ${item.color.replace('text-', 'bg-')}`} 
                    />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5 font-semibold">
                    {item.sub}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/20 smart-glass border-primary/20 glow-border">
              <Cpu className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent leading-tight">
                Diagnostic Hub
              </h1>
              <p className="text-muted-foreground text-sm font-medium flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                AI Systems Fully Operational
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {isAdmin && (
              <Button onClick={() => navigate('/admin')} variant="outline" size="sm" className="smart-glass border-primary/20 text-primary hover:bg-primary/20 font-bold rounded-xl">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button onClick={handleSignOut} variant="outline" size="sm" className="smart-glass border-white/5 hover:bg-white/10 text-white rounded-xl">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="flex flex-wrap justify-start sm:justify-center gap-1.5 sm:gap-2 h-auto p-2 sm:p-3 bg-white/5 smart-glass border-white/10 rounded-2xl overflow-x-auto max-w-full">
            <span className="w-full text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/60 text-center mb-1 sm:mb-2">Technical Diagnostics</span>
            <TabsTrigger value="motherboard" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <CircuitBoard className="h-4 w-4 text-primary" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Board Scan</span>
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <Camera className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Photo</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <Video className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Video</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Support</span>
            </TabsTrigger>
            <TabsTrigger value="troubleshoot" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <Wrench className="h-4 w-4 text-purple-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Wizard</span>
            </TabsTrigger>
            <TabsTrigger value="battery" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <Battery className="h-4 w-4 text-red-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Battery</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <Trash className="h-4 w-4 text-cyan-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Cleaner</span>
            </TabsTrigger>

            <span className="w-full text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/60 text-center mt-2 sm:mt-4 mb-1 sm:mb-2">Systems & Insights</span>
            <TabsTrigger value="health" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <Shield className="h-4 w-4 text-indigo-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Health</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">History</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <BookOpen className="h-4 w-4 text-green-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Knowledge</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Security</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <Brain className="h-4 w-4 text-pink-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Training</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <Package className="h-4 w-4 text-orange-400" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="cost-estimate" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-transparent border-none">
              <Calculator className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Cost</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="motherboard" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="smart-glass border-none p-2 rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <div className="p-2 rounded-xl bg-primary/20 neon-glow-subtle">
                    <CircuitBoard className="h-6 w-6 text-primary" />
                  </div>
                  AI Motherboard Scanner
                </CardTitle>
                <CardDescription className="text-muted-foreground/80 font-medium">
                  Scan any motherboard — identify model, detect faults, get repair solutions, tutorials & schematics
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <MotherboardScanner />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photo" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="smart-glass border-none p-2 rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <div className="p-2 rounded-xl bg-amber-500/20">
                    <Camera className="h-6 w-6 text-amber-500" />
                  </div>
                  AI Photo Diagnosis
                </CardTitle>
                <CardDescription className="text-muted-foreground/80 font-medium">
                  Upload photos for AI-powered damage detection and technical assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <PhotoUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video">
            <VideoRepairAnalyzer />
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  Live AI Chat Support
                </CardTitle>
                <CardDescription>
                  Chat with our smart assistant for instant help with gadget problems, safety tips, and optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIChat />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshoot">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-6 w-6 text-primary" />
                  Step-by-Step Troubleshooting Wizard
                </CardTitle>
                <CardDescription>
                  Interactive guided solutions for common device problems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TroubleshootingWizard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="battery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-6 w-6 text-primary" />
                  Battery Health & Usage Monitor
                </CardTitle>
                <CardDescription>
                  Monitor your device's battery health and get optimization recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BatteryHealthChecker />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash className="h-6 w-6 text-primary" />
                  Smart Storage Cleaner & Optimizer
                </CardTitle>
                <CardDescription>
                  AI-powered cleanup of unused apps, duplicate photos, and cache files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StorageOptimizer />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Gadget Health Score & AI Rating
                </CardTitle>
                <CardDescription>
                  Comprehensive health analysis based on storage, battery, temperature, and usage patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthScore />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Issue History & Repair Tracker
                </CardTitle>
                <CardDescription>
                  Track all device issues, repairs, costs, and maintenance history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IssueHistory />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeHub />
          </TabsContent>

          <TabsContent value="security">
            <SecurityAlerts />
          </TabsContent>

          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  AI Training & Analytics
                </CardTitle>
                <CardDescription>
                  Monitor AI performance, collect feedback, and improve diagnostic accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AITrainingDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <SparePartsInventoryManager />
          </TabsContent>

          <TabsContent value="cost-estimate" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <RepairCostEstimator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Diagnose;
