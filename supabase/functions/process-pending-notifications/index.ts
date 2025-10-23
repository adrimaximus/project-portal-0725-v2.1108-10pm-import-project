import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("VITE_APP_URL")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to call the email Edge Function
async function sendEmail(to: string, subject: string, html: string, attachments: any[] = []) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email-with-attachments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      attachments,
    }),
  });
  return response.json();
}

// Helper function to generate HTML for attachments
function generateAttachmentHtml(attachments: any[]) {
    if (!attachments || attachments.length === 0) {
        return '';
    }

    const listItems = attachments.map(att => 
        `<li><a href="${att.file_url}" style="color: #1e40af; text-decoration: none;">${att.file_name} (${att.file_type})</a></li>`
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Fetch pending notifications
    const { data: pendingNotifications, error: fetchError } = await supabaseAdmin
      .from('pending_whatsapp_notifications')
      .select('*, recipient:profiles(email, first_name, last_name, notification_preferences), context_data')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .limit(50);

    if (fetchError) throw fetchError;

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending notifications to process.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const updates = [];
    const emailPromises = [];

    for (const notification of pendingNotifications) {
      const recipientEmail = notification.recipient?.email;
      const recipientName = notification.recipient?.first_name || notification.recipient?.email;
      const notificationType = notification.notification_type;
      const context = notification.context_data;
      const prefs = notification.recipient?.notification_preferences || {};
      
      let subject = "Project Update";
      let bodyHtml = "";
      let attachments: any[] = [];
      let shouldSendEmail = false;

      // --- Logic for Mentions (discussion_mention) ---
      if (notificationType === 'discussion_mention' && recipientEmail && prefs.mention !== false && prefs.email !== false) {
        shouldSendEmail = true;
        
        const mentionerId = context.mentioner_id;
        const projectId = context.project_id;
        attachments = context.attachments || []; // Get attachments array

        // Fetch project and mentioner details
        const { data: projectData } = await supabaseAdmin.from('projects').select('name, slug').eq('id', projectId).single();
        const { data: mentionerData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', mentionerId).single();

        const mentionerName = mentionerData ? `${mentionerData.first_name || ''} ${mentionerData.last_name || ''}`.trim() || mentionerData.email : 'Someone';
        const projectName = projectData?.name || 'a project';
        const projectSlug = projectData?.slug || '';
        const projectLink = `${APP_URL}/projects/${projectSlug}`;

        subject = `You were mentioned in: ${projectName}`;
        
        const attachmentHtml = generateAttachmentHtml(attachments);

        bodyHtml = `
          <p>Hi, ${recipientName},</p>
          <p><strong>${mentionerName}</strong> mentioned you in a comment on the project: <strong>${projectName}</strong>.</p>
          
          ${attachmentHtml}

          <p style="margin-top: 20px;">You can view the comment by clicking the button below:</p>
          <a href="${projectLink}" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Project</a>
          <p style="margin-top: 30px;">Thanks,<br>The 7i Portal Team</p>
        `;
      }
      
      // --- Logic for Task Assignment (task_assignment) ---
      else if (notificationType === 'task_assignment' && recipientEmail && prefs.project_update !== false && prefs.email !== false) {
        shouldSendEmail = true;
        
        const taskId = context.task_id;
        const assignerId = context.assigner_id;
        attachments = context.attachments || []; // Get attachments array

        // Fetch task, project, and assigner details
        const { data: taskData } = await supabaseAdmin.from('tasks').select('title, project_id').eq('id', taskId).single();
        const { data: projectData } = await supabaseAdmin.from('projects').select('name, slug').eq('id', taskData?.project_id).single();
        const { data: assignerData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', assignerId).single();

        const assignerName = assignerData ? `${assignerData.first_name || ''} ${assignerData.last_name || ''}`.trim() || assignerData.email : 'Someone';
        const taskTitle = taskData?.title || 'A new task';
        const projectName = projectData?.name || 'a project';
        const projectSlug = projectData?.slug || '';
        const projectLink = `${APP_URL}/projects/${projectSlug}?tab=tasks&task=${taskId}`;

        subject = `New Task Assigned to You: ${taskTitle}`;
        
        const attachmentHtml = generateAttachmentHtml(attachments);

        bodyHtml = `
          <p>Hi, ${recipientName},</p>
          <p><strong>${assignerName}</strong> has assigned you a new task:</p>
          <p style="font-size: 1.1em; font-weight: bold;">${taskTitle} (in project: ${projectName})</p>
          
          ${attachmentHtml}

          <p style="margin-top: 20px;">You can view the task details by clicking the button below:</p>
          <a href="${projectLink}" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Task</a>
          <p style="margin-top: 30px;">Thanks,<br>The 7i Portal Team</p>
        `;
      }
      
      // --- Execute Email Sending ---
      if (shouldSendEmail) {
        emailPromises.push(
          sendEmail(recipientEmail, subject, bodyHtml, attachments)
            .then(() => ({ id: notification.id, status: 'sent' }))
            .catch((e) => ({ id: notification.id, status: 'error', error_message: e.message }))
        );
      } else {
        // If it's a WhatsApp-only notification (or unsupported type), mark as processed/sent
        updates.push({ id: notification.id, status: 'sent' });
      }
    }

    // Wait for all emails to finish
    const emailResults = await Promise.all(emailPromises);
    
    // Combine results for database update
    const finalUpdates = [...updates, ...emailResults];

    // 2. Update notification statuses
    const updatePromises = finalUpdates.map(result => {
      const updateData: { status: string; processed_at: string; error_message?: string } = {
        status: result.status,
        processed_at: new Date().toISOString(),
      };
      if (result.error_message) {
        updateData.error_message = result.error_message;
      }
      
      return supabaseAdmin
        .from('pending_whatsapp_notifications')
        .update(updateData)
        .eq('id', result.id);
    });

    await Promise.all(updatePromises);

    return new Response(JSON.stringify({ 
      message: `Processed ${pendingNotifications.length} notifications.`,
      results: finalUpdates.map(r => ({ id: r.id, status: r.status, error: r.error_message }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing notifications:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});