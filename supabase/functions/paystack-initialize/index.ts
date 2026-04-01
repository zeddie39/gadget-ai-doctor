import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 2. Parse request body
    const { amount, currency, email } = await req.json();

    if (!amount || !currency) {
      throw new Error('Amount and currency are required');
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('Missing PAYSTACK_SECRET_KEY');
      throw new Error('Server misconfiguration: Paystack not configured');
    }

    // 3. Convert amount to kobo/pesewas (Paystack expects smallest currency unit)
    // KES, NGN, GHS, ZAR — all use 100 subunits per unit
    const amountInSubunit = Math.ceil(Number(amount) * 100);

    // 4. Generate unique reference
    const reference = `gadget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 5. Initialize transaction with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || user.email,
        amount: amountInSubunit,
        currency: currency.toUpperCase(),
        reference,
        callback_url: `${Deno.env.get('PAYSTACK_CALLBACK_URL') || ''}`,
        metadata: {
          user_id: user.id,
          plan_amount: amount,
          custom_fields: [
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: user.id,
            },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization error:', paystackData);
      throw new Error(paystackData.message || 'Failed to initialize Paystack transaction');
    }

    // 6. Save pending transaction to database
    const { error: dbError } = await supabase
      .from('paystack_transactions')
      .insert({
        user_id: user.id,
        reference,
        amount: Number(amount),
        currency: currency.toUpperCase(),
        email: email || user.email,
        status: 'pending',
      });

    if (dbError) {
      console.error('Error saving transaction to DB:', dbError);
    }

    // 7. Return the authorization_url and reference
    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Paystack initialize error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
