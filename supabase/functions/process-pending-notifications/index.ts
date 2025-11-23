// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("SITE_URL") ?? Deno.env.get("VITE_APP_URL") ?? 'https://app.example.com';
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { 'Accept': 'application/json' } } });

// --- Helper Functions ---

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

const formatPhoneNumberForApi = (phone: string): string | null => {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    }
    if (cleaned.length > 8 && cleaned.startsWith('8')) {
      return '62' + cleaned;
    }
    if (cleaned.startsWith('62')) {
      return cleaned;
    }
    return null;
};

const getWbizConfig = async () => {
  const { data: wbizConfig, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('key, value')
    .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);

  if (configError) throw new Error(`Failed to get WBIZTOOL config: ${configError.message}`);

  const clientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
  const apiKey = wbizConfig?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
  const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');

  if (!clientId || !apiKey || !whatsappClientId) {
    throw new Error("WBIZTOOL credentials not fully configured. Check app_config and environment variables.");
  }
  
  return { clientId, apiKey, whatsappClientId };
};

const sendWhatsappMessage = async (config: any, phone: string, message: string) => {
  const formattedPhone = formatPhoneNumberForApi(phone);
  if (!formattedPhone) {
    console.warn(`Invalid phone number format: ${phone}. Skipping.`);
    return;
  }

  try {
    const messageResponse = await fetch('https://wbiztool.com/api/v1/send_msg/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': config.clientId,
        'X-Api-Key': config.apiKey,
      },
      body: JSON.stringify({
        client_id: parseInt(config.clientId, 10),
        api_key: config.apiKey,
        whatsapp_client: parseInt(config.whatsappClientId, 10),
        phone: formattedPhone,
        message: message,
      }),
    });

    if (!messageResponse.ok) {
      const status = messageResponse.status;
      const errorText = await messageResponse.text();
      let errorMessage = `Failed to send message (Status: ${status}).`;

      // Enhanced Error Handling for HTML/Cloudflare pages
      if (errorText.includes("Cloudflare") || errorText.includes("524") || errorText.includes("502")) {
         if (status === 524) errorMessage = "WBIZTOOL API Timeout (Cloudflare 524). The service is taking too long to respond.";
         else if (status === 502) errorMessage = "WBIZTOOL API Bad Gateway (Cloudflare 502). The service is down.";
         else errorMessage = `WBIZTOOL API Error (Status: ${status}). Service might be experiencing issues.`;
      } else {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || JSON.stringify(errorJson);
          } catch (e) {
            // Clean up HTML tags and truncate
            const cleanText = errorText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            errorMessage = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
          }
      }
      throw new Error(errorMessage);
    }

    return messageResponse.json();
  } catch (error) {
    console.error(`Error sending WhatsApp to ${formattedPhone}:`, error.message);
    throw error;
  }
};

const sendEmail = async (emailitApiKey: string, to: string, subject: string, html: string, text: string) => {
    const emailFrom = Deno.env.get("EMAIL_FROM") ?? "7i Portal <no-reply@mail.ahensi.com>";
    const payload = { from: emailFrom, to, subject, html, text };

    try {
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
    } catch (error) {
       console.error(`Error sending email to ${to}:`, error.message);
       throw error;
    }
};

const generateTemplatedMessage = (type: string, context: any, recipientName: string): string => {
  let message = '';
  let url = APP_URL;

  switch (type) {
    case 'discussion_mention':
      url = context.project_slug === 'chat'
        ? `${APP_URL}/chat`
        : (context.task_id
          ? `${APP_URL}/projects/${context.project_slug}?tab=tasks&task=${context.task_id}`
          : `${APP_URL}/projects/${context.project_slug}?tab=discussion`);
      message = `👋 Hai ${recipientName}, *${context.mentioner_name}* menyebut Anda dalam proyek *${context.project_name}*.`;
      break;
    case 'task_assignment':
      url = `${APP_URL}/projects/${context.project_slug}?tab=tasks&task=${context.task_id}`;
      message = `📝 Hai ${recipientName}, *${context.assigner_name}* menugaskan Anda tugas baru: *${context.task_title}* di proyek *${context.project_name}*.`;
      break;
    case 'project_invite':
      url = `${APP_URL}/projects/${context.project_slug}`;
      message = `🤝 Hai ${recipientName}, *${context.inviter_name}* mengundang Anda untuk berkolaborasi di proyek *${context.project_name}*.`;
      break;
    case 'kb_invite':
      url = `${APP_URL}/knowledge-base/folders/${context.folder_slug}`;
      message = `📚 Hai ${recipientName}, *${context.inviter_name}* mengundang Anda untuk berkolaborasi di folder *${context.folder_name}*.`;
      break;
    case 'goal_invite':
      url = `${APP_URL}/goals/${context.goal_slug}`;
      message = `🎯 Hai ${recipientName}, *${context.inviter_name}* mengundang Anda untuk berkolaborasi pada tujuan *${context.goal_title}*.`;
      break;
    case 'goal_progress_update':
      url = `${APP_URL}/goals/${context.goal_slug}`;
      message = `📈 Hai ${recipientName}, *${context.updater_name}* baru saja mencatat kemajuan pada tujuan bersama Anda: *${context.goal_title}*.`;
      break;
    case 'payment_status_updated':
      url = `${APP_URL}/projects/${context.project_slug}`;
      message = `💳 Hai ${recipientName}, status pembayaran untuk proyek *${context.project_name}* telah diperbarui menjadi *${context.new_status}* oleh *${context.updater_name}*.`;
      break;
    case 'project_status_updated':
      url = `${APP_URL}/projects/${context.project_slug}`;
      message = `📊 Hai ${recipientName}, status proyek *${context.project_name}* telah diperbarui menjadi *${context.new_status}* oleh *${context.updater_name}*.`;
      break;
    case 'task_overdue':
      url = `${APP_URL}/projects/${context.project_slug}?tab=tasks&task=${context.task_id}`;
      message = `⏰ PENGINGAT: Hai ${recipientName}, tugas *${context.task_title}* di proyek *${context.project_name}* sudah jatuh tempo *${context.days_overdue} hari*.`;
      break;
    case 'billing_reminder':
      url = `${APP_URL}/projects/${context.project_slug}`;
      message = `💰 PENGINGAT: Hai ${recipientName}, pembayaran untuk proyek *${context.project_name}* telah jatuh tempo *${context.days_overdue} hari*. Mohon segera diproses.`;
      break;
    default:
      return `🔔 Notifikasi baru untuk Anda. Silakan periksa dasbor Anda. ${APP_URL}`;
  }
  return `${message}\n\n${url}`;
};

