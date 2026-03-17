-- ============================================================
-- Migration: Add user_subscriptions and mpesa_transactions
-- Tracks Pro tier access and M-Pesa Daraja STK Push payments
-- ============================================================

-- -------------------------------------------------------
-- 1. user_subscriptions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free' or 'pro'
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role / edge functions can insert/update this based on webhook
-- Users should not be able to arbitrarily set themselves to 'pro'

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Provide a default record for users if they don't have one (via trigger on auth.users later, or handle in app)

-- -------------------------------------------------------
-- 2. mpesa_transactions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mpesa_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkout_request_id TEXT NOT NULL UNIQUE,  -- Provided by Daraja STK Push response
  merchant_request_id TEXT NOT NULL,         -- Provided by Daraja STK Push response
  phone_number TEXT NOT NULL,                -- E.g., 2547XXXXXXXX
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',    -- 'pending', 'completed', 'failed'
  result_code TEXT,                          -- 0 for success, other codes for failures
  result_desc TEXT,                          -- Human readable callback message
  mpesa_receipt_number TEXT UNIQUE,          -- TXN Code, present on success
  transaction_date TIMESTAMP WITH TIME ZONE, -- From safely parsed M-Pesa date
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for mpesa_transactions
CREATE POLICY "Users can view own transactions"
  ON public.mpesa_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System creates via edge function initiating push
-- System updates via edge function receiving callback

CREATE POLICY "Admins can view all transactions"
  ON public.mpesa_transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_mpesa_transactions_updated_at
  BEFORE UPDATE ON public.mpesa_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes mapping Daraja keys
CREATE INDEX idx_mpesa_checkout_req_id ON public.mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_txn_user_id ON public.mpesa_transactions(user_id);
