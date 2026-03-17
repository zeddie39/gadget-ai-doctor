import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSubscription = () => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsPro(false);
        setIsLoading(false);
        return;
      }

      const { data: rawData, error } = await supabase
        .from('user_subscriptions' as any)
        .select('tier, status, expires_at')
        .eq('user_id', session.user.id)
        .single();
        
      const data = rawData as any;

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }

      if (data && data.tier === 'pro' && data.status === 'active') {
        // Check expiry date if applicable
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setIsPro(false);
        } else {
          setIsPro(true);
        }
      } else {
        setIsPro(false);
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
      setIsPro(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { isPro, isLoading, recheckSubscription: checkSubscription };
};
