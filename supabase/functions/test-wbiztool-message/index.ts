import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, message, type } = await req.json()
    
    if (!phone || !message) {
        throw new Error('Phone and message are required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Credentials
    const { data: creds, error: credsError } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID', 'WBIZTOOL_PUBLICATION_CLIENT_ID'])

    if (credsError) throw credsError;

    const clientId = creds.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value
    const apiKey = creds.find(c => c.key === 'WBIZTOOL_API_KEY')?.value
    
    // Use publication ID if type is publication, otherwise default/system ID
    let whatsappClientId = creds.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value;
    if (type === 'publication') {
        whatsappClientId = creds.find(c => c.key === 'WBIZTOOL_PUBLICATION_CLIENT_ID')?.value;
    }

    if (!clientId || !apiKey || !whatsappClientId) {
        throw new Error('WBIZTOOL credentials not fully configured.');
    }

    // Send Message
    // Endpoint WITHOUT trailing slash
    const endpoint = 'https://wbiztool.com/api/v1/send_msg';
    
    const payload = {
        client_id: parseInt(clientId, 10),
        api_key: apiKey,
        whatsapp_client: parseInt(whatsappClientId, 10),
        phone: phone,
        msg: message
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    
    if (!response.ok || text.trim().startsWith('<')) {
        let errMsg = `Provider Error (${response.status})`;
        if (text.includes('404')) errMsg = 'Provider Endpoint Not Found (404)';
        throw new Error(errMsg);
    }

    try {
        const data = JSON.parse(text);
        if (data.status === 1 || data.success) {
            return new Response(JSON.stringify({ success: true, message: 'Message sent successfully' }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        } else {
            throw new Error(data.msg || data.message || 'Unknown provider error');
        }
    } catch (e) {
        if (e.message.includes('Unknown provider error')) throw e;
        throw new Error('Failed to parse provider response');
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})