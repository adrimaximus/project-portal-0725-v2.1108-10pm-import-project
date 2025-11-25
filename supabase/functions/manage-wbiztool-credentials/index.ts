// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not found')

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle POST requests
    if (req.method === 'POST') {
      const { action, clientId, apiKey, whatsappClientId } = await req.json()

      // Action: Fetch Devices (WhatsApp Clients)
      if (action === 'fetch_devices') {
        let targetClientId = clientId;
        let targetApiKey = apiKey;

        // If credentials not provided in body, try to fetch from DB
        if (!targetClientId || !targetApiKey) {
            const { data: creds } = await supabaseAdmin
                .from('app_config')
                .select('key, value')
                .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);
            
            targetClientId = creds?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
            targetApiKey = creds?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
        }

        if (!targetClientId || !targetApiKey) {
            throw new Error('Credentials missing. Please enter Client ID and API Key first.');
        }

        // Sanitize for fetch
        const cleanClientId = String(targetClientId).trim();
        const cleanApiKey = String(targetApiKey).trim();

        // Call WBIZTOOL API to list clients
        const response = await fetch('https://wbiztool.com/api/v1/whatsapp_clients/', {
            method: 'GET',
            headers: {
                'X-Client-ID': cleanClientId,
                'X-Api-Key': cleanApiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`WBIZTOOL API Error: ${response.statusText} - ${errorText}`);
        }

        const devices = await response.json();
        return new Response(JSON.stringify({ devices }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }

      // Default Action: Save Credentials
      if (!clientId || !apiKey || !whatsappClientId) {
        throw new Error('Client ID, API Key, and WhatsApp Client ID are required.')
      }

      // Sanitize inputs
      const cleanClientId = String(clientId).trim();
      const cleanApiKey = String(apiKey).trim();
      const cleanWhatsappId = String(whatsappClientId).trim();

      const { error: upsertError } = await supabaseAdmin
        .from('app_config')
        .upsert([
            { key: 'WBIZTOOL_CLIENT_ID', value: cleanClientId },
            { key: 'WBIZTOOL_API_KEY', value: cleanApiKey },
            { key: 'WBIZTOOL_WHATSAPP_CLIENT_ID', value: cleanWhatsappId }
        ], { onConflict: 'key' });

      if (upsertError) throw upsertError

      return new Response(JSON.stringify({ connected: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin
        .from('app_config')
        .delete()
        .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID']);
      
      if (error) throw error

      return new Response(JSON.stringify({ connected: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Handle GET request (Check status)
    if (req.method === 'GET') {
      const { data: creds, error } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID']);

      if (error) throw error;

      const hasClientId = creds?.some(c => c.key === 'WBIZTOOL_CLIENT_ID');
      const hasApiKey = creds?.some(c => c.key === 'WBIZTOOL_API_KEY');
      const whatsappClientIdObj = creds?.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID');

      return new Response(JSON.stringify({ 
          connected: hasClientId && hasApiKey && !!whatsappClientIdObj,
          whatsappClientId: whatsappClientIdObj?.value || ''
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})