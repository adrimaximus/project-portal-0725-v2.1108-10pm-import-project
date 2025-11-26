// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to format phone numbers for WBIZTOOL
const formatPhoneNumberForApi = (phone: string): string | null => {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    }
    if (cleaned.startsWith('62')) {
      return cleaned;
    }
    if (cleaned.length > 8 && cleaned.startsWith('8')) {
      return '62' + cleaned;
    }
    // Return null if it's not a recognizable Indonesian format
    return null;
};

// Helper to send WhatsApp message
const sendWhatsappMessage = async (supabaseAdmin, phone: string, message: string) => {
    const { data: wbizConfig, error: configError } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID']);

    if (configError) throw new Error(`Failed to get WBIZTOOL config: ${configError.message}`);

    const clientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const apiKey = wbizConfig?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const whatsappClientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value;

    if (!clientId || !apiKey || !whatsappClientId) {
        console.warn("WBIZTOOL credentials not fully configured. Skipping WhatsApp message.");
        return;
    }

    const formattedPhone = formatPhoneNumberForApi(phone);
    if (!formattedPhone) {
        console.warn(`Invalid phone number format: ${phone}. Skipping WhatsApp message.`);
        return;
    }

    const payload = {
        client_id: parseInt(clientId, 10),
        api_key: apiKey,
        whatsapp_client: parseInt(whatsappClientId, 10),
        phone: formattedPhone,
        message: message,
        msg_type: 0, // Added required parameter
    };

    const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-ID': clientId, 'X-Api-Key': apiKey },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const status = response.status;
        const errorText = await response.text();
        let errorMessage = `Failed to send message (Status: ${status}).`;

        // Enhanced Error Handling for HTML/Cloudflare pages
        if (errorText.includes("Cloudflare") || errorText.includes("524") || errorText.includes("502")) {
             if (status === 524) errorMessage = "WBIZTOOL API Timeout (Cloudflare 524). The service is taking too long to respond.";
             else if (status === 502) errorMessage = "WBIZTOOL API Bad Gateway (Cloudflare 502). The service is down.";
             else errorMessage = `WBIZTOOL API Error (Status: ${status}). Service might be experiencing issues.`;
        } else {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || JSON.stringify(errorJson);
            } catch (e) {
              // Clean up HTML tags and truncate
              const cleanText = errorText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
              errorMessage = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
            }
        }
        throw new Error(`WBIZTOOL API Error: ${errorMessage}`);
    }
    console.log(`WhatsApp message sent to ${formattedPhone}`);
};

// Helper to send Email
const sendEmail = async (supabaseAdmin, to: string, subject: string, html: string, text: string) => {
    const { data: config, error: configError } = await supabaseAdmin
        .from('app_config')
        .select('value')
        .eq('key', 'EMAILIT_API_KEY')
        .single();

    if (configError || !config?.value) {
        console.warn("Emailit API key not configured. Skipping email.");
        return;
    }
    const emailitApiKey = config.value;
    const emailFrom = Deno.env.get("EMAIL_FROM") ?? "7i Portal <no-reply@mail.ahensi.com>";

    const payload = { from: emailFrom, to, subject, html, text };

    const response = await fetch("https://api.emailit.com/v1/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${emailitApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Emailit API Error (${response.status}): ${errorData.message || 'Unknown error'}`);
    }
    console.log(`Email sent to ${to}`);
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, notification_type, title, body, html_body, data } = await req.json();
    if (!user_id || !notification_type || !title || !body) {
      throw new Error("Missing required fields: user_id, notification_type, title, body.");
    }

    // 1. Fetch user's profile and person record in parallel
    const [profileRes, personRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('email, phone, notification_preferences').eq('id', user_id).single(),
        supabaseAdmin.from('people').select('contact').eq('user_id', user_id).single()
    ]);

    if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;
    if (personRes.error && personRes.error.code !== 'PGRST116') throw personRes.error;

    const profile = profileRes.data;
    const person = personRes.data;

    if (!profile) {
        throw new Error(`User with ID ${user_id} not found.`);
    }

    // 2. Determine final contact info using fallback logic
    const emailToSend = profile.email || person?.contact?.emails?.[0];
    const phoneToSend = profile.phone || person?.contact?.phones?.[0];

    // 3. Check notification preferences
    const prefs = profile.notification_preferences || {};
    const typePref = prefs[notification_type] || {};
    const isEnabled = typePref.enabled !== false;

    if (!isEnabled) {
        return new Response(JSON.stringify({ message: `Notification type '${notification_type}' is disabled for this user.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const sendEmailEnabled = typePref.email !== false;
    const sendWhatsappEnabled = typePref.whatsapp !== false;

    let emailSent = false;
    let whatsappSent = false;

    // 4. Send notifications
    if (sendEmailEnabled && emailToSend) {
        try {
            await sendEmail(supabaseAdmin, emailToSend, title, html_body || `<p>${body}</p>`, body);
            emailSent = true;
        } catch (e) {
            console.error(`Failed to send email for user ${user_id}:`, e.message);
        }
    }

    if (sendWhatsappEnabled && phoneToSend) {
        try {
            await sendWhatsappMessage(supabaseAdmin, phoneToSend, body);
            whatsappSent = true;
        } catch (e) {
            console.error(`Failed to send WhatsApp for user ${user_id}:`, e.message);
        }
    }

    return new Response(JSON.stringify({ 
        message: "Notification processed.",
        email_sent: emailSent,
        whatsapp_sent: whatsappSent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in send-notification function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});