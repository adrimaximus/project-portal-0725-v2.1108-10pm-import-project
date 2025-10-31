import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    if (req.method === 'POST') {
      const { clientId, apiKey } = await req.json()
      if (!clientId || !apiKey) throw new Error('Client ID and API Key are required.')

      const wbizResponse = await fetch('https://wbiztool.com/api/v1/devices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey,
        },
      })
      
      if (!wbizResponse.ok) {
        const status = wbizResponse.status;
        const errorText = await wbizResponse.text();
        let errorMessage = `An unknown error occurred (Status: ${status}).`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
          errorMessage = errorText.replace(/<[^>]*>?/gm, '').trim() || `Received an empty error response (Status: ${status}).`;
        }
        throw new Error(`WBIZTOOL API Error: ${errorMessage}`);
      }

      const { error: upsertError } = await supabaseClient
        .from('wbiztool_credentials')
        .upsert({ user_id: user.id, client_id: clientId, api_key: apiKey })

      if (upsertError) throw upsertError

      return new Response(JSON.stringify({ connected: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (req.method === 'DELETE') {
      const { error } = await supabaseClient
        .from('wbiztool_credentials')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error

      return new Response(JSON.stringify({ connected: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (req.method === 'GET') {
      const { data: creds, error } = await supabaseClient
        .from('wbiztool_credentials')
        .select('client_id, api_key')
        .single()

      if (error || !creds) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      const wbizResponse = await fetch('https://wbiztool.com/api/v1/devices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': creds.client_id,
          'x-api-key': creds.api_key,
        },
      })

      const connected = wbizResponse.ok
      
      return new Response(JSON.stringify({ connected }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
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