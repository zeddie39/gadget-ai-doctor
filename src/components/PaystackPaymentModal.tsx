import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Zap, ShieldCheck, Cpu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaystackPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CURRENCIES = [
  { code: 'KES', label: 'KES (Kenya)' },
  { code: 'NGN', label: 'NGN (Nigeria)' },
  { code: 'GHS', label: 'GHS (Ghana)' },
  { code: 'ZAR', label: 'ZAR (South Africa)' },
  { code: 'USD', label: 'USD (International)' },
];

const TIERS: Record<string, { id: string; name: string; price: number }[]> = {
  KES: [
    { id: 'trial', name: '2 Weeks', price: 199 },
    { id: 'monthly', name: '1 Month', price: 399 },
    { id: 'quarterly', name: '3 Months', price: 999 },
    { id: 'half', name: '6 Months', price: 1899 },
    { id: 'annual', name: '1 Year', price: 3499 },
  ],
  NGN: [
    { id: 'trial', name: '2 Weeks', price: 2200 },
    { id: 'monthly', name: '1 Month', price: 4400 },
    { id: 'quarterly', name: '3 Months', price: 11000 },
    { id: 'half', name: '6 Months', price: 21000 },
    { id: 'annual', name: '1 Year', price: 38000 },
  ],
  GHS: [
    { id: 'trial', name: '2 Weeks', price: 25 },
    { id: 'monthly', name: '1 Month', price: 50 },
    { id: 'quarterly', name: '3 Months', price: 120 },
    { id: 'half', name: '6 Months', price: 225 },
    { id: 'annual', name: '1 Year', price: 410 },
  ],
  ZAR: [
    { id: 'trial', name: '2 Weeks', price: 30 },
    { id: 'monthly', name: '1 Month', price: 60 },
    { id: 'quarterly', name: '3 Months', price: 145 },
    { id: 'half', name: '6 Months', price: 270 },
    { id: 'annual', name: '1 Year', price: 500 },
  ],
  USD: [
    { id: 'trial', name: '2 Weeks', price: 2 },
    { id: 'monthly', name: '1 Month', price: 4 },
    { id: 'quarterly', name: '3 Months', price: 9 },
    { id: 'half', name: '6 Months', price: 15 },
    { id: 'annual', name: '1 Year', price: 27 },
  ],
};

const PaystackPaymentModal: React.FC<PaystackPaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [currency, setCurrency] = useState('KES');
  const [selectedTier, setSelectedTier] = useState(TIERS['KES'][1]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    setSelectedTier(TIERS[val][1]); // default to monthly
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to upgrade');
        return;
      }

      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          amount: selectedTier.price,
          currency: currency,
          email: session.user.email,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to initialize payment');
      }

      // Redirect to Paystack checkout
      window.open(data.authorization_url, '_blank');
      
      toast.info('Complete payment in the new tab, then come back here.');
      
      // Poll for verification
      pollForVerification(data.reference);
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const pollForVerification = async (reference: string) => {
    let attempts = 0;
    const maxAttempts = 60;

    const check = async () => {
      attempts++;
      try {
        const { data, error } = await supabase.functions.invoke('paystack-verify', {
          body: { reference },
        });

        if (data?.success) {
          toast.success('Payment verified! Welcome to Pro.');
          onSuccess();
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(check, 5000);
        } else {
          toast.error('Verification timed out. If you paid, please contact support.');
        }
      } catch {
        if (attempts < maxAttempts) setTimeout(check, 5000);
      }
    };

    setTimeout(check, 8000);
  };

  const tiers = TIERS[currency];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-md border-primary/30 bg-card text-card-foreground shadow-2xl overflow-hidden">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary fill-primary" />
            <span className="text-primary">Upgrade to Pro</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pay with card or bank transfer via Paystack.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Cpu className="h-5 w-5 text-primary" />
              <span>Advanced Deep-Learning AI Models</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Priority Support & Unlimited Scans</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-primary uppercase tracking-wider">Currency</label>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-primary uppercase tracking-wider">Select Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {tiers.map(tier => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`cursor-pointer p-3 rounded-lg border text-center transition-all ${
                    selectedTier.id === tier.id
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-xs font-medium mb-1">{tier.name}</div>
                  <div className={`text-sm font-bold ${selectedTier.id === tier.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    {currency} {tier.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between items-center pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing} className="text-muted-foreground">
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing} className="font-medium px-8">
            <CreditCard className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : `Pay ${currency} ${selectedTier.price}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaystackPaymentModal;
