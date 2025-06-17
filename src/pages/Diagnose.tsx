
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, MessageCircle, Settings, Battery, Wrench } from 'lucide-react';
import PhotoUpload from '../components/PhotoUpload';
import AIChat from '../components/AIChat';
import TroubleshootingWizard from '../components/TroubleshootingWizard';
import BatteryHealthChecker from '../components/BatteryHealthChecker';

const Diagnose = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('photo');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['photo', 'chat', 'troubleshoot', 'battery'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              ZediFix Diagnostic Center
            </span>
          </h1>
          <p className="text-lg text-gray-600">
            Choose your preferred method to diagnose and fix your device issues
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo Analysis
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="troubleshoot" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Troubleshoot
            </TabsTrigger>
            <TabsTrigger value="battery" className="flex items-center gap-2">
              <Battery className="h-4 w-4" />
              Battery Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-6 w-6 text-blue-600" />
                  Advanced Image Analyzer
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
                  Troubleshooting Wizard
                </CardTitle>
                <CardDescription>
                  Step-by-step guided solutions for common device problems
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
                  Real-Time Battery Health Checker
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
        </Tabs>
      </div>
    </div>
  );
};

export default Diagnose;
