import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Zap, ShieldCheck, Cpu, CreditCard, Globe, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  priceAmount?: number;
}

// Currency configs for Paystack
const CURRENCIES = [
  { code: 'KES', symbol: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
];

// Prices per currency (equivalent tiers)
const TIER_PRICES: Record<string, { trial: number; monthly: number; quarterly: number; half: number; annual: number }> = {
  KES: { trial: 199, monthly: 399, quarterly: 999, half: 1899, annual: 3499 },
  NGN: { trial: 1500, monthly: 3000, quarterly: 7500, half: 14000, annual: 26000 },
  GHS: { trial: 15, monthly: 30, quarterly: 75, half: 140, annual: 260 },
  ZAR: { trial: 20, monthly: 40, quarterly: 100, half: 190, annual: 350 },
  USD: { trial: 1.5, monthly: 3, quarterly: 8, half: 15, annual: 27 },
};

type TierId = 'trial' | 'monthly' | 'quarterly' | 'half' | 'annual';

const TIERS: { id: TierId; name: string; popular: boolean }[] = [
  { id: 'trial', name: '2 Weeks', popular: false },
  { id: 'monthly', name: '1 Month', popular: true },
  { id: 'quarterly', name: '3 Months', popular: false },
  { id: 'half', name: '6 Months', popular: false },
  { id: 'annual', name: '1 Year', popular: false },
];

type PaymentMethod = 'mpesa' | 'paystack';

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [selectedTier, setSelectedTier] = useState<TierId>('monthly');
  const [selectedCurrency, setSelectedCurrency] = useState('KES');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  const getCurrentPrice = () => {
    return TIER_PRICES[selectedCurrency]?.[selectedTier] ?? TIER_PRICES.KES[selectedTier];
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || 'KES';
  };

  // ═══════════════════════════════════════════════
  // M-Pesa Handler (existing flow)
  // ═══════════════════════════════════════════════
  const handleMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error('Please enter a valid Safaricom number');
      return;
    }

    setIsProcessing(true);
    setStatusText('Initiating secure M-Pesa payment...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to upgrade');
        setIsProcessing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: { phoneNumber, amount: TIER_PRICES.KES[selectedTier] },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Payment failed to initiate');
      }

      setStatusText('Prompt sent! Check your phone to enter your M-Pesa PIN...');
      toast.success('Check your phone!');
      pollForMpesaSuccess(data.checkoutRequestId);

    } catch (err: any) {
      console.error('M-Pesa Payment Error:', err);
      toast.error(err.message || 'Payment failed');
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const pollForMpesaSuccess = async (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const checkStatus = async () => {
      attempts++;
      try {
        const { data } = await supabase
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

        setTimeout(checkStatus, 2000);
      } catch (e) {
        console.error('Polling error', e);
        if (attempts < maxAttempts) setTimeout(checkStatus, 2000);
        else setIsProcessing(false);
      }
    };

    setTimeout(checkStatus, 3000);
  };

  // ═══════════════════════════════════════════════
  // Paystack Handler
  // ═══════════════════════════════════════════════
  const handlePaystackPayment = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);
    setStatusText('Setting up Paystack checkout...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to upgrade');
        setIsProcessing(false);
        return;
      }

      // Initialize transaction via Edge Function
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          amount: getCurrentPrice(),
          currency: selectedCurrency,
          email,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to initialize Paystack payment');
      }

      setStatusText('Opening secure checkout...');

      // Open Paystack Inline Popup
      if (window.PaystackPop) {
        const popup = new window.PaystackPop();
        popup.newTransaction({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
          email,
          amount: Math.ceil(getCurrentPrice() * 100), // Convert to subunit
          currency: selectedCurrency,
          reference: data.reference,
          onSuccess: async (transaction: any) => {
            setStatusText('Verifying payment...');
            try {
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke('paystack-verify', {
                body: { reference: transaction.reference },
              });

              if (verifyError || !verifyData?.success) {
                throw new Error(verifyData?.error || 'Payment verification failed');
              }

              setIsProcessing(false);
              setStatusText('');
              toast.success('Payment Verified! Welcome to Pro. 🎉');
              onSuccess();
            } catch (verifyErr: any) {
              console.error('Paystack verify error:', verifyErr);
              toast.error(verifyErr.message || 'Verification failed');
              setIsProcessing(false);
              setStatusText('');
            }
          },
          onCancel: () => {
            toast.info('Payment was cancelled');
            setIsProcessing(false);
            setStatusText('');
          },
        });
      } else {
        // Fallback: redirect to authorization URL
        window.open(data.authorization_url, '_blank');
        setStatusText('Complete payment in the new tab, then return here.');
        setIsProcessing(false);
      }

    } catch (err: any) {
      console.error('Paystack Payment Error:', err);
      toast.error(err.message || 'Payment failed');
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'mpesa') {
      handleMpesaPayment();
    } else {
      handlePaystackPayment();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-lg border-blue-500/30 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60 text-white shadow-2xl overflow-hidden smart-glass max-h-[90vh] overflow-y-auto">
        
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

        <div className="relative z-10 py-4 space-y-5">
          
          {/* Pro Benefits */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <Cpu className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <span>Advanced Deep-Learning AI Models</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <ShieldCheck className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <span>Priority Support & Unlimited Scans</span>
            </div>
          </div>

          {/* ═══ Payment Method Selector ═══ */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod('mpesa')}
              className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                paymentMethod === 'mpesa'
                  ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/10'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              <Smartphone className="h-5 w-5" />
              M-Pesa
              {paymentMethod === 'mpesa' && (
                <CheckCircle2 className="absolute top-1 right-1 h-4 w-4 text-emerald-400" />
              )}
            </button>
            <button
              onClick={() => setPaymentMethod('paystack')}
              className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                paymentMethod === 'paystack'
                  ? 'border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/10'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              Paystack
              {paymentMethod === 'paystack' && (
                <CheckCircle2 className="absolute top-1 right-1 h-4 w-4 text-blue-400" />
              )}
            </button>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
            
            {/* ═══ Currency Selector (Paystack only) ═══ */}
            {paymentMethod === 'paystack' && (
              <div>
                <label className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2 block">
                  Select Currency
                </label>
                <div className="flex flex-wrap gap-2">
                  {CURRENCIES.map((cur) => (
                    <button
                      key={cur.code}
                      onClick={() => setSelectedCurrency(cur.code)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedCurrency === cur.code
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <span>{cur.flag}</span>
                      <span>{cur.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ Tier Selection ═══ */}
            <div>
              <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2 block">
                Select Subscription Plan
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TIERS.map((tier) => {
                  const price = paymentMethod === 'paystack'
                    ? (TIER_PRICES[selectedCurrency]?.[tier.id] ?? TIER_PRICES.KES[tier.id])
                    : TIER_PRICES.KES[tier.id];
                  const symbol = paymentMethod === 'paystack' ? getCurrencySymbol() : 'KES';

                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`relative cursor-pointer p-3 rounded-lg border text-center transition-all ${
                        selectedTier === tier.id
                          ? 'border-emerald-500 bg-emerald-500/20 shadow-md shadow-emerald-500/20'
                          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Popular
                        </div>
                      )}
                      <div className={`text-xs font-medium mb-1 ${selectedTier === tier.id ? 'text-white' : 'text-slate-300'}`}>
                        {tier.name}
                      </div>
                      <div className={`text-sm font-bold ${selectedTier === tier.id ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {symbol} {price}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ M-Pesa: Phone Number Input ═══ */}
            {paymentMethod === 'mpesa' && (
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
            )}

            {/* ═══ Paystack: Email Input ═══ */}
            {paymentMethod === 'paystack' && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 bg-black/40 border-blue-500/30 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50 h-12 text-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Secured by Paystack • Cards, Bank Transfer, Mobile Money</span>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Status Text ═══ */}
          {statusText && (
            <div className={`text-center text-sm font-medium animate-pulse py-2 rounded-lg border ${
              paymentMethod === 'mpesa'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
            }`}>
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
            disabled={isProcessing || (paymentMethod === 'mpesa' ? !phoneNumber : !email)}
            className={`font-medium px-8 shadow-lg ${
              paymentMethod === 'mpesa'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
            }`}
          >
            {isProcessing
              ? 'Processing...'
              : paymentMethod === 'mpesa'
                ? `Pay KES ${TIER_PRICES.KES[selectedTier]}`
                : `Pay ${getCurrencySymbol()} ${getCurrentPrice()}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
