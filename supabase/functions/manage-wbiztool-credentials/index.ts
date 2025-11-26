// @ts-nocheck
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

    if (req.method === 'GET') {
        const { data: creds, error } = await supabaseAdmin
            .from('app_config')
            .select('key, value')
            .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID', 'WBIZTOOL_PUBLICATION_CLIENT_ID'])

        if (error) throw error

        const clientId = creds.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value
        const apiKey = creds.find(c => c.key === 'WBIZTOOL_API_KEY')?.value
        const whatsappClientId = creds.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value
        const publicationClientId = creds.find(c => c.key === 'WBIZTOOL_PUBLICATION_CLIENT_ID')?.value

        return new Response(JSON.stringify({
            connected: !!(clientId && apiKey && whatsappClientId),
            whatsappClientId,
            publicationClientId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    if (req.method === 'DELETE') {
        await supabaseAdmin.from('app_config').delete().in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID', 'WBIZTOOL_PUBLICATION_CLIENT_ID']);
        return new Response(JSON.stringify({ message: 'Disconnected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (req.method === 'POST') {
        let { clientId, apiKey, whatsappClientId, publicationClientId, action } = await req.json()

        if (action === 'fetch_devices') {
            // Fallback to DB credentials if not provided in request
            if (!clientId || !apiKey) {
                const { data: creds } = await supabaseAdmin
                    .from('app_config')
                    .select('key, value')
                    .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY'])
                
                if (creds) {
                    if (!clientId) clientId = creds.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value
                    if (!apiKey) apiKey = creds.find(c => c.key === 'WBIZTOOL_API_KEY')?.value
                }
            }

            if (!clientId || !apiKey) throw new Error("Missing credentials to fetch devices")
            
            // Proxy to WBIZTOOL
            try {
                const response = await fetch(`https://wbiztool.com/api/v1/device/get?client_id=${clientId}&api_key=${apiKey}`);
                const data = await response.json();
                
                if (data.status === 1 && data.data) {
                     return new Response(JSON.stringify({ devices: data.data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
                } else {
                     return new Response(JSON.stringify({ devices: [], error: data.msg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
                }
            } catch (e) {
                throw new Error("Failed to reach WBIZTOOL API: " + e.message);
            }
        }

        // Save credentials
        const upserts = [
            { key: 'WBIZTOOL_CLIENT_ID', value: clientId },
            { key: 'WBIZTOOL_API_KEY', value: apiKey },
            { key: 'WBIZTOOL_WHATSAPP_CLIENT_ID', value: whatsappClientId }
        ]
        
        // Only save publication ID if provided, otherwise delete it or keep it? 
        // Better to save it, even if empty string to clear it.
        if (publicationClientId !== undefined) {
            upserts.push({ key: 'WBIZTOOL_PUBLICATION_CLIENT_ID', value: publicationClientId });
        }

        const { error } = await supabaseAdmin.from('app_config').upsert(upserts, { onConflict: 'key' })
        if (error) throw error

        return new Response(JSON.stringify({ message: 'Saved' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})