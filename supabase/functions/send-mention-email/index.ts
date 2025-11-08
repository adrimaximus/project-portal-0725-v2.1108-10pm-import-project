import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';

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
      : `${siteUrl}/projects/${projectData.slug}`;
    
    const subject = `You were mentioned in the project: ${projectData.name}`;
    const html = `
        <p>Hi ${recipientName},</p>
        <p><strong>${getFullName(mentionerData)}</strong> mentioned you in a comment on the project <strong>${projectData.name}</strong>.</p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 1em; margin: 1em 0; color: #666;">
            ${commentData.text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')}
        </blockquote>
        <p>You can view the comment by clicking the button below:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #008A9E; text-decoration: none; border-radius: 8px;">View Comment</a>
    `;
    const text = `Hi, ${getFullName(mentionerData)} mentioned you in a comment on the project ${projectData.name}. View it here: ${url}`;

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