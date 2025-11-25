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

    if (req.method === 'POST') {
      const { clientId, apiKey, whatsappClientId } = await req.json()
      
      if (!clientId || !apiKey || !whatsappClientId) {
        throw new Error('Client ID, API Key, and WhatsApp Client ID are required.')
      }

      const { error: upsertError } = await supabaseAdmin
        .from('app_config')
        .upsert([
            { key: 'WBIZTOOL_CLIENT_ID', value: clientId },
            { key: 'WBIZTOOL_API_KEY', value: apiKey },
            { key: 'WBIZTOOL_WHATSAPP_CLIENT_ID', value: whatsappClientId }
        ], { onConflict: 'key' });

      if (upsertError) throw upsertError

      return new Response(JSON.stringify({ connected: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

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

    if (req.method === 'GET') {
      const { data: creds, error } = await supabaseAdmin
        .from('app_config')
        .select('key')
        .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID']);

      if (error) throw error;

      const hasClientId = creds?.some(c => c.key === 'WBIZTOOL_CLIENT_ID');
      const hasApiKey = creds?.some(c => c.key === 'WBIZTOOL_API_KEY');
      const hasWhatsappId = creds?.some(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID');

      return new Response(JSON.stringify({ connected: hasClientId && hasApiKey && hasWhatsappId }), {
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