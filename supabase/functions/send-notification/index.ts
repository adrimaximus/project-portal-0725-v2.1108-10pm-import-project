// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to format phone numbers
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
    return null;
};

// Helper to send WhatsApp message with Fallback
const sendWhatsappMessage = async (supabaseAdmin, phone: string, message: string) => {
    // Fetch all potential credentials
    const { data: config, error: configError } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', [
            'WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID',
            'META_PHONE_ID', 'META_ACCESS_TOKEN'
        ]);

    if (configError) throw new Error(`Failed to get config: ${configError.message}`);

    const metaPhoneId = config?.find(c => c.key === 'META_PHONE_ID')?.value;
    const metaAccessToken = config?.find(c => c.key === 'META_ACCESS_TOKEN')?.value;

    const wbizClientId = config?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const wbizApiKey = config?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const wbizWhatsappClientId = config?.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value;

    const formattedPhone = formatPhoneNumberForApi(phone);
    if (!formattedPhone) {
        console.warn(`Invalid phone number format: ${phone}. Skipping WhatsApp message.`);
        return;
    }

    let sent = false;
    let lastError = '';

    // 1. Try Meta (Official API) First
    if (metaPhoneId && metaAccessToken) {
        console.log(`Attempting Meta send to ${formattedPhone}...`);
        try {
            const response = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${metaAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: formattedPhone,
                    type: "text",
                    text: { body: message }
                }),
            });

            if (response.ok) {
                sent = true;
            } else {
                const data = await response.json().catch(() => ({}));
                const errorObj = data.error || {};
                const errorMessage = errorObj.message || 'Unknown Meta API error';
                const code = errorObj.code || '';
                
                lastError = `Meta Error ${code}: ${errorMessage}`;
                console.warn(`Meta send failed: ${lastError}`);
            }
        } catch (e) {
            lastError = `Meta Exception: ${e.message}`;
            console.warn(`Meta exception:`, e);
        }
    }

    // 2. Fallback to WBIZTOOL if Meta failed or not configured
    if (!sent && wbizClientId && wbizApiKey && wbizWhatsappClientId) {
        console.log(`Attempting WBIZTOOL fallback to ${formattedPhone}...`);
        try {
            const payload = {
                client_id: parseInt(wbizClientId, 10),
                api_key: wbizApiKey,
                whatsapp_client: parseInt(wbizWhatsappClientId, 10),
                phone: formattedPhone,
                message: message,
            };

            const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Client-ID': wbizClientId, 'X-Api-Key': wbizApiKey },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                sent = true;
            } else {
                const status = response.status;
                const errorText = await response.text();
                let errorMessage = `Status: ${status}`;

                if (errorText.includes("Cloudflare") || errorText.includes("524") || errorText.includes("502")) {
                     errorMessage = `WBIZTOOL Gateway Error (${status})`;
                } else {
                    try {
                      const errorJson = JSON.parse(errorText);
                      errorMessage = errorJson.message || JSON.stringify(errorJson);
                    } catch (e) {
                      errorMessage = errorText.substring(0, 100);
                    }
                }
                
                lastError += ` | WBIZTOOL Error: ${errorMessage}`;
                console.warn(`WBIZTOOL send failed: ${errorMessage}`);
            }
        } catch (e) {
            lastError += ` | WBIZTOOL Exception: ${e.message}`;
            console.warn(`WBIZTOOL exception:`, e);
        }
    }

    if (!sent) {
        throw new Error(`Failed to send WhatsApp message. ${lastError || 'No valid providers configured.'}`);
    }
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
    let errors = [];

    // 4. Send notifications
    if (sendEmailEnabled && emailToSend) {
        try {
            await sendEmail(supabaseAdmin, emailToSend, title, html_body || `<p>${body}</p>`, body);
            emailSent = true;
        } catch (e) {
            console.error(`Failed to send email for user ${user_id}:`, e.message);
            errors.push(`Email error: ${e.message}`);
        }
    }

    if (sendWhatsappEnabled && phoneToSend) {
        try {
            await sendWhatsappMessage(supabaseAdmin, phoneToSend, body);
            whatsappSent = true;
        } catch (e) {
            console.error(`Failed to send WhatsApp for user ${user_id}:`, e.message);
            errors.push(`WhatsApp error: ${e.message}`);
        }
    }

    return new Response(JSON.stringify({ 
        message: "Notification processed.",
        email_sent: emailSent,
        whatsapp_sent: whatsappSent,
        errors: errors.length > 0 ? errors : undefined
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