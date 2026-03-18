import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Zap, ShieldCheck, Cpu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  priceAmount?: number;
}

const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({ isOpen, onClose, onSuccess, priceAmount = 299 }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error('Please enter a valid Safaricom number');
      return;
    }

    setIsProcessing(true);
    setStatusText('Initiating secure payment...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to upgrade');
        setIsProcessing(false);
        return;
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: { phoneNumber, amount: priceAmount },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Payment failed to initiate');
      }

      setStatusText('Prompt sent! Please check your phone to enter your M-Pesa PIN...');
      toast.success('Check your phone!');

      // Start polling for payment success
      pollForPaymentSuccess(data.checkoutRequestId);

    } catch (err: any) {
      console.error('Payment Error:', err);
      toast.error(err.message || 'Payment failed');
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const pollForPaymentSuccess = async (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 1 minute at 2s interval

    const checkStatus = async () => {
      attempts++;
      try {
        const { data, error } = await supabase
          .from('mpesa_transactions' as any)
          .select('status')
          .eq('checkout_request_id', checkoutRequestId)
          .single();

        if ((data as any)?.status === 'completed') {
          setIsProcessing(false);
          toast.success('Payment Received! Welcome to Pro.');
          onSuccess();
          return;
        }

        if ((data as any)?.status === 'failed' || attempts >= maxAttempts) {
          setIsProcessing(false);
          setStatusText('');
          toast.error(attempts >= maxAttempts ? 'Payment timed out' : 'Payment failed or was cancelled');
          return;
        }

        // Keep polling
        setTimeout(checkStatus, 2000);
      } catch (e) {
        console.error('Polling error', e);
        if (attempts < maxAttempts) setTimeout(checkStatus, 2000);
        else setIsProcessing(false);
      }
    };

    setTimeout(checkStatus, 3000); // initial delay
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-md border-blue-500/30 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60 text-white shadow-2xl overflow-hidden smart-glass">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <DialogHeader className="relative z-10 space-y-3">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-emerald-400 fill-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Upgrade to Pro
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Unlock advanced AI diagnostics, real-time hardware tracking, and priority support. 
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 py-6 space-y-6">
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <Cpu className="h-5 w-5 text-blue-400" />
              <span>Advanced Deep-Learning AI Models</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <span>Priority Support & Unlimited Scans</span>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-400">Total Price</span>
              <span className="text-2xl font-bold tracking-tight text-white">KES {priceAmount}</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                <Input
                  type="tel"
                  placeholder="07XX XXX XXX or 254..."
                  className="pl-10 bg-black/40 border-emerald-500/30 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/50 h-12 text-lg"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          {statusText && (
            <div className="text-center text-sm font-medium text-emerald-400 animate-pulse bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
              {statusText}
            </div>
          )}

        </div>

        <DialogFooter className="relative z-10 sm:justify-between items-center pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing || !phoneNumber}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 shadow-lg shadow-emerald-500/20"
          >
            {isProcessing ? 'Waiting for M-Pesa...' : 'Pay with M-Pesa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MpesaPaymentModal;
