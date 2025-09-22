// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const formatPhoneNumber = (phone) => {
  const trimmedPhone = phone.trim();
  if (trimmedPhone.startsWith('+62')) {
    return '62' + trimmedPhone.substring(3);
  }
  if (trimmedPhone.startsWith('0')) {
    return '62' + trimmedPhone.substring(1);
  }
  return trimmedPhone;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    // 2. Get request body
    const { phone, message } = await req.json();
    if (!phone || !message) {
      throw new Error("Phone number and message are required.");
    }
    
    const formattedPhone = formatPhoneNumber(phone);

    // 3. Retrieve credentials using admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'WBIZTOOL_CLIENT_ID')
      .single();
    if (clientError || !clientData) throw new Error("WBIZTOOL Client ID not configured.");

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'WBIZTOOL_API_KEY')
      .single();
    if (keyError || !keyData) throw new Error("WBIZTOOL API Key not configured.");

    const clientId = clientData.value;
    const apiKey = keyData.value;

    // 4. Make the API call to WBIZTOOL
    const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId,
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || `WBIZTOOL API Error: ${response.statusText}`);
    }

    // 5. Return success response
    return new Response(JSON.stringify({ message: "Message sent successfully via WBIZTOOL.", details: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});