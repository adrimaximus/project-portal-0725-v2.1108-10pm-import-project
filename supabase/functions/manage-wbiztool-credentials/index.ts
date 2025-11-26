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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const body = await req.json()
      
      // Case 1: Fetch Devices from WBIZTOOL
      if (body.action === 'fetch_devices') {
        const { clientId, apiKey } = body;
        
        if (!clientId || !apiKey) {
            throw new Error('Client ID and API Key are required');
        }

        // Construct URL with query parameters
        // IMPORTANT: No trailing slash
        const url = new URL('https://wbiztool.com/api/v1/whatsapp_clients');
        url.searchParams.append('client_id', clientId);
        url.searchParams.append('api_key', apiKey);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const text = await response.text();

        // Handle HTML/Error responses
        if (!response.ok || text.trim().startsWith('<')) {
            console.error('WBIZTOOL API Error:', text);
            let errorMsg = `WBIZTOOL API Error: HTTP ${response.status}`;
            
            if (text.includes('404')) errorMsg = 'WBIZTOOL API Endpoint Not Found (404). URL structure might be incorrect.';
            if (text.includes('Invalid API Key')) errorMsg = 'Invalid WBIZTOOL API Credentials.';
            
            throw new Error(errorMsg);
        }

        try {
            const data = JSON.parse(text);
            return new Response(JSON.stringify({ devices: data }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        } catch (e) {
            throw new Error(`Failed to parse WBIZTOOL response (Not JSON). Response: ${text.substring(0, 100)}...`);
        }
      }

      // Case 2: Save Credentials to Database
      const { clientId, apiKey, whatsappClientId, publicationClientId } = body;
      
      const updates = [
        { key: 'WBIZTOOL_CLIENT_ID', value: clientId },
        { key: 'WBIZTOOL_API_KEY', value: apiKey },
        { key: 'WBIZTOOL_WHATSAPP_CLIENT_ID', value: whatsappClientId },
        { key: 'WBIZTOOL_PUBLICATION_CLIENT_ID', value: publicationClientId },
      ];

      // Only update keys that are provided/defined
      for (const update of updates) {
          if (update.value !== undefined) {
             const { error } = await supabaseAdmin.from('app_config').upsert(update, { onConflict: 'key' });
             if (error) throw error;
          }
      }

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Case 3: Get Current Connection Status
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
            .from('app_config')
            .select('key, value')
            .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID', 'WBIZTOOL_PUBLICATION_CLIENT_ID']);
        
        if (error) throw error;

        const config: Record<string, string> = {};
        data?.forEach(item => config[item.key] = item.value);

        const connected = !!(config.WBIZTOOL_CLIENT_ID && config.WBIZTOOL_API_KEY);

        return new Response(JSON.stringify({ 
            connected,
            whatsappClientId: config.WBIZTOOL_WHATSAPP_CLIENT_ID,
            publicationClientId: config.WBIZTOOL_PUBLICATION_CLIENT_ID
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})