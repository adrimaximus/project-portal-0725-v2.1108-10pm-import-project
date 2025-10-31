import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';

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

// Helper to send Email
const sendEmail = async (supabaseAdmin, to: string, subject: string, html: string, text: string, attachments: any[]) => {
    const { data: config, error: configError } = await supabaseAdmin
        .from('app_config')
        .select('value')
        .eq('key', 'EMAILIT_API_KEY')
        .single();

    if (configError || !config?.value) {
        throw new Error("Email service is not configured on the server (EMAILIT_API_KEY is missing).");
    }
    const emailitApiKey = config.value;

    const emailPayload = {
      from: EMAIL_FROM,
      to, subject, html, text,
      attachments: (attachments || []).map((att: any) => ({
        filename: att.file_name || 'attachment',
        content_url: att.file_url,
      })),
    };

    const response = await fetch("https://api.emailit.com/v1/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${emailitApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
        console.error("Emailit API Error:", response.status, data);
        throw new Error(data.message || `Emailit API failed with status ${response.status}`);
    }
    return data;
};


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
      return new Response(JSON.stringify({ message: "No users to notify via email." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const attachmentHtml = generateAttachmentHtml(attachments);
    let sentCount = 0;
    let skippedCount = 0;

    const emailPromises = usersToNotify.map(async (profile) => {
      // DEBOUNCE CHECK
      const { data: recentNotifications, error: checkError } = await supabaseAdmin
        .from('pending_whatsapp_notifications')
        .select('id', { count: 'exact', head: true })
        .in('notification_type', ['discussion_mention', 'discussion_mention_email'])
        .eq('context_data->>comment_id', comment_id)
        .eq('recipient_id', profile.id)
        .gte('created_at', twoMinutesAgo);

      if (checkError) {
        console.error(`Debounce check failed for ${profile.email}:`, checkError.message);
      }

      if (recentNotifications && recentNotifications.count > 0) {
        console.log(`Debounce: Notification for comment ${comment_id} to ${profile.email} already processed. Skipping email.`);
        skippedCount++;
        return;
      }

      // INSERT DEBOUNCE RECORD (to prevent duplicate emails/WA from other triggers)
      const { error: insertError } = await supabaseAdmin
        .from('pending_whatsapp_notifications')
        .insert({
          recipient_id: profile.id,
          notification_type: 'discussion_mention_email',
          context_data: { comment_id },
          send_at: new Date().toISOString(),
          status: 'processed',
        });

      if (insertError) {
        console.warn(`Could not insert debounce record for ${profile.email} (might be a race condition, which is OK):`, insertError.message);
      }

      // SEND EMAIL
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

      try {
        await sendEmail(supabaseAdmin, profile.email, subject, html, text, attachments);
        sentCount++;
        console.log(`Email notification sent to ${profile.email} for comment ${comment_id}`);
      } catch (e) {
        console.error(`Failed to send email to ${profile.email}:`, e.message);
      }
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ 
      message: `Email notifications processed. Sent: ${sentCount}, Skipped (duplicates): ${skippedCount}.` 
    }), {
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