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
const LOGO_URL = "https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png";
const ACCENT_COLOR = "#fa009f"; // 7i Portal Pink

// Helper function to generate the styled attachment block
function generateAttachmentHtml(attachments: any[]) {
    if (!attachments || attachments.length === 0) {
        return '';
    }

    const fileIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`;
    const viewIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const downloadIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

    const listItems = attachments.map(att => `
        <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 12px 16px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 24px; height: 24px;">${fileIconSvg}</div>
                <a href="${att.file_url}" style="color: #d1d5db; text-decoration: none; font-weight: 500; font-size: 14px;">${att.file_name}</a>
            </td>
            <td style="padding: 12px 16px; text-align: right;">
                <a href="${att.file_url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; vertical-align: middle; margin-right: 8px; width: 24px; height: 24px;">${viewIconSvg}</a>
                <a href="${att.file_url}" download="${att.file_name}" style="display: inline-block; vertical-align: middle; width: 24px; height: 24px;">${downloadIconSvg}</a>
            </td>
        </tr>
    `).join('');

    return `
        <div style="margin-top: 24px; background-color: #111827; border-radius: 8px; border-left: 4px solid ${ACCENT_COLOR}; overflow: hidden;">
            <h3 style="font-size: 16px; font-weight: 600; color: #e5e7eb; margin: 0; padding: 16px 16px 12px;">Files Attached</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                    ${listItems}
                </tbody>
            </table>
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
      .select('id, email, first_name, notification_preferences')
      .in('id', mentioned_user_ids);

    if (profileError) throw profileError;

    if (!profiles || profiles.length === 0) {
      console.log("No valid profiles found for mentioned users.");
      return new Response(JSON.stringify({ message: "No users to notify." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 6. Filter users who have email notifications for mentions enabled
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

    // 7. Send emails
    if (!EMAILIT_API_KEY) {
      throw new Error("Email service is not configured on the server (EMAILIT_API_KEY is missing).");
    }

    const attachmentHtml = generateAttachmentHtml(attachments);

    const emailPromises = usersToNotify.map(async (profile) => {
      const subject = `You were mentioned in the project: ${project_name}`;
      const projectUrl = project_slug === 'general-tasks' 
        ? `${SITE_URL}/projects?view=tasks` 
        : `${SITE_URL}/projects/${project_slug}`;
      
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; background-color: #111827; color: #d1d5db; padding: 40px 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1f2937; border-radius: 12px; overflow: hidden;">
                <div style="padding: 24px; text-align: center; border-bottom: 1px solid #374151;">
                    <img src="${LOGO_URL}" alt="7i Portal Logo" style="height: 40px; width: auto; margin: 0 auto;">
                </div>
                <div style="padding: 32px;">
                    <h1 style="font-size: 24px; font-weight: 600; color: #f9fafb; margin: 0 0 16px;">You Were Mentioned</h1>
                    <p style="margin: 0 0 24px; line-height: 1.5;">
                        Hi ${profile.first_name || profile.email.split('@')[0]},
                    </p>
                    <p style="margin: 0 0 24px; line-height: 1.5;">
                        <strong>${mentioner_name}</strong> mentioned you in a comment on the project <strong>${project_name}</strong>.
                    </p>
                    <div style="background-color: #374151; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0; font-style: italic; line-height: 1.5;">
                            ${comment_text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')}
                        </p>
                    </div>
                    
                    ${attachmentHtml}

                    <div style="text-align: center; margin-top: 32px;">
                        <a href="${projectUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: ${ACCENT_COLOR}; text-decoration: none; border-radius: 8px; font-weight: 600;">View Project</a>
                    </div>
                </div>
                <div style="background-color: #111827; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
                    &copy; ${new Date().getFullYear()} 7i Portal. All rights reserved.
                </div>
            </div>
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