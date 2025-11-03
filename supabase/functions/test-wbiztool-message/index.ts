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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: credsData, error: credsError } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);

    if (credsError || !credsData || credsData.length < 2) {
      throw new Error('WBIZTOOL credentials not found in app configuration.');
    }

    const clientId = credsData.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const apiKey = credsData.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');

    if (!clientId || !apiKey || !whatsappClientId) {
      throw new Error("WBIZTOOL credentials missing or invalid. Please check app_config table.");
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