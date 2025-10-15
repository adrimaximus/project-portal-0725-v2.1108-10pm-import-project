// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).trim().replace(/\D/g, '');
  
  if (cleaned.startsWith('62')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.substring(1);
  }
  if (cleaned.length > 8 && cleaned.startsWith('8')) {
    return '62' + cleaned;
  }
  return cleaned;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedInternalSecret = Deno.env.get('INTERNAL_SECRET');

    if (internalSecret && expectedInternalSecret && internalSecret === expectedInternalSecret) {
      // Panggilan internal, lewati autentikasi pengguna
    } else {
      // Panggilan eksternal, periksa autentikasi pengguna
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");
    }

    const { phone, message } = await req.json();
    if (!phone || !message) {
      throw new Error("Phone number and message are required.");
    }
    
    const formattedPhone = formatPhoneNumber(phone);

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

    const whatsappClientIdStr = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');
    if (!whatsappClientIdStr) {
      throw new Error("WBIZTOOL WhatsApp Client ID is not configured on the server.");
    }
    const whatsappClientId = parseInt(whatsappClientIdStr, 10);
    if (isNaN(whatsappClientId)) {
      throw new Error("WBIZTOOL WhatsApp Client ID is not a valid number.");
    }

    const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId,
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        client_id: parseInt(clientId, 10),
        api_key: apiKey,
        phone: formattedPhone,
        message: message,
        whatsapp_client: whatsappClientId,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || `WBIZTOOL API Error: ${response.statusText}`);
    }

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