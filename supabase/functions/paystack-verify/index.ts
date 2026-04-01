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
    const { reference } = await req.json();

    if (!reference) {
      throw new Error('Transaction reference is required');
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Server misconfiguration: Paystack not configured');
    }

    // 3. Verify transaction with Paystack API
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.status) {
      console.error('Paystack verification error:', verifyData);
      throw new Error(verifyData.message || 'Verification failed');
    }

    const txData = verifyData.data;
    
    // 4. Check if payment was successful
    if (txData.status !== 'success') {
      // Update transaction as failed
      await supabase
        .from('paystack_transactions')
        .update({
          status: 'failed',
          paystack_response: txData,
        })
        .eq('reference', reference);

      return new Response(
        JSON.stringify({ success: false, message: 'Payment was not successful' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // 5. Payment successful — calculate subscription expiry
    // Amount from Paystack is in subunits (kobo/cents), convert back
    const amountPaid = txData.amount / 100;
    const currency = txData.currency;

    // Determine subscription duration based on amount
    // We normalize to KES base prices for tier mapping
    let normalizedAmount = amountPaid;
    
    // Convert other currencies to approximate KES equivalent for tier matching
    if (currency === 'NGN') {
      normalizedAmount = amountPaid * 0.09; // Rough NGN to KES
    } else if (currency === 'GHS') {
      normalizedAmount = amountPaid * 8.5; // Rough GHS to KES
    } else if (currency === 'ZAR') {
      normalizedAmount = amountPaid * 7.0; // Rough ZAR to KES
    } else if (currency === 'USD') {
      normalizedAmount = amountPaid * 130; // Rough USD to KES
    }

    const expiryDate = new Date();

    if (normalizedAmount <= 250) {
      expiryDate.setDate(expiryDate.getDate() + 14); // 2 Weeks Trial
    } else if (normalizedAmount <= 500) {
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 Month
    } else if (normalizedAmount <= 1200) {
      expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 Months
    } else if (normalizedAmount <= 2500) {
      expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 Months
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 Year
    }

    // 6. Upsert user subscription
    const userId = txData.metadata?.user_id || user.id;

    const { error: subError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier: 'pro',
        status: 'active',
        expires_at: expiryDate.toISOString(),
      }, { onConflict: 'user_id' });

    if (subError) {
      console.error('Failed to update user_subscription:', subError);
    } else {
      console.log(`Successfully upgraded user ${userId} to PRO via Paystack`);
    }

    // 7. Update transaction record
    const { error: updateError } = await supabase
      .from('paystack_transactions')
      .update({
        status: 'completed',
        paystack_response: txData,
      })
      .eq('reference', reference);

    if (updateError) {
      console.error('Error updating paystack transaction:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and subscription activated',
        expires_at: expiryDate.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Paystack verify error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
