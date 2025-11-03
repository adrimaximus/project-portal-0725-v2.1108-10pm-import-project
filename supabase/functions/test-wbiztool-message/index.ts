// @ts-nocheck
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: credsData, error: credsError } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);

    if (credsError || !credsData || credsData.length < 2) {
      throw new Error('WBIZTOOL credentials not found in app configuration.');
    }

    const clientId = credsData.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const apiKey = credsData.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;

    if (!clientId || !apiKey) {
      throw new Error('WBIZTOOL credentials not fully configured.');
    }

    // 1. Fetch devices
    const devicesResponse = await fetch('https://wbiztool.com/api/v2/devices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-api-key': apiKey,
      },
    });

    if (!devicesResponse.ok) {
      const errorData = await devicesResponse.json().catch(() => ({}));
      throw new Error(`WBIZTOOL API Error (devices): ${errorData.message || 'Invalid credentials'}`);
    }
    
    const devicesData = await devicesResponse.json();
    const activeDevice = devicesData.data?.find((d: any) => d.status === 'connected');

    if (!activeDevice) {
      throw new Error('No active WBIZTOOL device found.');
    }

    // 2. Send message using the device
    const messageResponse = await fetch('https://wbiztool.com/api/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-api-key': apiKey,
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