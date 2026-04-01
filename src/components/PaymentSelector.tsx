import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Smartphone, CreditCard } from 'lucide-react';
import MpesaPaymentModal from './MpesaPaymentModal';
import PaystackPaymentModal from './PaystackPaymentModal';

interface PaymentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentSelector: React.FC<PaymentSelectorProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'paystack' | null>(null);

  if (selectedMethod === 'mpesa') {
    return <MpesaPaymentModal isOpen={true} onClose={() => { setSelectedMethod(null); onClose(); }} onSuccess={onSuccess} />;
  }

  if (selectedMethod === 'paystack') {
    return <PaystackPaymentModal isOpen={true} onClose={() => { setSelectedMethod(null); onClose(); }} onSuccess={onSuccess} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-primary/30 bg-card text-card-foreground shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary fill-primary" />
            <span className="text-primary">Upgrade to Pro</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose your preferred payment method to unlock all premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <button
            onClick={() => setSelectedMethod('mpesa')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Smartphone className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-foreground">M-Pesa</p>
              <p className="text-sm text-muted-foreground">Pay via Safaricom M-Pesa STK Push</p>
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">KES</span>
          </button>

          <button
            onClick={() => setSelectedMethod('paystack')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <CreditCard className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-foreground">Paystack</p>
              <p className="text-sm text-muted-foreground">Card, Bank Transfer — NGN, GHS, KES, ZAR</p>
            </div>
            <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">Multi</span>
          </button>
        </div>

        <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSelector;
