import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client with admin privileges
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight options
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Get user from Auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 2. Parse request body
    const { phoneNumber, amount } = await req.json();

    if (!phoneNumber || !amount) {
      throw new Error('Phone number and amount are required');
    }

    // Format phone number to 254... (Safaricom format)
    let formattedPhone = phoneNumber.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    // 3. Get M-Pesa credentials from Secret Manager
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const passkey = Deno.env.get('MPESA_PASSKEY');
    const shortcode = Deno.env.get('MPESA_SHORTCODE');
    // Note: To receive callbacks locally via Supabase CLI, you might need a service like ngrok
    // For production, this will be your actual Supabase Edge Function URL
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL') || `${supabaseUrl}/functions/v1/mpesa-callback`;

    // Optionally default to sandbox if no environment specified
    const environment = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox';
    const baseUrl = environment === 'sandbox' 
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';

    if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
      console.error('Missing M-Pesa credentials in environment variables');
      throw new Error('Server misconfiguration: Payment gateway not configured');
    }

    // 4. Generate OAuth Token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });

    if (!tokenResponse.ok) {
      const errHeader = await tokenResponse.text();
      console.error('Daraja OAuth Error:', errHeader);
      throw new Error('Failed to authenticate with payment gateway');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 5. Generate Password and Timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // 6. Initiate STK Push
    console.log(`Initiating STK Push for ${formattedPhone} - Amount: ${amount}`);
    
    // Safaricom wants numbers instead of floats
    const numericAmount = Math.ceil(Number(amount));

    const stkData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: numericAmount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: 'Gadget AI Doctor Pro',
      TransactionDesc: 'Upgrade to Pro'
    };

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkData)
    });

    const stkResult = await stkResponse.json();

    if (!stkResponse.ok || stkResult.errorCode) {
      console.error('Daraja STK Push Error:', stkResult);
      throw new Error(stkResult.errorMessage || 'Failed to initiate STK Push');
    }

    // 7. Save transaction attempting state to database
    const { error: dbError } = await supabase
      .from('mpesa_transactions')
      .insert({
        user_id: user.id,
        checkout_request_id: stkResult.CheckoutRequestID,
        merchant_request_id: stkResult.MerchantRequestID,
        phone_number: formattedPhone,
        amount: numericAmount,
        status: 'pending'
      });

    if (dbError) {
      console.error('Error saving transaction to DB:', dbError);
      // Still return success to user since STK is already pushed, 
      // but callback won't be able to find the record. Real production app should handle this gracefully.
    }

    // Return success to client
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push sent to phone',
        checkoutRequestId: stkResult.CheckoutRequestID 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('STK Push function error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
