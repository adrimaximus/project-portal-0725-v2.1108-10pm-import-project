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
    const { phone, message } = await req.json()
    if (!phone || !message) throw new Error('Phone number and message are required.')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not found')

    const { data: creds, error: credsError } = await supabaseClient
      .from('wbiztool_credentials')
      .select('client_id, api_key')
      .single()

    if (credsError || !creds) throw new Error('WBIZTOOL credentials not found.')

    // 1. Fetch devices
    const devicesResponse = await fetch('https://wbiztool.com/api/v1/devices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': creds.client_id,
        'x-api-key': creds.api_key,
      },
    })
    if (!devicesResponse.ok) {
        const status = devicesResponse.status;
        const errorText = await devicesResponse.text();
        let errorMessage = `An unknown error occurred (Status: ${status}).`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
          errorMessage = errorText.replace(/<[^>]*>?/gm, '').trim() || `Received an empty error response (Status: ${status}).`;
        }
        throw new Error(`Failed to fetch WBIZTOOL devices: ${errorMessage}`);
    }
    
    const devicesData = await devicesResponse.json()
    const activeDevice = devicesData.data?.find((d: any) => d.status === 'connected')

    if (!activeDevice) {
        throw new Error('No active WBIZTOOL device found. Please ensure your WhatsApp device is connected in the WBIZTOOL dashboard.');
    }

    // 2. Send message using the device
    const messageResponse = await fetch('https://wbiztool.com/api/v1/send_msg/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': creds.client_id,
        'x-api-key': creds.api_key,
      },
      body: JSON.stringify({
        phone,
        message,
        device_id: activeDevice.id,
      }),
    })
    
    if (!messageResponse.ok) {
      const status = messageResponse.status;
      const errorText = await messageResponse.text();
      let errorMessage = `Failed to send message (Status: ${status}).`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || JSON.stringify(errorJson);
      } catch (e) {
        errorMessage = errorText.replace(/<[^>]*>?/gm, '').trim() || `Received an empty error response (Status: ${status}).`;
      }
      throw new Error(`WBIZTOOL API Error: ${errorMessage}`)
    }

    await messageResponse.json()

    return new Response(JSON.stringify({ message: 'Message queued successfully by WBIZTOOL.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})