const generateTemplatedEmail = (type: string, context: any, recipientName: string): { subject: string, html: string, text: string } => {
  const cleanType = type.replace('_email', '');
  let title = 'New Notification';
  let mainSubject = '';
  let bodyHtml = '';
  let buttonText = 'View Details';
  let buttonUrl = APP_URL;

  switch (cleanType) {
    case 'discussion_mention':
      title = `You were mentioned in:`;
      mainSubject = context.project_name;
      buttonUrl = context.project_slug === 'chat'
        ? `${APP_URL}/chat`
        : (context.task_id
          ? `${APP_URL}/projects/${context.project_slug}?tab=tasks&task=${context.task_id}`
          : `${APP_URL}/projects/${context.project_slug}?tab=discussion`);
      bodyHtml = `<p><strong>${context.mentioner_name}</strong> mentioned you in a comment:</p>
                  <blockquote style="border-left:4px solid #ccc;padding-left:1em;margin:1.2em 0;color:#3b4754;background:#f8fafc;border-radius:6px 0 0 6px;">
                      ${context.comment_text.replace(/\n/g, '<br>')}
                  </blockquote>`;
      buttonText = "View Comment";
      break;
    case 'task_assignment':
      title = `New Task Assigned in:`;
      mainSubject = context.project_name;
      buttonUrl = `${APP_URL}/projects/${context.project_slug}?tab=tasks&task=${context.task_id}`;
      bodyHtml = `<p><strong>${context.assigner_name}</strong> assigned you a new task: <strong>"${context.task_title}"</strong>.</p>`;
      buttonText = "View Task";
      break;
    case 'project_invite':
      title = `You've been invited to:`;
      mainSubject = context.project_name;
      buttonUrl = `${APP_URL}/projects/${context.project_slug}`;
      bodyHtml = `<p><strong>${context.inviter_name}</strong> invited you to collaborate on this project.</p>`;
      buttonText = "View Project";
      break;
    case 'kb_invite':
      title = `You've been invited to:`;
      mainSubject = context.folder_name;
      buttonUrl = `${APP_URL}/knowledge-base/folders/${context.folder_slug}`;
      bodyHtml = `<p><strong>${context.inviter_name}</strong> invited you to collaborate on this knowledge base folder.</p>`;
      buttonText = "View Folder";
      break;
    case 'goal_invite':
      title = `You've been invited to a Goal:`;
      mainSubject = context.goal_title;
      buttonUrl = `${APP_URL}/goals/${context.goal_slug}`;
      bodyHtml = `<p><strong>${context.inviter_name}</strong> invited you to collaborate on this goal.</p>`;
      buttonText = "View Goal";
      break;
    case 'goal_progress_update':
      title = `Progress on your Goal:`;
      mainSubject = context.goal_title;
      buttonUrl = `${APP_URL}/goals/${context.goal_slug}`;
      bodyHtml = `<p><strong>${context.updater_name}</strong> just logged progress on your shared goal.</p>`;
      buttonText = "View Progress";
      break;
    case 'payment_status_updated':
      title = `Payment Status Updated for:`;
      mainSubject = context.project_name;
      buttonUrl = `${APP_URL}/projects/${context.project_slug}`;
      bodyHtml = `<p>The payment status was updated to <strong>${context.new_status}</strong> by <strong>${context.updater_name}</strong>.</p>`;
      buttonText = "View Project";
      break;
    case 'project_status_updated':
      title = `Project Status Updated for:`;
      mainSubject = context.project_name;
      buttonUrl = `${APP_URL}/projects/${context.project_slug}`;
      bodyHtml = `<p>The project status was updated to <strong>${context.new_status}</strong> by <strong>${context.updater_name}</strong>.</p>`;
      buttonText = "View Project";
      break;
    case 'task_overdue':
      title = `Task Overdue in:`;
      mainSubject = context.project_name;
      buttonUrl = `${APP_URL}/projects/${context.project_slug}?tab=tasks&task=${context.task_id}`;
      bodyHtml = `<p>The task <strong>"${context.task_title}"</strong> is now <strong>${context.days_overdue} day(s)</strong> overdue.</p>`;
      buttonText = "View Task";
      break;
    case 'billing_reminder':
      title = `Payment Reminder for:`;
      mainSubject = context.project_name;
      buttonUrl = `${APP_URL}/projects/${context.project_slug}`;
      bodyHtml = `<p>This is a reminder that the payment for this project is now <strong>${context.days_overdue} day(s)</strong> overdue. Please process it as soon as possible.</p>`;
      buttonText = "View Billing Details";
      break;
    default:
      title = "New Notification";
      mainSubject = "You have a new notification";
      bodyHtml = `<p>Please check your dashboard for a new update.</p>`;
      buttonText = "Go to Dashboard";
      buttonUrl = APP_URL;
      break;
  }

  const subject = `${title} ${mainSubject}`;
  const html = createEmailTemplate({ title, mainSubject, recipientName, bodyHtml, buttonText, buttonUrl });
  const text = `${subject}\n\n${bodyHtml.replace(/<[^>]+>/g, '')}\n\nView here: ${buttonUrl}`;

  return { subject, html, text };
};

