import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, prompt } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image base64 data is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Supabase secrets.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Prepare system instruction for structured output
    const defaultPrompt = `You are an expert electronics repair technician. Analyze this image of a device/motherboard. 
    Return a JSON object with the following structure:
    {
      "issues": ["List of identified physical damage, cracks, water damage, or burnt components"],
      "components": ["List of recognizable components in the image"],
      "healthScore": 0-100 (number estimating the physical health),
      "recommendations": ["List of repair recommendations"]
    }`;

    // Strip data header from base64 if present, e.g. "data:image/jpeg;base64,..."
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
    
    // Default mime type to jpeg if not explicitly provided in a data URI
    const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,/);
    const mimeType = match ? match[1] : 'image/jpeg';

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt || defaultPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json",
      }
    };

    console.log("Sending request to Gemini Vision API...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      throw new Error(`Gemini API Error: ${data.error?.message || response.statusText}`);
    }

    // Extract JSON response from Gemini
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error("No response received from Gemini API");
    }

    return new Response(
      textResponse,
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Error in analyze-device-image function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
