import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const getFullName = (profile: any) => `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;

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
        blockquote { border-left: 2px solid #e5e7eb; padding-left: 1em; margin: 1em 0; color: #6b7280; }
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
            <p>If you're having trouble with the button, copy and paste this URL into your browser:</p>
            <p><a href="${buttonUrl}" style="color: #2563eb; word-break: break-all;">${buttonUrl}</a></p>
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

const sendEmail = async (to: string, subject: string, html: string, text: string) => {
    const { data: config, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'EMAILIT_API_KEY')
      .single();

    if (configError || !config?.value) {
        console.warn("Emailit API key not configured. Skipping email.");
        throw new Error("Emailit API key not configured.");
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
    // Auth check
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const { recipient_id, project_id, mentioner_id, task_id, comment_id } = await req.json();
    if (!recipient_id || !project_id || !mentioner_id || !comment_id) {
      throw new Error("Missing required fields.");
    }

    const [recipientRes, projectRes, mentionerRes, commentRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', recipient_id).single(),
        supabaseAdmin.from('projects').select('name, slug').eq('id', project_id).single(),
        supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', mentioner_id).single(),
        supabaseAdmin.from('comments').select('text').eq('id', comment_id).single(),
    ]);

    if (recipientRes.error) throw new Error(`Recipient not found: ${recipientRes.error.message}`);
    if (projectRes.error) throw new Error(`Project not found: ${projectRes.error.message}`);
    if (mentionerRes.error) throw new Error(`Mentioner not found: ${mentionerRes.error.message}`);
    if (commentRes.error) throw new Error(`Comment not found: ${commentRes.error.message}`);

    const recipient = recipientRes.data;
    const projectData = projectRes.data;
    const mentionerData = mentionerRes.data;
    const commentData = commentRes.data;

    if (!recipient.email) {
        throw new Error("Recipient does not have an email address.");
    }

    const recipientName = getFullName(recipient);
    const siteUrl = Deno.env.get("SITE_URL") || Deno.env.get("VITE_APP_URL");
    const url = task_id
      ? `${siteUrl}/projects/${projectData.slug}?tab=tasks&task=${task_id}`
      : `${siteUrl}/projects/${projectData.slug}?tab=discussion`;
    
    const subject = `You were mentioned in: ${projectData.name}`;
    const bodyHtml = `
        <p>Hi ${recipientName},</p>
        <p><strong>${getFullName(mentionerData)}</strong> mentioned you in a comment on the project <strong>${projectData.name}</strong>.</p>
        <blockquote>
            ${commentData.text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<strong>@$1</strong>')}
        </blockquote>
    `;
    const text = `Hi, ${getFullName(mentionerData)} mentioned you in a comment on the project ${projectData.name}. View it here: ${url}`;
    const html = createEmailTemplate({
        title: `You were mentioned in "${projectData.name}"`,
        bodyHtml,
        buttonText: "View Comment",
        buttonUrl: url,
    });

    await sendEmail(recipient.email, subject, html, text);

    return new Response(JSON.stringify({ message: "Email sent successfully." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});