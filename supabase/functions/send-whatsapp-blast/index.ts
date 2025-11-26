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
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) throw new Error('Messages array is required.')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: creds, error: credsError } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID', 'WBIZTOOL_PUBLICATION_CLIENT_ID'])

    if (credsError || !creds) throw new Error('Database error fetching credentials.')

    const clientId = creds.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value
    const apiKey = creds.find(c => c.key === 'WBIZTOOL_API_KEY')?.value
    // Priority: Publication ID -> System ID
    const whatsappClientId = creds.find(c => c.key === 'WBIZTOOL_PUBLICATION_CLIENT_ID')?.value || creds.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value

    if (!clientId || !apiKey || !whatsappClientId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "WBIZTOOL credentials (Publication or System) not fully configured." 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Function to send a single message
    const sendMessage = async (msg: any) => {
      // ADDED trailing slashes which are often required by WBIZTOOL
      const endpoint = msg.type === 'text' 
        ? 'https://wbiztool.com/api/v1/send_msg/' 
        : 'https://wbiztool.com/api/v1/send_media/';
      
      const payload: any = {
        client_id: parseInt(clientId, 10),
        api_key: apiKey,
        whatsapp_client: parseInt(whatsappClientId, 10),
        phone: msg.phone,
      };

      if (msg.type === 'text') {
        payload.msg = msg.message;
      } else {
        payload.url = msg.url;
        payload.caption = msg.caption || msg.message;
        payload.media_type = msg.type === 'image' ? 'image' : 'document'; 
      }
      
      if (msg.schedule_time) {
          payload.schedule = msg.schedule_time;
          if (msg.timezone) payload.timezone = msg.timezone;
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const text = await response.text();
          try {
             const json = JSON.parse(text);
             throw new Error(json.message || json.msg || json.error || `HTTP ${response.status}`);
          } catch (e) {
             const cleanText = text.replace(/<[^>]*>?/gm, '').substring(0, 150); 
             throw new Error(`HTTP ${response.status}: ${cleanText.trim() || 'Unknown Error'}`);
          }
        }

        const data = await response.json();
        return data;
      } catch (e) {
        throw e;
      }
    };

    // Execute all requests
    const results = await Promise.all(messages.map(async (msg) => {
      try {
        const res = await sendMessage(msg);
        const isSuccess = res.status === 1 || (res.success === true); 
        return { phone: msg.phone, success: isSuccess, error: isSuccess ? null : (res.msg || res.message || 'Unknown provider error') };
      } catch (e) {
        return { phone: msg.phone, success: false, error: e.message };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const errors = results.filter(r => !r.success);

    if (successCount === 0 && failureCount > 0) {
        const firstError = errors[0].error;
        if (firstError.includes("Invalid Client") || firstError.includes("credential") || firstError.includes("HTTP")) {
             return new Response(JSON.stringify({ 
                success: false, 
                error: `Provider Error: ${firstError}`,
                failed: failureCount 
             }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
        }
    }

    return new Response(JSON.stringify({ 
      message: 'Batch processed', 
      success: successCount, 
      failed: failureCount,
      errors: errors 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})