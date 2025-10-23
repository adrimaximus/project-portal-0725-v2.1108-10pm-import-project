// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "7i Portal <no-reply@mail.ahensi.com>";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz";
const ACCENT_COLOR = "#008A9E"; // 7inked Teal

// Helper function to generate the styled attachment block
function generateAttachmentHtml(attachments: any[]) {
    if (!attachments || attachments.length === 0) {
        return '';
    }

    const listItems = attachments.map(att => `
        <a href="${att.file_url}" style="display: block; color: #007bff; text-decoration: none; margin-bottom: 4px; font-size: 14px;">${att.file_name}</a>
    `).join('');

    return `
        <div style="margin-top: 24px; background-color: #f8f9fa; border-left: 4px solid ${ACCENT_COLOR}; padding: 16px;">
            <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px;">Attached Files:</h3>
            ${listItems}
        </div>
    `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the user making the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    // 2. Get payload
    const { project_slug, project_name, mentioner_name, mentioned_user_ids, comment_text, comment_id } = await req.json();
    if (!project_slug || !project_name || !mentioner_name || !mentioned_user_ids || !Array.isArray(mentioned_user_ids) || mentioned_user_ids.length === 0 || !comment_id) {
      throw new Error("Missing required parameters (project_slug, project_name, mentioner_name, mentioned_user_ids, comment_id).");
    }

    // 3. Create admin client to fetch user data and comment details securely
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Fetch Emailit API key from app_config
    const { data: config, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'EMAILIT_API_KEY')
      .single();

    if (configError || !config?.value) {
      throw new Error("Email service is not configured on the server (EMAILIT_API_KEY is missing).");
    }
    const EMAILIT_API_KEY = config.value;

    // 5. Fetch comment details to get attachments_jsonb
    const { data: commentData, error: commentError } = await supabaseAdmin
        .from('comments')
        .select('attachments_jsonb')
        .eq('id', comment_id)
        .single();
    
    if (commentError) throw commentError;
    const attachments = commentData?.attachments_jsonb || [];

    // 6. Fetch profiles of mentioned users
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, notification_preferences')
      .in('id', mentioned_user_ids);

    if (profileError) throw profileError;

    if (!profiles || profiles.length === 0) {
      console.log("No valid profiles found for mentioned users.");
      return new Response(JSON.stringify({ message: "No users to notify." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 7. Filter users who have email notifications for mentions enabled
    const usersToNotify = profiles.filter(p => {
      const prefs = p.notification_preferences || {};
      const mentionPref = prefs.mention;
      if (typeof mentionPref === 'object' && mentionPref !== null) {
        return mentionPref.email !== false;
      }
      return mentionPref !== false;
    });

    if (usersToNotify.length === 0) {
      console.log("All mentioned users have disabled email notifications for mentions.");
      return new Response(JSON.stringify({ message: "No users to notify." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 8. Send emails
    const attachmentHtml = generateAttachmentHtml(attachments);

    const emailPromises = usersToNotify.map(async (profile) => {
      const subject = `You were mentioned in the project: ${project_name}`;
      const projectUrl = project_slug === 'general-tasks' 
        ? `${SITE_URL}/projects?view=tasks` 
        : `${SITE_URL}/projects/${project_slug}`;
      
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
            <p>Hi ${profile.first_name || profile.email.split('@')[0]},</p>
            <p>
                <strong>${mentioner_name}</strong> mentioned you in a comment on the project <strong>${project_name}</strong>.
            </p>
            <blockquote style="border-left: 4px solid #ccc; padding-left: 1em; margin: 1em 0; color: #666;">
                ${comment_text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')}
            </blockquote>
            ${attachmentHtml}
            <p>You can view the comment by clicking the button below:</p>
            <a href="${projectUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: ${ACCENT_COLOR}; text-decoration: none; border-radius: 8px; font-weight: 600;">View Project</a>
            <p style="margin-top: 24px;">Thanks,<br>The 7i Portal Team</p>
        </div>
      `;
      const text = `Hi, ${mentioner_name} mentioned you in a comment on the project ${project_name}. View it here: ${projectUrl}`;

      const response = await fetch("https://api.emailit.com/v1/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${EMAILIT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: profile.email,
          subject,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Failed to send email to ${profile.email}:`, errorData);
      } else {
        console.log(`Email notification sent to ${profile.email}`);
      }
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ message: `Email notifications initiated for ${usersToNotify.length} user(s).` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-mention-email function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});