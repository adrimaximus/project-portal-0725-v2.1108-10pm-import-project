// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.22.0';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("SITE_URL")! || Deno.env.get("VITE_APP_URL")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

const sendWhatsappMessage = async (phone: string, message: string) => {
  const config = await getWbizConfig();
  const formattedPhone = formatPhoneNumberForApi(phone);
  if (!formattedPhone) {
    console.warn(`Invalid phone number format: ${phone}. Skipping.`);
    return;
  }

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
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || JSON.stringify(errorJson);
    } catch (e) {
      errorMessage = errorText.replace(/<[^>]*>?/gm, ' ').trim() || `Received an empty error response (Status: ${status}).`;
    }
    throw new Error(`WBIZTOOL API Error: ${errorMessage}`);
  }

  return messageResponse.json();
};

const sendEmail = async (to: string, subject: string, html: string, text: string) => {
    const { data: config, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'EMAILIT_API_KEY')
      .single();

    if (configError || !config?.value) {
        console.warn("Emailit API key not configured. Skipping email.");
        return;
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

const getSystemPrompt = () => `Anda adalah asisten AI untuk platform manajemen proyek bernama 7i Portal. Tugas Anda adalah membuat pesan notifikasi WhatsApp yang singkat, ramah, dan profesional dalam Bahasa Indonesia.

**Aturan Penting:**
1.  **Bahasa:** Seluruh pesan WAJIB dalam Bahasa Indonesia.
2.  **Nada:** Gunakan sapaan yang ramah (misalnya, "Hai [Nama],"), diikuti dengan pesan yang jelas dan positif.
3.  **Emoji:** Awali setiap pesan dengan SATU emoji yang relevan dengan konteks notifikasi.
4.  **Format:** Gunakan format tebal WhatsApp (*kata*) untuk menyorot detail penting seperti nama proyek, judul tugas, atau nama orang.
5.  **Mention:** Saat menyebut nama pengguna dalam output Anda, formatnya adalah **@Nama Pengguna**. JANGAN gunakan format \`[]()\` atau ID internal.
6.  **URL WAJIB:** Selalu sertakan URL yang diberikan dalam prompt di baris terakhir pesan. Ini adalah satu-satunya URL yang harus ada di pesan. Jangan menambah teks lain setelah URL.
7.  **Singkat:** Buat pesan seefisien mungkin, langsung ke intinya. Jangan mengulangi informasi yang sudah ada di prompt kecuali jika diperlukan untuk kejelasan.
8.  **Struktur Pesan:** Pesan Anda HARUS mengikuti struktur ini: [Emoji] [Sapaan], [Isi Pesan]. [URL]`;

const getFullName = (profile: any) => `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;

const getOpenAIClient = async (supabaseAdmin: any) => {
  const { data: config, error: configError } = await supabaseAdmin.from('app_config').select('value').eq('key', 'OPENAI_API_KEY').single();
  if (configError || !config?.value) return null;
  return new OpenAI({ apiKey: config.value });
};

const generateAiMessage = async (userPrompt: string): Promise<string> => {
  if (ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
      const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 200, system: getSystemPrompt(), messages: [{ role: "user", content: userPrompt }] });
      return aiResponse.content[0].text;
    } catch (anthropicError) {
      console.warn("Anthropic API failed, falling back to OpenAI.", anthropicError.message);
    }
  }

  const openai = await getOpenAIClient(supabaseAdmin);
  if (openai) {
    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: getSystemPrompt() }, { role: "user", content: userPrompt }],
        temperature: 0.7, max_tokens: 150,
      });
      return aiResponse.choices[0].message.content || '';
    } catch (openaiError) {
      console.error("OpenAI API also failed.", openaiError.message);
      throw new Error("Both AI providers failed. OpenAI Error: " + openaiError.message);
    }
  }

  throw new Error("No AI provider (Anthropic or OpenAI) is configured.");
};

const truncate = (str: string, n: number) => {
  if (!str) return '';
  return (str.length > n) ? str.slice(0, n-1) + '...' : str;
};

// --- Main Server Logic ---

serve(async (req) => {
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

    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from('pending_notifications')
      .select('*, recipient:profiles(*)')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(20);

    if (fetchError) throw fetchError;

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending notifications.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let successCount = 0, failureCount = 0, skippedCount = 0;

    for (const notification of notifications) {
      try {
        const recipient = notification.recipient;
        if (
          !recipient ||
          (notification.notification_type.includes('email') && !recipient.email) ||
          (!notification.notification_type.includes('email') && !recipient.phone)
        ) {
          await supabaseAdmin.from('pending_notifications').update({ status: 'skipped', error_message: 'Recipient profile or contact info not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
          skippedCount++;
          continue;
        }

        const context = notification.context_data;
        const recipientName = recipient.first_name || recipient.email.split('@')[0];

        if (notification.notification_type.includes('email')) {
            let subject = '', html = '', text = '';
            switch (notification.notification_type) {
                case 'discussion_mention_email': {
                    const { project_name: contextName, project_slug: contextSlug, mentioner_name: mentionerName, comment_text: commentText, task_id: taskId } = context;
                    const isChatMention = contextSlug === 'chat';
                    const url = isChatMention ? `${APP_URL}/chat` : (taskId ? `${APP_URL}/projects/${contextSlug}?tab=tasks&task=${taskId}` : `${APP_URL}/projects/${contextSlug}?tab=discussion`);
                    subject = `You were mentioned in: ${contextName}`;
                    const bodyHtml = `<p><strong>${mentionerName}</strong> mentioned you in a comment.</p><blockquote style="border-left:4px solid #0c8e9f;padding-left:1em;margin:1.2em 0;color:#3b4754;background:#f8fafc;border-radius:6px 0 0 6px;">${commentText.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<strong>@$1</strong>')}</blockquote>`;
                    text = `Hi, ${mentionerName} mentioned you in a comment in ${contextName}. View it here: ${url}`;
                    html = createEmailTemplate({ title: `You were mentioned in:`, mainSubject: contextName, recipientName, bodyHtml, buttonText: "View Comment", buttonUrl: url });
                    break;
                }
                case 'task_assignment_email': {
                    const { assigner_name, task_title, project_name, project_slug, task_id } = context;
                    const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
                    subject = `New task assigned to you: ${task_title}`;
                    const bodyHtml = `<p><strong>${assigner_name}</strong> has assigned you a new task in the project <strong>${project_name}</strong>.</p>`;
                    text = `You have been assigned a new task: "${task_title}". View it here: ${url}`;
                    html = createEmailTemplate({ title: `New Task Assigned:`, mainSubject: task_title, recipientName, bodyHtml, buttonText: "View Task", buttonUrl: url });
                    break;
                }
                case 'project_status_updated_email': {
                    const { updater_name, project_name, new_status, project_slug } = context;
                    const url = `${APP_URL}/projects/${project_slug}`;
                    subject = `Project Status Updated: ${project_name} is now ${new_status}`;
                    const bodyHtml = `<p>The status for the project <strong>${project_name}</strong> has been updated to <strong>${new_status}</strong> by <strong>${updater_name}</strong>.</p>`;
                    text = `The status for project ${project_name} has been updated to ${new_status}. View project: ${url}`;
                    html = createEmailTemplate({ title: `Project Status Updated`, mainSubject: project_name, recipientName, bodyHtml, buttonText: "View Project", buttonUrl: url });
                    break;
                }
                case 'payment_status_updated_email': {
                    const { updater_name, project_name, new_status, project_slug } = context;
                    const url = `${APP_URL}/projects/${project_slug}`;
                    subject = `Payment Status Updated: ${project_name} is now ${new_status}`;
                    const bodyHtml = `<p>The payment status for the project <strong>${project_name}</strong> has been updated to <strong>${new_status}</strong> by <strong>${updater_name}</strong>.</p>`;
                    text = `The payment status for project ${project_name} has been updated to ${new_status}. View project: ${url}`;
                    html = createEmailTemplate({ title: `Payment Status Updated`, mainSubject: project_name, recipientName, bodyHtml, buttonText: "View Project", buttonUrl: url });
                    break;
                }
                case 'project_invite_email': {
                    const { inviter_name, project_name, project_slug } = context;
                    const url = `${APP_URL}/projects/${project_slug}`;
                    subject = `You've been invited to the project: ${project_name}`;
                    const bodyHtml = `<p><strong>${inviter_name}</strong> has invited you to collaborate on the project <strong>${project_name}</strong>.</p>`;
                    text = `You've been invited to collaborate on the project: ${project_name}. View it here: ${url}`;
                    html = createEmailTemplate({ title: `Invitation to Collaborate`, mainSubject: project_name, recipientName, bodyHtml, buttonText: "View Project", buttonUrl: url });
                    break;
                }
                case 'task_overdue_email': {
                    const { task_title, project_name, project_slug, task_id, days_overdue } = context;
                    const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
                    subject = `REMINDER: Task "${task_title}" is overdue`;
                    const bodyHtml = `<p>This is a reminder that the task in the project <strong>${project_name}</strong> is now <strong>${days_overdue} day(s)</strong> overdue.</p><p>Please take action as soon as possible.</p>`;
                    text = `REMINDER: The task "${task_title}" is overdue by ${days_overdue} day(s). View it here: ${url}`;
                    html = createEmailTemplate({ title: `Task Overdue:`, mainSubject: task_title, recipientName, bodyHtml, buttonText: "View Task", buttonUrl: url });
                    break;
                }
                case 'billing_reminder_email': {
                    const { project_name, project_slug, days_overdue } = context;
                    const url = `${APP_URL}/projects/${project_slug}`;
                    subject = `REMINDER: Payment for project "${project_name}" is overdue`;
                    const bodyHtml = `<p>This is a reminder that the payment for the project <strong>${project_name}</strong> is now <strong>${days_overdue} day(s)</strong> overdue.</p><p>Please process the payment as soon as possible.</p>`;
                    text = `REMINDER: Payment for project "${project_name}" is overdue by ${days_overdue} day(s). View project: ${url}`;
                    html = createEmailTemplate({ title: `Payment Overdue:`, mainSubject: project_name, recipientName, bodyHtml, buttonText: "View Project", buttonUrl: url });
                    break;
                }
                case 'goal_invite_email': {
                    const { inviter_name, goal_title, goal_slug } = context;
                    const url = `${APP_URL}/goals/${goal_slug}`;
                    subject = `You've been invited to the goal: ${goal_title}`;
                    const bodyHtml = `<p><strong>${inviter_name}</strong> has invited you to collaborate on the goal <strong>${goal_title}</strong>.</p>`;
                    text = `You've been invited to collaborate on the goal: ${goal_title}. View it here: ${url}`;
                    html = createEmailTemplate({ title: `Invitation to Collaborate`, mainSubject: goal_title, recipientName, bodyHtml, buttonText: "View Goal", buttonUrl: url });
                    break;
                }
                case 'kb_invite_email': {
                    const { inviter_name, folder_name, folder_slug } = context;
                    const url = `${APP_URL}/knowledge-base/folders/${folder_slug}`;
                    subject = `You've been invited to the folder: ${folder_name}`;
                    const bodyHtml = `<p><strong>${inviter_name}</strong> has invited you to collaborate on the knowledge base folder <strong>${folder_name}</strong>.</p>`;
                    text = `You've been invited to collaborate on the folder: ${folder_name}. View it here: ${url}`;
                    html = createEmailTemplate({ title: `Invitation to Collaborate`, mainSubject: folder_name, recipientName, bodyHtml, buttonText: "View Folder", buttonUrl: url });
                    break;
                }
                case 'goal_progress_update_email': {
                    const { updater_name, goal_title, goal_slug, value_logged } = context;
                    const url = `${APP_URL}/goals/${goal_slug}`;
                    subject = `Progress update on goal: ${goal_title}`;
                    const bodyHtml = `<p><strong>${updater_name}</strong> logged new progress on your shared goal <strong>${goal_title}</strong>.</p><p><strong>Value Logged:</strong> ${value_logged}</p>`;
                    text = `${updater_name} logged new progress on your shared goal "${goal_title}". Value: ${value_logged}. View goal: ${url}`;
                    html = createEmailTemplate({ title: `Progress on Goal:`, mainSubject: goal_title, recipientName, bodyHtml, buttonText: "View Goal", buttonUrl: url });
                    break;
                }
                default:
                    throw new Error(`Unsupported email notification type: ${notification.notification_type}`);
            }
            await sendEmail(recipient.email, subject, html, text);
        } else {
            let userPrompt = '';
            switch (notification.notification_type) {
                case 'discussion_mention': {
                    const { project_name: contextName, project_slug: contextSlug, mentioner_name: mentionerName, task_id: taskId } = context;
                    const isChatMention = contextSlug === 'chat';
                    const url = isChatMention ? `${APP_URL}/chat` : (taskId ? `${APP_URL}/projects/${contextSlug}?tab=tasks&task=${taskId}` : `${APP_URL}/projects/${contextSlug}?tab=discussion`);
                    const contextDescription = isChatMention ? `di chat "${contextName}"` : `dalam proyek "${contextName}"`;
                    userPrompt = `Buat notifikasi mention. Penerima: ${recipientName}. Pengirim: ${mentionerName}. Konteks: ${contextDescription}. URL: ${url}`;
                    break;
                }
                case 'task_assignment': {
                    const { assigner_name, task_title, project_name, project_slug, task_id } = context;
                    const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
                    userPrompt = `Buat notifikasi penugasan tugas. Penerima: ${recipientName}. Pemberi tugas: ${assigner_name}. Judul tugas: ${task_title}. Proyek: ${project_name}. URL: ${url}`;
                    break;
                }
                case 'project_invite': {
                    const { inviter_name, project_name, project_slug } = context;
                    const url = `${APP_URL}/projects/${project_slug}`;
                    userPrompt = `Buat notifikasi undangan proyek. Penerima: ${recipientName}. Pengundang: ${inviter_name}. Proyek: ${project_name}. URL: ${url}`;
                    break;
                }
                case 'kb_invite': {
                    const { inviter_name, folder_name, folder_slug } = context;
                    const url = `${APP_URL}/knowledge-base/folders/${folder_slug}`;
                    userPrompt = `Buat notifikasi undangan folder knowledge base. Penerima: ${recipientName}. Pengundang: ${inviter_name}. Folder: ${folder_name}. URL: ${url}`;
                    break;
                }
                case 'goal_invite': {
                    const { inviter_name, goal_title, goal_slug } = context;
                    const url = `${APP_URL}/goals/${goal_slug}`;
                    userPrompt = `Buat notifikasi undangan goal. Penerima: ${recipientName}. Pengundang: ${inviter_name}. Goal: ${goal_title}. URL: ${url}`;
                    break;
                }
                case 'goal_progress_update': {
                    const { updater_name, goal_title, goal_slug, value_logged } = context;
                    const url = `${APP_URL}/goals/${goal_slug}`;
                    userPrompt = `Buat notifikasi progres goal. Penerima: ${recipientName}. Pengupdate: ${updater_name}. Goal: ${goal_title}. Nilai yang dicatat: ${value_logged}. URL: ${url}`;
                    break;
                }
                case 'payment_status_updated': {
                    const { updater_name, project_name, new_status, project_slug } = context;
                    const url = `${APP_URL}/projects/${project_slug}`;
                    userPrompt = `Buat notifikasi pembaruan status pembayaran. Penerima: ${recipientName}. Pengupdate: ${updater_name}. Proyek: ${project_name}. Status baru: ${new_status}. URL: ${url}`;
                    break;
                }
                case 'project_status_updated': {
                    const { updater_name, project_name, new_status, project_slug } = context;
                    const url = `${APP_URL}/projects/${project_slug}`;
                    userPrompt = `Buat notifikasi pembaruan status proyek. Penerima: ${recipientName}. Pengupdate: ${updater_name}. Proyek: ${project_name}. Status baru: ${new_status}. URL: ${url}`;
                    break;
                }
                case 'task_overdue': {
                    const { task_title, project_name, project_slug, task_id, days_overdue } = context;
                    const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
                    userPrompt = `Buat notifikasi tugas jatuh tempo. Penerima: ${recipientName}. Judul tugas: ${task_title}. Proyek: ${project_name}. Keterlambatan: ${days_overdue} hari. URL: ${url}`;
                    break;
                }
                case 'billing_reminder': {
                    const { project_name, days_overdue } = context;
                    let urgency = 'sedikit mendesak';
                    if (days_overdue > 30) {
                        urgency = 'sangat mendesak dan perlu segera ditindaklanjuti';
                    } else if (days_overdue > 7) {
                        urgency = 'cukup mendesak';
                    }
                    userPrompt = `**Konteks:**
- **Jenis:** Pengingat Invoice Jatuh Tempo
- **Penerima:** ${recipientName}
- **Proyek:** ${project_name}
- **Jumlah Hari Terlambat:** ${days_overdue} hari
- **Tingkat Urgensi:** ${urgency}
- **URL:** ${APP_URL}/billing

Buat pesan pengingat yang sopan dan profesional sesuai dengan tingkat urgensi yang diberikan.`;
                    break;
                }
                default:
                    throw new Error(`Unsupported WhatsApp notification type: ${notification.notification_type}`);
            }
            const aiMessage = await generateAiMessage(userPrompt);
            const finalMessage = aiMessage.trim();
            if (finalMessage) {
                await sendWhatsappMessage(recipient.phone, finalMessage);
            }
        }

        if (notification.notification_type === 'billing_reminder' || notification.notification_type === 'billing_reminder_email') {
            const projectId = notification.context_data.project_id;
            if (projectId) {
                const { error: updateError } = await supabaseAdmin
                    .from('projects')
                    .update({ last_billing_reminder_sent_at: new Date().toISOString() })
                    .eq('id', projectId);
                if (updateError) {
                    console.warn(`Failed to update last_billing_reminder_sent_at for project ${projectId}:`, updateError.message);
                }
            }
        }

        await supabaseAdmin.from('pending_notifications').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', notification.id);
        successCount++;

      } catch (e) {
        failureCount++;
        const newRetryCount = (notification.retry_count || 0) + 1;
        const newStatus = newRetryCount >= 3 ? 'failed' : 'pending';
        console.error(`Failed to process notification ${notification.id} (attempt ${newRetryCount}):`, e.message);
        await supabaseAdmin.from('pending_notifications').update({ 
          status: newStatus, 
          error_message: e.message, 
          processed_at: new Date().toISOString(),
          retry_count: newRetryCount,
        }).eq('id', notification.id);
      }
    }

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