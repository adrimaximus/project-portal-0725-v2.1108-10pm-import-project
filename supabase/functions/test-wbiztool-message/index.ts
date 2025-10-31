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
    console.log(`[WBIZTOOL-TEST] Fetching devices for Client ID: ${creds.client_id}`);
    const devicesResponse = await fetch('https://wbiztool.com/api/v2/devices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': creds.client_id,
        'x-api-key': creds.api_key,
      },
    })
    console.log(`[WBIZTOOL-TEST] Devices API response status: ${devicesResponse.status}`);
    if (!devicesResponse.ok) {
        const errorData = await devicesResponse.json().catch(() => ({}));
        throw new Error(`Failed to fetch WBIZTOOL devices: ${errorData.message || 'API request failed'}`);
    }
    
    const devicesData = await devicesResponse.json()
    console.log(`[WBIZTOOL-TEST] Found ${devicesData.data?.length || 0} devices.`);
    const activeDevice = devicesData.data?.find((d: any) => d.status === 'connected')

    if (!activeDevice) {
        console.error('[WBIZTOOL-TEST] No active device found. All devices:', devicesData.data);
        throw new Error('No active WBIZTOOL device found. Please ensure your WhatsApp device is connected in the WBIZTOOL dashboard.');
    }
    console.log(`[WBIZTOOL-TEST] Using active device ID: ${activeDevice.id}`);

    // 2. Send message using the device
    console.log(`[WBIZTOOL-TEST] Sending message to ${phone}`);
    const messageResponse = await fetch('https://wbiztool.com/api/v2/messages', {
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
    console.log(`[WBIZTOOL-TEST] Send message API response status: ${messageResponse.status}`);
    const messageData = await messageResponse.json()

    if (!messageResponse.ok) {
      console.error('[WBIZTOOL-TEST] Send message API error response:', messageData);
      throw new Error(`WBIZTOOL API Error: ${messageData.message || 'Failed to send message'}`)
    }

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