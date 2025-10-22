// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAILIT_API_KEY = Deno.env.get("EMAILIT_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "7i Portal <no-reply@mail.ahensi.com>";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz";

// Helper function to generate HTML for attachments
function generateAttachmentHtml(attachments) {
    if (!attachments || attachments.length === 0) {
        return '';
    }

    const listItems = attachments.map(att => 
        `<li><a href="${att.file_url}" style="color: #1e40af; text-decoration: none;">${att.file_name}</a></li>`
    ).join('');

    return `
        <div style="margin-top: 20px; padding: 10px; border-left: 4px solid #3b82f6; background-color: #f3f4f6;">
            <p style="font-weight: bold; margin-bottom: 5px; color: #1f2937;">Attached Files:</p>
            <ul style="list-style-type: none; padding-left: 0; margin: 0;">
                ${listItems}
            </ul>
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

    // 4. Fetch comment details to get attachments_jsonb
    const { data: commentData, error: commentError } = await supabaseAdmin
        .from('comments')
        .select('attachments_jsonb')
        .eq('id', comment_id)
        .single();
    
    if (commentError) throw commentError;
    const attachments = commentData?.attachments_jsonb || [];

    // 5. Fetch profiles of mentioned users
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, notification_preferences')
      .in('id', mentioned_user_ids);

    if (profileError) throw profileError;

    if (!profiles || profiles.length === 0) {
      console.log("No valid profiles found for mentioned users.");
      return new Response(JSON.stringify({ message: "No users to notify." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 6. Filter users who have email notifications for mentions enabled
    const usersToNotify = profiles.filter(p => {
      const prefs = p.notification_preferences || {};
      // Default to true if the preference is not set
      return prefs.mention !== false;
    });

    if (usersToNotify.length === 0) {
      console.log("All mentioned users have disabled email notifications for mentions.");
      return new Response(JSON.stringify({ message: "No users to notify." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 7. Send emails
    if (!EMAILIT_API_KEY) {
      throw new Error("Email service is not configured on the server (EMAILIT_API_KEY is missing).");
    }

    const emailPromises = usersToNotify.map(async (profile) => {
      const subject = `You were mentioned in the project: ${project_name}`;
      const projectUrl = project_slug === 'general-tasks' 
        ? `${SITE_URL}/projects?view=tasks` 
        : `${SITE_URL}/projects/${project_slug}`;
      
      const attachmentHtml = generateAttachmentHtml(attachments);

      const html = `
        <p>Hi,</p>
        <p><strong>${mentioner_name}</strong> mentioned you in a comment on the project <strong>${project_name}</strong>.</p>
        <blockquote style="border-left: 2px solid #ccc; padding-left: 1em; margin-left: 0; font-style: italic;">
          ${comment_text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')}
        </blockquote>
        
        ${attachmentHtml}

        <p>You can view the comment by clicking the button below:</p>
        <a href="${projectUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">View Project</a>
        <p>Thanks,<br/>The 7i Portal Team</p>
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