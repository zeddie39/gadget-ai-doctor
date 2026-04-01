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
    // 1. Parse Daraja Webhook JSON Payload
    const callbackData = await req.json();
    console.log('Received M-Pesa Callback:', JSON.stringify(callbackData, null, 2));

    const payload = callbackData?.Body?.stkCallback;
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid callback payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = payload;

    // 2. Look up the pending transaction in our database
    const { data: transaction, error: fetchError } = await supabase
      .from('mpesa_transactions')
      .select('id, user_id, status, amount')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    if (fetchError || !transaction) {
      console.error(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
      // Return 200 anyway so Safaricom stops retrying, even though we didn't find it.
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Process the Result Code
    let receiptNumber = null;
    let transactionDate = null;
    let newStatus = 'failed';

    if (ResultCode === 0) {
      // Payment Successful
      newStatus = 'completed';
      
      // Extract callback metadata map
      if (CallbackMetadata && CallbackMetadata.Item) {
        const itemMap = CallbackMetadata.Item.reduce((acc: any, item: any) => {
          acc[item.Name] = item.Value;
          return acc;
        }, {});
        
        receiptNumber = itemMap.MpesaReceiptNumber;
        transactionDate = itemMap.TransactionDate?.toString();
      }

      // Generate calculated expiry based on tier pricing
      const expiryDate = new Date();
      const amountPaid = transaction.amount || 399; // Default fallback to monthly
      
      if (amountPaid === 199) {
        expiryDate.setDate(expiryDate.getDate() + 14); // 2 Weeks Trial
      } else if (amountPaid === 999) {
        expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 Months (Quarterly)
      } else if (amountPaid === 1899) {
        expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 Months (Half)
      } else if (amountPaid === 3499) {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 Year (Annual)
      } else {
        expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 Month Default (399)
      }
      
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: transaction.user_id,
          tier: 'pro',
          status: 'active',
          expires_at: expiryDate.toISOString()
        }, { onConflict: 'user_id' });

      if (subError) {
        console.error('Failed to update user_subscription:', subError);
      } else {
        console.log(`Successfully upgraded user ${transaction.user_id} to PRO`);
      }
    } else {
      // Payment Failed or Cancelled by User (e.g. ResultCode 1032)
      console.warn(`Payment failed: ${ResultCode} - ${ResultDesc}`);
    }

    // 4. Update the transaction record
    const { error: updateError } = await supabase
      .from('mpesa_transactions')
      .update({
        status: newStatus,
        result_code: ResultCode?.toString(),
        result_desc: ResultDesc,
        mpesa_receipt_number: receiptNumber,
        // TransactionDate comes as YYYYMMDDHHmmss, converting string format is tricky, saving raw string may be safer or parsing manually:
        // transaction_date: parsedDate
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction status:', updateError);
    }

    // 5. Always return 200 OK to Daraja so they stop hitting this endpoint
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Even on error, M-Pesa expects a 200 response with ResultCode usually to stop retries
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Internal Error" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
