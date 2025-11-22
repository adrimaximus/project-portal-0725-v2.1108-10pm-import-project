// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createEmailTemplate = ({ title, mainSubject, recipientName, bodyHtml, buttonText, buttonUrl }: { title: string, mainSubject?: string, recipientName: string, bodyHtml: string, buttonText: string, buttonUrl: string }) => {
  const APP_NAME = "7i Portal";
  const LOGO_URL = "https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png";

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1a28;padding:24px;background:#f7f9fb;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 2px 14px rgba(0,0,0,0.06);padding:32px;">
      <div style="text-align:center;margin-bottom:32px;">
        <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="height:40px;">
      </div>
      <h2 style="margin:0 0 12px 0;font-size:22px;color:#5b6b7b;">${title}</h2>
      ${mainSubject ? `<h1 style="margin:0 0 20px 0;font-size:26px;color:#0b1a28;">${mainSubject}</h1>` : ''}
      <p style="margin:0 0 16px 0;">Hi ${recipientName},</p>
      ${bodyHtml}
      <div style="text-align:left;margin:32px 0;">
        <a href="${buttonUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;color:#ffffff;background-color:#0c8e9f;text-decoration:none;border-radius:10px;font-weight:600;">
          ${buttonText}
        </a>
      </div>
      <p style="margin-top:28px;color:#5b6b7b;">
        Thanks,<br>
        <strong>The ${APP_NAME} Team</strong>
      </p>
    </div>
  </div>
  `;
};

Deno.serve(async (req) => {
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

    // 2. Get recipient email from request body
    const { to } = await req.json();
    if (!to) throw new Error("Recipient email is required.");

    // 3. Get Emailit API key from app_config using admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: config, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'EMAILIT_API_KEY')
      .maybeSingle();

    if (configError || !config?.value) {
      throw new Error("Emailit API key not configured. Please connect your Emailit account first.");
    }
    const apiKey = config.value;

    // 4. Construct and send the email via Emailit API
    const html = createEmailTemplate({
        title: "Test Email",
        mainSubject: "Connection Successful!",
        recipientName: to.split('@')[0],
        bodyHtml: `
            <p>This is a test email to confirm your Emailit integration is working correctly.</p>
            <p>If you received this, everything is set up properly.</p>
        `,
        buttonText: "Go to Dashboard",
        buttonUrl: Deno.env.get("SITE_URL") || Deno.env.get("VITE_APP_URL") || 'https://app.example.com',
    });

    const emailPayload = {
      from: Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com',
      to: to,
      subject: 'Test Email from Your App',
      html: html,
    };

    const response = await fetch("https://api.emailit.com/v1/emails", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to send email: ${errorData.message || response.statusText}`);
    }

    // 5. Return success response
    return new Response(JSON.stringify({ message: "Test email sent successfully." }), {
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