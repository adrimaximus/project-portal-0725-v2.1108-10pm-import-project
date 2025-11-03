// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, message } = await req.json()
    if (!phone || !message) throw new Error('Phone number and message are required.')

    // NOTE: Hardcoded credentials as per user instruction for a 100% fix.
    const clientId = "10561";
    const apiKey = "8fb9780fcaa16a35c968b6cac39d648146340b14";
    const whatsappClientId = "4189";

    if (!clientId || !apiKey || !whatsappClientId) {
      throw new Error("WBIZTOOL credentials missing or invalid.");
    }

    const messageResponse = await fetch('https://wbiztool.com/api/v1/send_msg/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId,
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        client_id: parseInt(clientId, 10),
        api_key: apiKey,
        whatsapp_client: parseInt(whatsappClientId, 10),
        phone,
        message,
      }),
    })
    
    if (!messageResponse.ok) {
      const status = messageResponse.status;
      const errorText = await messageResponse.text();
      let errorMessage = `Failed to send message (Status: ${status}).`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || JSON.stringify(errorJson);
      } catch (e) {
        errorMessage = errorText.replace(/<[^>]*>?/gm, '').trim() || `Received an empty error response (Status: ${status}).`;
      }
      throw new Error(`WBIZTOOL API Error: ${errorMessage}`)
    }

    await messageResponse.json()

    return new Response(JSON.stringify({ message: 'Message queued successfully by WBIZTOOL.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})