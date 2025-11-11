// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createEmailTemplate = ({ title, bodyHtml, buttonText, buttonUrl }: { title: string, bodyHtml: string, buttonText: string, buttonUrl: string }) => {
  const APP_NAME = "7i Portal";
  const LOGO_URL = "https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; margin: 0; padding: 0; background-color: #f2f4f6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background-color: #ffffff; border-radius: 8px; padding: 32px; }
        .header { text-align: center; margin-bottom: 32px; }
        .header img { height: 40px; }
        .content h1 { font-size: 24px; color: #111827; margin-top: 0; }
        .content p { color: #374151; line-height: 1.5; }
        .button-container { margin: 32px 0; }
        .button { display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #2563eb; text-decoration: none; border-radius: 6px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo">
          </div>
          <div class="content">
            <h1>${title}</h1>
            ${bodyHtml}
            <div class="button-container">
              <a href="${buttonUrl}" class="button">${buttonText}</a>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
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
      .single();

    if (configError || !config?.value) {
      throw new Error("Emailit API key not configured. Please connect your Emailit account first.");
    }
    const apiKey = config.value;

    // 4. Construct and send the email via Emailit API
    const html = createEmailTemplate({
        title: "Test Email from Your App",
        bodyHtml: `
            <p>Hello!</p>
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