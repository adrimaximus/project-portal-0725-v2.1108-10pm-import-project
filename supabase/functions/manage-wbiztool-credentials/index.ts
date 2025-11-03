// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
}

const validateCredentials = async (clientId: string, apiKey: string) => {
  // We'll try to hit the devices endpoint.
  // A successful response (even if empty) means auth is OK. A 401/403 means auth failed.
  const validationResponse = await fetch('https://wbiztool.com/api/v1/devices', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-ID': clientId,
      'X-Api-Key': apiKey,
    },
  });

  if (validationResponse.status === 401 || validationResponse.status === 403) {
    throw new Error('Invalid WBIZTOOL credentials. Please check Client ID or API Key.');
  }

  // If we get any other error, it's a problem.
  if (!validationResponse.ok) {
    const errorText = await validationResponse.text();
    throw new Error(`WBIZTOOL API unexpected error: ${errorText.replace(/<[^>]*>?/gm, '').trim()}`);
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