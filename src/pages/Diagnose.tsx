import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, MessageCircle, Settings, Battery, Wrench, Trash, Shield, BookOpen, FileText, AlertTriangle, Brain, LogOut, Lock, Video } from 'lucide-react';
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

const Diagnose = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('photo');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const validTabs = ['photo', 'video', 'chat', 'troubleshoot', 'battery', 'storage', 'health', 'history', 'knowledge', 'security', 'training'];
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                ZediFix Diagnostic Center
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              Complete AI-powered gadget diagnosis, optimization, and repair tracking
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11 mb-8 h-auto">
            <TabsTrigger value="photo" className="flex flex-col items-center gap-1 py-3">
              <Camera className="h-4 w-4" />
              <span className="text-xs">Photo</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex flex-col items-center gap-1 py-3">
              <Video className="h-4 w-4" />
              <span className="text-xs">Video</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex flex-col items-center gap-1 py-3">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="troubleshoot" className="flex flex-col items-center gap-1 py-3">
              <Wrench className="h-4 w-4" />
              <span className="text-xs">Wizard</span>
            </TabsTrigger>
            <TabsTrigger value="battery" className="flex flex-col items-center gap-1 py-3">
              <Battery className="h-4 w-4" />
              <span className="text-xs">Battery</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex flex-col items-center gap-1 py-3">
              <Trash className="h-4 w-4" />
              <span className="text-xs">Cleaner</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex flex-col items-center gap-1 py-3">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Health</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col items-center gap-1 py-3">
              <FileText className="h-4 w-4" />
              <span className="text-xs">History</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex flex-col items-center gap-1 py-3">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs">Knowledge</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col items-center gap-1 py-3">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Security</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex flex-col items-center gap-1 py-3">
              <Brain className="h-4 w-4" />
              <span className="text-xs">AI Training</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-6 w-6 text-blue-600" />
                  AI Photo Diagnosis
                </CardTitle>
                <CardDescription>
                  Upload photos of your device for AI-powered damage detection and severity assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                  <MessageCircle className="h-6 w-6 text-green-600" />
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
                  <Wrench className="h-6 w-6 text-purple-600" />
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
                  <Battery className="h-6 w-6 text-orange-600" />
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
                  <Trash className="h-6 w-6 text-purple-600" />
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
                  <Shield className="h-6 w-6 text-indigo-600" />
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
                  <FileText className="h-6 w-6 text-blue-600" />
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
                  <Brain className="h-6 w-6 text-purple-600" />
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
        </Tabs>
      </div>
    </div>
  );
};

export default Diagnose;
