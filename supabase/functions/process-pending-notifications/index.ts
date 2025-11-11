// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.22.0';
import OpenAI from 'npm:openai@4.29.2';

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

        let userPrompt = '';
        const context = notification.context_data;
        const recipientName = recipient.first_name || recipient.email.split('@')[0];

        switch (notification.notification_type) {
          case 'discussion_mention_email': {
            const { project_name: contextName, project_slug: contextSlug, mentioner_name: mentionerName, comment_text: commentText, task_id: taskId } = context;
            
            const isChatMention = contextSlug === 'chat';
            const url = isChatMention 
                ? `${APP_URL}/chat`
                : (taskId ? `${APP_URL}/projects/${contextSlug}?tab=tasks&task=${taskId}` : `${APP_URL}/projects/${contextSlug}?tab=discussion`);
            
            const subject = `Anda disebut dalam: ${contextName}`;
            const bodyHtml = `
                <p>Hai ${recipientName},</p>
                <p><strong>${mentionerName}</strong> menyebut Anda dalam sebuah komentar di <strong>${contextName}</strong>.</p>
                <blockquote>
                    ${commentText.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<strong>@$1</strong>')}
                </blockquote>
            `;
            const text = `Hai, ${mentionerName} menyebut Anda dalam sebuah komentar di ${contextName}. Lihat di sini: ${url}`;
            const html = createEmailTemplate({
                title: `Anda disebut di "${contextName}"`,
                bodyHtml,
                buttonText: "Lihat Komentar",
                buttonUrl: url,
            });
            await sendEmail(recipient.email, subject, html, text);
            break;
          }
          case 'task_assignment_email': {
            const { assigner_name, task_title, project_name, project_slug, task_id } = context;
            const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
            const subject = `Tugas baru untuk Anda: ${task_title}`;
            const bodyHtml = `<p>Hai ${recipientName},</p><p><strong>${assigner_name}</strong> telah memberikan tugas baru untuk Anda, <em>"${task_title}"</em>, di proyek <strong>${project_name}</strong>.</p>`;
            const text = `Anda mendapat tugas baru: "${task_title}". Lihat di sini: ${url}`;
            const html = createEmailTemplate({
                title: `Tugas Baru di "${project_name}"`,
                bodyHtml,
                buttonText: "Lihat Tugas",
                buttonUrl: url,
            });
            await sendEmail(recipient.email, subject, html, text);
            break;
          }
          case 'project_status_updated_email': {
            const { updater_name, project_name, new_status, project_slug } = context;
            const url = `${APP_URL}/projects/${project_slug}`;
            const subject = `Status Proyek Diperbarui: ${project_name} sekarang ${new_status}`;
            const bodyHtml = `<p>Hai ${recipientName},</p><p>Status untuk proyek <strong>${project_name}</strong> telah diperbarui menjadi <strong>${new_status}</strong> oleh <strong>${updater_name}</strong>.</p>`;
            const text = `Status untuk proyek ${project_name} telah diperbarui menjadi ${new_status}. Lihat proyek: ${url}`;
            const html = createEmailTemplate({
                title: `Status Proyek: ${new_status}`,
                bodyHtml,
                buttonText: "Lihat Proyek",
                buttonUrl: url,
            });
            await sendEmail(recipient.email, subject, html, text);
            break;
          }
          case 'project_invite_email': {
            const { inviter_name, project_name, project_slug } = context;
            const url = `${APP_URL}/projects/${project_slug}`;
            const subject = `Anda diundang ke proyek: ${project_name}`;
            const bodyHtml = `<p>Hai ${recipientName},</p><p><strong>${inviter_name}</strong> telah mengundang Anda untuk berkolaborasi di proyek <strong>${project_name}</strong>.</p>`;
            const text = `Anda diundang untuk berkolaborasi di proyek: ${project_name}. Lihat di sini: ${url}`;
            const html = createEmailTemplate({
                title: `Undangan untuk Berkolaborasi`,
                bodyHtml,
                buttonText: "Lihat Proyek",
                buttonUrl: url,
            });
            await sendEmail(recipient.email, subject, html, text);
            break;
          }
          case 'task_overdue_email': {
            const { task_title, project_name, project_slug, task_id, days_overdue } = context;
            const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
            const subject = `PENGINGAT: Tugas "${task_title}" telah jatuh tempo`;
            const bodyHtml = `<p>Hai ${recipientName},</p><p>Ini adalah pengingat bahwa tugas <em>"${task_title}"</em> di proyek <strong>${project_name}</strong> sekarang telah <strong>${days_overdue} hari</strong> melewati tenggat waktu.</p><p>Mohon untuk segera ditindaklanjuti.</p>`;
            const text = `PENGINGAT: Tugas "${task_title}" telah jatuh tempo selama ${days_overdue} hari. Lihat di sini: ${url}`;
            const html = createEmailTemplate({
                title: `Tugas Jatuh Tempo: ${task_title}`,
                bodyHtml,
                buttonText: "Lihat Tugas",
                buttonUrl: url,
            });
            await sendEmail(recipient.email, subject, html, text);
            break;
          }
          // --- WhatsApp Cases ---
          default: {
            // This will handle all non-email notifications (WhatsApp)
            let finalMessage = '';
            if (notification.notification_type === 'discussion_mention') {
                const { project_name: contextName, project_slug: contextSlug, mentioner_name: mentionerName, task_id: taskId } = context;
                const isChatMention = contextSlug === 'chat';
                const url = isChatMention ? `${APP_URL}/chat` : (taskId ? `${APP_URL}/projects/${contextSlug}?tab=tasks&task=${taskId}` : `${APP_URL}/projects/${contextSlug}?tab=discussion`);
                const contextDescription = isChatMention ? `di chat "${contextName}"` : `dalam proyek "${contextName}"`;
                userPrompt = `Buat notifikasi mention. Penerima: ${recipientName}. Pengirim: ${mentionerName}. Konteks: ${contextDescription}. URL: ${url}`;
                const aiMessage = await generateAiMessage(userPrompt);
                finalMessage = aiMessage.trim();
                if (!finalMessage.includes(url)) { finalMessage += `\n\n${url}`; }
            }
            // ... add other WhatsApp cases here if needed, following the same pattern ...
            else {
                throw new Error(`Unsupported notification type: ${notification.notification_type}`);
            }
            
            if (finalMessage) {
                await sendWhatsappMessage(recipient.phone, finalMessage);
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