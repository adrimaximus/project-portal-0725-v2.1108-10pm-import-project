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
    // Ensure we don't send duplicates to the same phone number with the same content in this batch
    const uniqueMessages = [];
    const seen = new Set();
    
    for (const msg of messages) {
        // Create a unique key based on phone and content (message/caption/url)
        const contentKey = msg.message || msg.caption || '';
        const urlKey = msg.url || '';
        const uniqueKey = `${msg.phone}-${contentKey}-${urlKey}`;
        
        if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            uniqueMessages.push(msg);
        }
    }

    if (uniqueMessages.length < messages.length) {
        console.log(`[Backend Deduplication] Removed ${messages.length - uniqueMessages.length} duplicate messages from batch.`);
    }
    // ---------------------------

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Credentials
    const { data: wbizConfig, error: configError } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID']);

    if (configError) throw new Error(`Failed to get WBIZTOOL config: ${configError.message}`);

    const clientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const apiKey = wbizConfig?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const whatsappClientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value;

    if (!clientId || !apiKey || !whatsappClientId) {
        throw new Error("WBIZTOOL credentials not fully configured.");
    }

    const results = { success: 0, failed: 0, errors: [] };

    // Process messages
    for (const msg of uniqueMessages) {
        try {
            // Map message type to WBIZTOOL format
            // 0: Text, 1: Image, 2: Document
            let msgType = 0;
            if (msg.type === 'image') msgType = 1;
            if (msg.type === 'document') msgType = 2;

            // SAFETY FALLBACK:
            // If it's a media type but the URL is missing or empty, fallback to text (type 0).
            if ((msgType === 1 || msgType === 2) && (!msg.url || typeof msg.url !== 'string' || msg.url.trim() === '')) {
                console.warn(`[send-whatsapp-blast] Warning: Media message to ${msg.phone} has invalid URL. Fallback to text.`);
                msgType = 0;
            }

            const payload: any = {
                client_id: parseInt(clientId, 10),
                api_key: apiKey,
                whatsapp_client: parseInt(whatsappClientId, 10),
                phone: msg.phone,
                msg_type: msgType, // Explicitly sending msg_type
            };

            // Handle text vs caption logic
            if (msgType === 0) {
                payload.message = msg.message || msg.caption || ''; // Use caption as message if we fell back
            } else {
                // For media, map 'url' to the correct WBIZTOOL parameter based on documentation
                if (msgType === 1) {
                    payload.img_url = msg.url;
                } else if (msgType === 2) {
                    payload.file_url = msg.url;
                }
                
                payload.message = msg.caption || msg.message || ''; 
            }

            // Add scheduling parameters if present
            if (msg.schedule_time) {
                payload.schedule = msg.schedule_time.replace('T', ' '); 
                if (msg.schedule_time.length === 16) payload.schedule += ':00';
            }
            if (msg.timezone) {
                payload.timezone = msg.timezone;
            }

            console.log(`Sending to ${msg.phone}, Type: ${msgType}`);

            const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Client-ID': clientId, 'X-Api-Key': apiKey },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const status = response.status;
                const errorText = await response.text();
                let errorMessage = `Failed to send message (Status: ${status}).`;
    
                if (errorText.includes("Cloudflare") || errorText.includes("524") || errorText.includes("502")) {
                     if (status === 524) errorMessage = "WBIZTOOL API Timeout (Cloudflare 524).";
                     else if (status === 502) errorMessage = "WBIZTOOL API Bad Gateway (Cloudflare 502).";
                     else errorMessage = `WBIZTOOL API Error (Status: ${status}).`;
                } else {
                    try {
                      const errorJson = JSON.parse(errorText);
                      errorMessage = errorJson.message || JSON.stringify(errorJson);
                    } catch (e) {
                      const cleanText = errorText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
                      errorMessage = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
                    }
                }
                console.error(`WBIZTOOL API Error for ${msg.phone}:`, errorMessage);
                throw new Error(errorMessage);
            }

            results.success++;
        } catch (error) {
            console.error(`Failed to send to ${msg.phone}:`, error);
            results.failed++;
            // Push structured error object
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