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
      const endpoint = msg.type === 'text' 
        ? 'https://wbiztool.com/api/v1/send_msg' 
        : 'https://wbiztool.com/api/v1/send_media';
      
      const payload: any = {
        client_id: clientId,
        api_key: apiKey,
        whatsapp_client: whatsappClientId,
        phone: msg.phone,
      };

      if (msg.type === 'text') {
        payload.msg = msg.message;
      } else {
        payload.url = msg.url;
        payload.caption = msg.caption || msg.message;
        payload.media_type = msg.type === 'image' ? 'image' : 'document'; // Adjust as needed for file types
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
          throw new Error(`HTTP ${response.status}: ${text}`);
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
        // WBIZTOOL usually returns status: 1 for success
        const isSuccess = res.status === 1 || (res.success === true); 
        return { phone: msg.phone, success: isSuccess, error: isSuccess ? null : (res.msg || res.message || 'Unknown provider error') };
      } catch (e) {
        return { phone: msg.phone, success: false, error: e.message };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const errors = results.filter(r => !r.success);

    // If everything failed, return a global error flag to help frontend debugging
    if (successCount === 0 && failureCount > 0) {
        // Check if it's a common auth error
        const firstError = errors[0].error;
        if (firstError.includes("Invalid Client") || firstError.includes("credential")) {
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
      status: 200, // Return 200 to avoid CORS issues, frontend handles success: false
    })
  }
})