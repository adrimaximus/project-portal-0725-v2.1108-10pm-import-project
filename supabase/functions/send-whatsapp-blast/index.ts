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

    // --- DEDUPLICATION LOGIC ---
    const uniqueMessages = [];
    const seen = new Set();
    
    for (const msg of messages) {
        const contentKey = msg.message || msg.caption || '';
        const urlKey = msg.url || '';
        const uniqueKey = `${msg.phone}-${contentKey}-${urlKey}`;
        
        if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            uniqueMessages.push(msg);
        }
    }
    // ---------------------------

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Credentials
    const { data: config, error: configError } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID', 'META_PHONE_ID', 'META_ACCESS_TOKEN']);

    if (configError) throw new Error(`Failed to get config: ${configError.message}`);

    // Sanitize credentials
    const metaPhoneId = config?.find(c => c.key === 'META_PHONE_ID')?.value?.trim();
    const metaAccessToken = config?.find(c => c.key === 'META_ACCESS_TOKEN')?.value?.trim();
    
    const wbizClientId = config?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value?.trim();
    const wbizApiKey = config?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value?.trim();
    const wbizWhatsappClientId = config?.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value?.trim();

    const results = { success: 0, failed: 0, errors: [] };

    const useMeta = !!(metaPhoneId && metaAccessToken);

    if (!useMeta && (!wbizClientId || !wbizApiKey || !wbizWhatsappClientId)) {
        throw new Error("No valid WhatsApp credentials configured (Meta or WBIZTOOL).");
    }

    // Process messages
    for (const msg of uniqueMessages) {
        try {
            let formattedPhone = msg.phone;
            // Ensure clean number for API
            formattedPhone = formattedPhone.replace(/\D/g, '');
            if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.substring(1);
            if (formattedPhone.startsWith('8')) formattedPhone = '62' + formattedPhone;

            if (useMeta) {
                // --- META OFFICIAL API ---
                let payload;
                
                if (msg.type === 'text' || (!msg.type)) {
                    payload = {
                        messaging_product: "whatsapp",
                        to: formattedPhone,
                        type: "text",
                        text: { body: msg.message || msg.caption }
                    };
                } else if (msg.type === 'image') {
                     payload = {
                        messaging_product: "whatsapp",
                        to: formattedPhone,
                        type: "image",
                        image: { 
                            link: msg.url,
                            caption: msg.caption || msg.message
                        }
                    };
                } else if (msg.type === 'document') {
                     payload = {
                        messaging_product: "whatsapp",
                        to: formattedPhone,
                        type: "document",
                        document: { 
                            link: msg.url,
                            caption: msg.caption || msg.message
                        }
                    };
                }

                const response = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${metaAccessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `Meta API Error ${response.status}`);
                }

            } else {
                // --- WBIZTOOL API ---
                let msgType = 0;
                if (msg.type === 'image') msgType = 1;
                if (msg.type === 'document') msgType = 2;

                if ((msgType === 1 || msgType === 2) && (!msg.url || typeof msg.url !== 'string' || msg.url.trim() === '')) {
                    msgType = 0; // Fallback to text
                }

                const payload = {
                    client_id: parseInt(wbizClientId, 10),
                    api_key: wbizApiKey,
                    whatsapp_client: parseInt(wbizWhatsappClientId, 10),
                    phone: formattedPhone,
                    msg_type: msgType,
                    message: msgType === 0 ? (msg.message || msg.caption || '') : (msg.caption || msg.message || ''),
                };

                if (msgType === 1) payload.img_url = msg.url;
                else if (msgType === 2) payload.file_url = msg.url;

                // Scheduling params
                if (msg.schedule_time) {
                    payload.schedule = msg.schedule_time.replace('T', ' '); 
                    if (msg.schedule_time.length === 16) payload.schedule += ':00';
                }
                if (msg.timezone) payload.timezone = msg.timezone;

                const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Client-ID': wbizClientId, 'X-Api-Key': wbizApiKey },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`WBIZTOOL API Error: ${response.statusText}`);
                }
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