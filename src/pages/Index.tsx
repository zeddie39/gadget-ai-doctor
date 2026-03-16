import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, Download, Menu, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white tracking-tight">ElectroDoctor</span>
            <img src="/ZTech electrictronics logo.png" alt="ZTech" className="w-6 h-6 rounded-full" />
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              onClick={() => navigate('/install')}
              variant="ghost"
              size="sm"
              className="text-amber-400 hover:text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
            {session ? (
              <>
                <Button onClick={() => navigate('/profile')} variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <User className="h-4 w-4 mr-1" /> Profile
                </Button>
                <Button onClick={handleSignOut} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="sm:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden bg-black/80 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex flex-col gap-2">
            <Button onClick={() => { navigate('/install'); setMenuOpen(false); }} variant="ghost" size="sm" className="text-amber-400 justify-start">
              <Download className="h-4 w-4 mr-2" /> Install App
            </Button>
            {session ? (
              <Button onClick={() => { handleSignOut(); setMenuOpen(false); }} variant="ghost" size="sm" className="text-white justify-start">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            ) : (
              <Button onClick={() => { navigate('/auth'); setMenuOpen(false); }} variant="ghost" size="sm" className="text-white justify-start">
                <LogIn className="h-4 w-4 mr-2" /> Sign In
              </Button>
            )}
          </div>
        )}
      </nav>

      <Hero />
      <Features />
      <HowItWorks />

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/10 py-10 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">ElectroDoctor</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            </div>
            <div className="flex items-center gap-2">
              <span>Sponsored by</span>
              <img src="/ZTech electrictronics logo.png" alt="ZTech" className="w-5 h-5" />
              <span className="font-medium text-foreground/80">ZTech Electronics</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
