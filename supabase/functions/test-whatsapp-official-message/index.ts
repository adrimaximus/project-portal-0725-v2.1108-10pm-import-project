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

    // Fetch credentials
    const { data: creds, error: credsError } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['META_PHONE_ID', 'META_ACCESS_TOKEN']);

    if (credsError) {
        console.error("Database error fetching credentials:", credsError);
        throw new Error('Database error fetching credentials.');
    }

    if (!creds || creds.length === 0) {
        console.error("No credentials found in app_config.");
        throw new Error('No WhatsApp configuration found. Please save your credentials first.');
    }

    const phoneId = creds.find(c => c.key === 'META_PHONE_ID')?.value;
    const accessToken = creds.find(c => c.key === 'META_ACCESS_TOKEN')?.value;

    if (!phoneId || !accessToken) {
      throw new Error("Incomplete WhatsApp configuration. Missing Phone ID or Access Token.");
    }

    // Normalize phone number just in case (remove + and non-digits)
    // Meta requires country code without +
    const cleanPhone = phone.replace(/\D/g, '');

    // Call Meta API
    console.log(`Attempting to send message to ${cleanPhone} via Phone ID ${phoneId}`);
    
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "text",
            text: { body: message }
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Meta API Error Response:", JSON.stringify(data));
        
        const errorObj = data.error || {};
        const message = errorObj.message || 'Unknown Meta API error';
        const type = errorObj.type || '';
        const code = errorObj.code || '';
        
        // Construct a detailed error message
        let detailedError = `Meta API Error ${code}: ${message}`;
        if (type) detailedError += ` (${type})`;
        
        // Add specific hints for common errors
        if (code === 190) detailedError += " - Access Token may have expired.";
        if (code === 131030) detailedError += " - Recipient phone number is not a valid WhatsApp user.";
        if (code === 131000) detailedError += " - Something went wrong with the request structure.";
        if (code === 131026) detailedError += " - Message failed to send (Policy violation or spam detection).";
        if (code === 100) detailedError += " - Invalid parameter. Check Phone ID.";
        if (code === 131009) detailedError += " - Parameter value is invalid. Check if the phone number format is correct (e.g., 62812...).";

        throw new Error(detailedError);
    }

    return new Response(JSON.stringify({ message: 'Message sent successfully.', data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})