// --- Main Server Logic ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userAgent = req.headers.get('user-agent');
    const cronHeader = req.headers.get('X-Cron-Secret');
    const isCron = userAgent?.startsWith('pg_net');
    const isAuthorized = cronHeader && cronHeader === CRON_SECRET;

    if (!isCron && !isAuthorized) {
      console.error('Unauthorized cron attempt:', { userAgent, hasCronHeader: !!cronHeader });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // USE RPC instead of select to prevent race conditions
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .rpc('pop_pending_notifications', { p_limit: 20 });

    if (fetchError) throw fetchError;

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending notifications.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Need to fetch recipient profiles manually since RPC returns raw table rows
    const recipientIds = [...new Set(notifications.map((n: any) => n.recipient_id))];
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*') // fetch all fields needed
      .in('id', recipientIds);
    
    if (profilesError) throw profilesError;
    const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

    // Attach recipient to notification object to match existing logic structure
    const notificationsWithRecipients = notifications.map((n: any) => ({
        ...n,
        recipient: profileMap.get(n.recipient_id)
    }));

    const wbizConfig = await getWbizConfig().catch(e => { console.warn(e.message); return null; });
    const { data: emailitConfig } = await supabaseAdmin.from('app_config').select('value').eq('key', 'EMAILIT_API_KEY').single();
    const emailitApiKey = emailitConfig?.value;

    const processingPromises = notificationsWithRecipients.map(async (notification) => {
      try {
        const recipient = notification.recipient;
        if (!recipient) {
          await supabaseAdmin.from('pending_notifications').update({ status: 'skipped', error_message: 'Recipient profile not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
          return { status: 'skipped', reason: 'Recipient not found' };
        }

        const recipientName = recipient.first_name || recipient.email.split('@')[0];

        if (notification.notification_type.includes('email')) {
            if (!emailitApiKey || !recipient.email) {
                return { status: 'skipped', reason: 'No email or email config' };
            }
            const { subject, html, text } = generateTemplatedEmail(notification.notification_type, notification.context_data, recipientName);
            await sendEmail(emailitApiKey, recipient.email, subject, html, text);
        } else { // WhatsApp
            if (!wbizConfig || !recipient.phone) {
                return { status: 'skipped', reason: 'No phone or WhatsApp config' };
            }
            const message = generateTemplatedMessage(notification.notification_type, notification.context_data, recipientName);
            await sendWhatsappMessage(wbizConfig, recipient.phone, message);
        }

        await supabaseAdmin.from('pending_notifications').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', notification.id);
        return { status: 'success' };
      } catch (e) {
        const newRetryCount = (notification.retry_count || 0) + 1;
        const newStatus = newRetryCount >= 3 ? 'failed' : 'pending';
        console.error(`Failed to process notification ${notification.id} (attempt ${newRetryCount}):`, e.message);
        await supabaseAdmin.from('pending_notifications').update({ 
          status: newStatus, 
          error_message: e.message, 
          processed_at: new Date().toISOString(),
          retry_count: newRetryCount,
        }).eq('id', notification.id);
        return { status: 'failed', reason: e.message };
      }
    });

    const results = await Promise.allSettled(processingPromises);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'skipped').length;

    return new Response(JSON.stringify({ message: `Processed ${notifications.length} notifications. Success: ${successCount}, Skipped: ${skippedCount}, Failed: ${failureCount}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Top-level function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});