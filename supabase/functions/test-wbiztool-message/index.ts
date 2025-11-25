// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

    const { data: creds, error: credsError } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID']);

    if (credsError || !creds) {
      throw new Error('WBIZTOOL credentials not found in app_config.');
    }

    const clientId = creds.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const apiKey = creds.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const whatsappClientId = creds.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value;

    if (!clientId || !apiKey || !whatsappClientId) {
      throw new Error("WBIZTOOL credentials missing or invalid. Please check settings.");
    }

    // Call WBIZTOOL API
    console.log(`Sending test message to ${phone} via WBIZTOOL (Device ${whatsappClientId})`);

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

      // Handle Cloudflare or Proxy errors
      if (errorText.includes("Cloudflare") || errorText.includes("524") || errorText.includes("502")) {
         if (status === 524) errorMessage = "WBIZTOOL API Timeout (Cloudflare 524). The service is taking too long to respond.";
         else if (status === 502) errorMessage = "WBIZTOOL API Bad Gateway (Cloudflare 502). The service is down.";
         else errorMessage = `WBIZTOOL API Error (Status: ${status}). Service might be experiencing issues.`;
      } else {
          // Try to parse JSON error from WBIZTOOL
          try {
            const errorJson = JSON.parse(errorText);
            // WBIZTOOL errors can be in different formats
            errorMessage = errorJson.message || errorJson.error || errorJson.detail || JSON.stringify(errorJson);
          } catch (e) {
            // If not JSON, clean up HTML tags if present (fallback)
            const cleanText = errorText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            errorMessage = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
          }
      }
      throw new Error(`WBIZTOOL API Error: ${errorMessage}`);
    }

    const result = await messageResponse.json();

    return new Response(JSON.stringify({ message: 'Message queued successfully by WBIZTOOL.', data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("WBIZTOOL Test Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})