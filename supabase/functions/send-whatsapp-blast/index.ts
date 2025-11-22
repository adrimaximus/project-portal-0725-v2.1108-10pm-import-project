// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
        throw new Error("Invalid payload: 'messages' array is required.");
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Credentials
    const { data: wbizConfig, error: configError } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);

    if (configError) throw new Error(`Failed to get WBIZTOOL config: ${configError.message}`);

    const clientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const apiKey = wbizConfig?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');

    if (!clientId || !apiKey || !whatsappClientId) {
        throw new Error("WBIZTOOL credentials not fully configured.");
    }

    const results = { success: 0, failed: 0, errors: [] };

    // Process messages
    for (const msg of messages) {
        try {
            // Map message type to WBIZTOOL format
            // 0: Text, 1: Image, 2: Document
            let msgType = 0;
            if (msg.type === 'image') msgType = 1;
            if (msg.type === 'document') msgType = 2;

            const payload: any = {
                client_id: parseInt(clientId, 10),
                api_key: apiKey,
                whatsapp_client: parseInt(whatsappClientId, 10),
                phone: msg.phone,
                message: msg.message,
                msg_type: msgType,
                url: msg.url || '', 
            };

            // Add scheduling parameters if present
            if (msg.schedule_time) {
                // Ensure format is YYYY-MM-DD HH:mm:ss
                payload.schedule = msg.schedule_time.replace('T', ' '); 
                if (msg.schedule_time.length === 16) payload.schedule += ':00'; // Append seconds if missing
            }
            if (msg.timezone) {
                payload.timezone = msg.timezone;
            }

            const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Client-ID': clientId, 'X-Api-Key': apiKey },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`API Status ${response.status}: ${text}`);
            }
            results.success++;
        } catch (error) {
            console.error(`Failed to send to ${msg.phone}:`, error);
            results.failed++;
            results.errors.push({ phone: msg.phone, error: error.message });
        }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});