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
        const status = response.status;
        const errorText = await response.text();
        let errorMessage = `Failed to send email (Status: ${status}).`;
        
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
        } catch (e) {
             const cleanText = errorText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
             errorMessage = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
        }
        
        throw new Error(`Emailit API Error: ${errorMessage}`);
    }
    console.log(`Email sent to ${to}`);
};

Deno.serve(async (req) => {
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
        <p><strong>${getFullName(mentionerData)}</strong> mentioned you in a comment.</p>
        <blockquote style="border-left:4px solid #0c8e9f;padding:1em;margin:1.2em 0;color:#3b4754;background:#f8fafc;border-radius:6px 0 0 6px;">
            ${commentData.text.replace(/\n/g, '<br>')}
        </blockquote>
    `;
    const text = `Hi, ${getFullName(mentionerData)} mentioned you in a comment in ${projectData.name}. View it here: ${url}`;
    const html = createEmailTemplate({
        title: `You were mentioned in:`,
        mainSubject: projectData.name,
        recipientName,
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