import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model = 'google/gemini-2.5-flash', image, systemPrompt } = await req.json();

    console.log('Gemini AI request:', { hasImage: !!image, promptLength: prompt?.length });

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured in Supabase secrets');
    }

    const parts = [];
    if (systemPrompt) {
      parts.push({ text: `SYSTEM: ${systemPrompt}\n\nUSER: ${prompt}` });
    } else {
      parts.push({ text: prompt });
    }

    if (image) {
      // Strip base64 prefix if exists
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response generated from AI');
    }

    console.log('Gemini AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: generatedText,
      model: 'gemini-2.5-flash' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in openrouter-ai function:', error);
    return new Response(JSON.stringify({ 
      error: message,
      errorDetails: error,
      fallback: true 
    }), {
      status: 200, // Return 200 so the client can read the error payload
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
