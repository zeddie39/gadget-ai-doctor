import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, Download, Menu, X, User, CircuitBoard, Github, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import StatsCounter from '../components/StatsCounter';

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar — glassmorphism with scroll effect */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-black/70 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/20' 
          : 'bg-transparent backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/20">
              <CircuitBoard className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">ElectroDoctor</span>
            <img src="/ZTech electrictronics logo.png" alt="ZTech" className="w-5 h-5 rounded-full opacity-60" />
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              onClick={() => navigate('/install')}
              variant="ghost"
              size="sm"
              className="text-amber-400 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </Button>
            {session ? (
              <>
                <Button onClick={() => navigate('/profile')} variant="ghost" size="sm" className="text-white hover:bg-white/10 rounded-xl text-xs font-bold gap-1.5">
                  <User className="h-3.5 w-3.5" /> Profile
                </Button>
                <Button onClick={() => navigate('/diagnose?tab=motherboard')} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold gap-1.5">
                  <CircuitBoard className="h-3.5 w-3.5" /> Dashboard
                </Button>
                <Button onClick={handleSignOut} variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/10 rounded-xl text-xs font-bold gap-1.5">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="sm:hidden text-white p-1" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden bg-black/90 backdrop-blur-2xl border-t border-white/10 px-4 py-3 flex flex-col gap-2">
            <Button onClick={() => { navigate('/install'); setMenuOpen(false); }} variant="ghost" size="sm" className="text-amber-400 justify-start rounded-xl gap-2">
              <Download className="h-4 w-4" /> Install App
            </Button>
            {session ? (
              <>
                <Button onClick={() => { navigate('/diagnose?tab=motherboard'); setMenuOpen(false); }} size="sm" className="bg-primary text-primary-foreground justify-start rounded-xl gap-2">
                  <CircuitBoard className="h-4 w-4" /> Dashboard
                </Button>
                <Button onClick={() => { navigate('/profile'); setMenuOpen(false); }} variant="ghost" size="sm" className="text-white justify-start rounded-xl gap-2">
                  <User className="h-4 w-4" /> Profile
                </Button>
                <Button onClick={() => { handleSignOut(); setMenuOpen(false); }} variant="ghost" size="sm" className="text-white justify-start rounded-xl gap-2">
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => { navigate('/auth'); setMenuOpen(false); }} variant="ghost" size="sm" className="text-white justify-start rounded-xl gap-2">
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
            )}
          </div>
        )}
      </nav>

      <Hero />
      <StatsCounter />
      <Features />
      <HowItWorks />
      <Testimonials />

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 py-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 particle-bg opacity-30" />
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Top row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/20">
                  <CircuitBoard className="w-4 h-4 text-primary" />
                </div>
                <span className="text-lg font-black text-white">ElectroDoctor</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                AI-powered motherboard scanning and repair assistant. Trusted by 3,000+ technicians across Africa.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2">
                <Link to="/diagnose?tab=motherboard" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Board Scanner</Link>
                <Link to="/diagnose?tab=chat" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">AI Chat</Link>
                <Link to="/install" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Install App</Link>
                <Link to="/auth" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Sign In</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
              <div className="flex flex-col gap-2">
                <Link to="/terms" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Terms of Service</Link>
                <Link to="/privacy" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Privacy Policy</Link>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} ElectroDoctor.</span>
              <span>Sponsored by</span>
              <img src="/ZTech electrictronics logo.png" alt="ZTech" className="w-4 h-4 rounded-full" />
              <span className="font-bold text-foreground/60">ZTech Electronics</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="mailto:support@electrodoctor.app" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" aria-label="Email">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4 text-muted-foreground" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
