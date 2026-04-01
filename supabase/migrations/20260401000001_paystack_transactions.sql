-- ============================================================
-- Migration: Add paystack_transactions table
-- Tracks Paystack payment transactions alongside M-Pesa
-- ============================================================

-- -------------------------------------------------------
-- paystack_transactions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.paystack_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,               -- Unique Paystack transaction reference
  amount DECIMAL(10, 2) NOT NULL,               -- Amount in major currency unit (e.g. 399 KES)
  currency TEXT NOT NULL DEFAULT 'KES',          -- KES, NGN, GHS, ZAR, USD
  email TEXT,                                    -- Email used for Paystack checkout
  status TEXT NOT NULL DEFAULT 'pending',        -- 'pending', 'completed', 'failed'
  paystack_response JSONB,                       -- Full Paystack verification response
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paystack_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for paystack_transactions
CREATE POLICY "Users can view own paystack transactions"
  ON public.paystack_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all paystack transactions"
  ON public.paystack_transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_paystack_transactions_updated_at
  BEFORE UPDATE ON public.paystack_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_paystack_reference ON public.paystack_transactions(reference);
CREATE INDEX idx_paystack_user_id ON public.paystack_transactions(user_id);
