import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen glass p-6">
      {/* Header with Logo */}
      <header className="fixed top-4 left-4 z-50">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <img src="/favicon.ico" alt="ElectroDoctor" className="w-8 h-8" />
          <span className="font-bold text-gray-800 hidden sm:block">ElectroDoctor</span>
        </div>
      </header>
      
      {session && (
        <div className="fixed top-4 right-4 z-50">
          <Button onClick={handleSignOut} variant="outline" size="sm" className="nav-pill">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
      <Hero />
      <Features />
      <HowItWorks />
    </div>
  );
};

export default Index;
