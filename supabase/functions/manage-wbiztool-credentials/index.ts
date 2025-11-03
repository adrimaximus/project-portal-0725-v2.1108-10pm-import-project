// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
}

const validateCredentials = async (clientId: string, apiKey: string) => {
  // Kita test koneksi pakai send_msg tapi tanpa kirim pesan (pakai method HEAD)
  const wbizResponse = await fetch('https://wbiztool.com/api/v1/send_msg/', {
    method: 'HEAD',
    headers: {
      'x-client-id': clientId,
      'x-api-key': apiKey,
    },
  });

  if (wbizResponse.status === 401 || wbizResponse.status === 403) {
    throw new Error('Invalid WBIZTOOL credentials. Please check Client ID or API Key.');
  }

  if (wbizResponse.status === 404) {
    // treat as OK — berarti endpoint ada tapi tidak support HEAD/GET
    console.warn('WBIZTOOL returned 404 but likely credentials are valid (no read endpoint)');
    return true;
  }

  if (!wbizResponse.ok) {
    throw new Error(`WBIZTOOL unexpected response (Status: ${wbizResponse.status})`);
  }

  return true;
};

serve(async (req) => {
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
      const { clientId, apiKey } = await req.json()
      if (!clientId || !apiKey) throw new Error('Client ID and API Key are required.')

      await validateCredentials(clientId, apiKey);

      const { error: upsertError } = await supabaseAdmin
        .from('app_config')
        .upsert([
            { key: 'WBIZTOOL_CLIENT_ID', value: clientId },
            { key: 'WBIZTOOL_API_KEY', value: apiKey }
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
        .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);
      
      if (error) throw error

      return new Response(JSON.stringify({ connected: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (req.method === 'GET') {
      const { data: creds, error } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);

      if (error || !creds || creds.length < 2) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      const clientId = creds.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
      const apiKey = creds.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;

      if (!clientId || !apiKey) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      try {
        await validateCredentials(clientId, apiKey);
        return new Response(JSON.stringify({ connected: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (validationError) {
        console.warn("Stored WBIZTOOL credentials are no longer valid:", validationError.message);
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
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