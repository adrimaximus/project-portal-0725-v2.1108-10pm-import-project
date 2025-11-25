// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

    const { data: creds, error: credsError } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['META_PHONE_ID', 'META_ACCESS_TOKEN']);

    if (credsError || !creds) throw new Error('Credentials not found.');

    const phoneId = creds.find(c => c.key === 'META_PHONE_ID')?.value;
    const accessToken = creds.find(c => c.key === 'META_ACCESS_TOKEN')?.value;

    if (!phoneId || !accessToken) {
      throw new Error("WhatsApp Official credentials missing.");
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: message }
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Meta API Error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ message: 'Message sent successfully.', data }), {
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