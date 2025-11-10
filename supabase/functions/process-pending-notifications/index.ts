// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
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
          case 'new_chat_message':
          case 'new_chat_message_email': {
            const { sender_id, conversation_id } = context;
            if (!sender_id || !conversation_id) throw new Error('Missing context for new_chat_message');

            const { data: senderData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', sender_id).single();
            const { data: convoData } = await supabaseAdmin.from('conversations').select('is_group, group_name').eq('id', conversation_id).single();
            if (!senderData || !convoData) throw new Error('Could not fetch sender or conversation details.');

            const senderName = getFullName(senderData);
            let conversationName = convoData.group_name;
            if (!convoData.is_group) {
              const { data: otherParticipant } = await supabaseAdmin.from('conversation_participants').select('user:profiles(first_name, last_name, email)').eq('conversation_id', conversation_id).neq('user_id', recipient.id).limit(1).single();
              conversationName = otherParticipant ? getFullName(otherParticipant.user) : 'your chat';
            }

            const url = `${APP_URL}/chat`;
            userPrompt = `Buat notifikasi pesan chat baru. Penerima: ${recipientName}. Pengirim: ${senderName}. Percakapan: "${conversationName}". URL: ${url}`;
            
            if (notification.notification_type === 'new_chat_message_email') {
              const subject = `Pesan baru dari ${senderName}`;
              const html = `<p>Hai ${recipientName},</p><p>Anda memiliki pesan baru dari <strong>${senderName}</strong> di percakapan <em>${conversationName}</em>.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Pesan</a>`;
              await sendEmail(recipient.email, subject, html, `Pesan baru dari ${senderName}. Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'discussion_mention':
          case 'discussion_mention_email': {
            const { project_name: projectName, project_slug: projectSlug, mentioner_name: mentionerName, comment_text: commentText, task_id: taskId } = context;
            const url = taskId
              ? `${APP_URL}/projects/${projectSlug}?tab=tasks&task=${taskId}`
              : `${APP_URL}/projects/${projectSlug}?tab=discussion`;
            
            userPrompt = `Buat notifikasi mention. Penerima: ${recipientName}. Pengirim: ${mentionerName}. Proyek: "${projectName}". URL: ${url}`;
            
            if (notification.notification_type === 'discussion_mention_email') {
              const subject = `You were mentioned in the project: ${projectName}`;
              const html = `
                  <p>Hi ${recipientName},</p>
                  <p><strong>${mentionerName}</strong> mentioned you in a comment on the project <strong>${projectName}</strong>.</p>
                  <blockquote style="border-left: 4px solid #ccc; padding-left: 1em; margin: 1em 0; color: #666;">
                      ${commentText.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')}
                  </blockquote>
                  <p>You can view the comment by clicking the button below:</p>
                  <a href="${url}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #008A9E; text-decoration: none; border-radius: 8px;">View Comment</a>
              `;
              const text = `Hi, ${mentionerName} mentioned you in a comment on the project ${projectName}. View it here: ${url}`;
              await sendEmail(recipient.email, subject, html, text);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'new_task':
          case 'new_task_email': {
            const { creator_name, task_title, project_name, project_slug, task_id } = context;
            const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
            userPrompt = `Buat notifikasi tugas baru. Penerima: ${recipientName}. Pembuat tugas: ${creator_name}. Judul tugas: "${task_title}". Proyek: "${project_name}". URL: ${url}`;
            
            if (notification.notification_type === 'new_task_email') {
              const subject = `Tugas baru dibuat di proyek: ${project_name}`;
              const html = `<p>Hai ${recipientName},</p><p><strong>${creator_name}</strong> baru saja membuat tugas baru, <em>"${task_title}"</em>, di proyek <strong>${project_name}</strong>.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Tugas</a>`;
              await sendEmail(recipient.email, subject, html, `Tugas baru "${task_title}" di proyek ${project_name}. Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'new_ticket':
          case 'new_ticket_email': {
            const { creator_name, ticket_content, project_name, project_slug, task_id } = context;
            const truncatedContent = truncate(ticket_content, 100);
            const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
            userPrompt = `Buat notifikasi tiket baru. Penerima: ${recipientName}. Pembuat tiket: ${creator_name}. Isi tiket (ringkasan): "${truncatedContent}". Proyek: "${project_name}". URL: ${url}`;
            
            if (notification.notification_type === 'new_ticket_email') {
              const subject = `Tiket baru di proyek: ${project_name}`;
              const html = `<p>Hai ${recipientName},</p><p><strong>${creator_name}</strong> membuat tiket baru di proyek <strong>${project_name}</strong>:</p><blockquote>${ticket_content}</blockquote><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Tiket</a>`;
              await sendEmail(recipient.email, subject, html, `Tiket baru di proyek ${project_name}. Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'task_assignment':
          case 'task_assignment_email': {
            const { assigner_name, task_title, project_name, project_slug, task_id } = context;
            const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
            userPrompt = `Buat notifikasi penugasan tugas. Penerima: ${recipientName}. Pemberi tugas: ${assigner_name}. Judul tugas: "${task_title}". Proyek: "${project_name}". URL: ${url}`;
            
            if (notification.notification_type === 'task_assignment_email') {
              const subject = `Anda ditugaskan untuk tugas baru: ${task_title}`;
              const html = `<p>Hai ${recipientName},</p><p><strong>${assigner_name}</strong> menugaskan Anda untuk tugas <em>"${task_title}"</em> di proyek <strong>${project_name}</strong>.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Tugas</a>`;
              await sendEmail(recipient.email, subject, html, `Anda ditugaskan untuk tugas "${task_title}". Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'task_completed':
          case 'task_completed_email': {
            const { completer_name, task_title, project_name, project_slug } = context;
            const url = `${APP_URL}/projects/${project_slug}`;
            userPrompt = `Buat notifikasi penyelesaian tugas. Penerima: ${recipientName}. Yang menyelesaikan: ${completer_name}. Judul tugas: "${task_title}". Proyek: "${project_name}". URL: ${url}`;
            
            if (notification.notification_type === 'task_completed_email') {
              const subject = `Tugas selesai: ${task_title}`;
              const html = `<p>Hai ${recipientName},</p><p>Tugas <em>"${task_title}"</em> di proyek <strong>${project_name}</strong> telah diselesaikan oleh <strong>${completer_name}</strong>.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Proyek</a>`;
              await sendEmail(recipient.email, subject, html, `Tugas "${task_title}" telah selesai. Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'project_status_updated':
          case 'project_status_updated_email': {
            const { updater_name, project_name, new_status, project_slug } = context;
            const url = `${APP_URL}/projects/${project_slug}`;
            userPrompt = `Buat notifikasi pembaruan status proyek. Penerima: ${recipientName}. Pengubah status: ${updater_name}. Proyek: "${project_name}". Status baru: "${new_status}". URL: ${url}`;
            
            if (notification.notification_type === 'project_status_updated_email') {
              const subject = `Status proyek ${project_name} diperbarui menjadi ${new_status}`;
              const html = `<p>Hai ${recipientName},</p><p>Status proyek <strong>${project_name}</strong> telah diperbarui menjadi <strong>${new_status}</strong> oleh <strong>${updater_name}</strong>.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Proyek</a>`;
              await sendEmail(recipient.email, subject, html, `Status proyek ${project_name} diperbarui. Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'project_invite':
          case 'project_invite_email': {
            const { inviter_name, project_name, project_slug } = context;
            const url = `${APP_URL}/projects/${project_slug}`;
            userPrompt = `Buat notifikasi undangan proyek. Penerima: ${recipientName}. Pengundang: ${inviter_name}. Proyek: "${project_name}". URL: ${url}`;
            
            if (notification.notification_type === 'project_invite_email') {
              const subject = `Anda diundang ke proyek: ${project_name}`;
              const html = `<p>Hai ${recipientName},</p><p><strong>${inviter_name}</strong> telah mengundang Anda untuk berkolaborasi di proyek <strong>${project_name}</strong>.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Proyek</a>`;
              await sendEmail(recipient.email, subject, html, `Anda diundang ke proyek ${project_name}. Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'task_overdue':
          case 'task_overdue_email': {
            const { task_title, project_name, project_slug, task_id, days_overdue } = context;
            const url = `${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
            userPrompt = `Buat notifikasi tugas terlambat. Penerima: ${recipientName}. Judul tugas: "${task_title}". Proyek: "${project_name}". Terlambat: ${days_overdue} hari. URL: ${url}`;
            
            if (notification.notification_type === 'task_overdue_email') {
              const subject = `PENGINGAT: Tugas "${task_title}" telah jatuh tempo`;
              const html = `<p>Hai ${recipientName},</p><p>Ini adalah pengingat bahwa tugas <em>"${task_title}"</em> di proyek <strong>${project_name}</strong> telah melewati tenggat waktu selama <strong>${days_overdue} hari</strong>.</p><p>Mohon segera selesaikan tugas ini.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #dc3545; text-decoration: none; border-radius: 5px;">Lihat Tugas</a>`;
              await sendEmail(recipient.email, subject, html, `Tugas "${task_title}" terlambat. Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'goal_invite':
          case 'goal_invite_email': {
            const { goal_id, inviter_id } = context;
            const { data: goalData } = await supabaseAdmin.from('goals').select('title, slug').eq('id', goal_id).single();
            const { data: inviterData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', inviter_id).single();
            if (!goalData || !inviterData) throw new Error('Missing context for goal_invite');
            
            const inviterName = getFullName(inviterData);
            const url = `${APP_URL}/goals/${goalData.slug}`;
            userPrompt = `Buat notifikasi undangan kolaborasi goal. Penerima: ${recipientName}. Pengundang: ${inviterName}. Goal: "${goalData.title}". URL: ${url}`;

            if (notification.notification_type === 'goal_invite_email') {
              const subject = `Anda diundang untuk berkolaborasi pada sebuah goal: ${goalData.title}`;
              const html = `<p>Hai ${recipientName},</p><p><strong>${inviterName}</strong> mengundang Anda untuk berkolaborasi pada goal <em>"${goalData.title}"</em>.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Goal</a>`;
              await sendEmail(recipient.email, subject, html, `Anda diundang ke goal "${goalData.title}". Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'kb_invite':
          case 'kb_invite_email': {
            const { folder_id, inviter_id } = context;
            const { data: folderData } = await supabaseAdmin.from('kb_folders').select('name, slug').eq('id', folder_id).single();
            const { data: inviterData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', inviter_id).single();
            if (!folderData || !inviterData) throw new Error('Missing context for kb_invite');

            const inviterName = getFullName(inviterData);
            const url = `${APP_URL}/knowledge-base/folders/${folderData.slug}`;
            userPrompt = `Buat notifikasi undangan kolaborasi folder. Penerima: ${recipientName}. Pengundang: ${inviterName}. Folder: "${folderData.name}". URL: ${url}`;

            if (notification.notification_type === 'kb_invite_email') {
              const subject = `Anda diundang untuk berkolaborasi pada folder: ${folderData.name}`;
              const html = `<p>Hai ${recipientName},</p><p><strong>${inviterName}</strong> mengundang Anda untuk berkolaborasi pada folder <em>"${folderData.name}"</em>.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Folder</a>`;
              await sendEmail(recipient.email, subject, html, `Anda diundang ke folder "${folderData.name}". Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'goal_progress_update':
          case 'goal_progress_update_email': {
            const { goal_id, updater_id, value_logged } = context;
            const { data: goalData } = await supabaseAdmin.from('goals').select('title, slug, unit').eq('id', goal_id).single();
            const { data: updaterData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', updater_id).single();
            if (!goalData || !updaterData) throw new Error('Missing context for goal_progress_update');

            const updaterName = getFullName(updaterData);
            const url = `${APP_URL}/goals/${goalData.slug}`;
            const progressText = value_logged ? `${value_logged} ${goalData.unit || ''}`.trim() : 'progres';
            userPrompt = `Buat notifikasi progres goal. Penerima: ${recipientName}. Pencatat progres: ${updaterName}. Goal: "${goalData.title}". Progres yang dicatat: ${progressText}. URL: ${url}`;

            if (notification.notification_type === 'goal_progress_update_email') {
              const subject = `Progres baru pada goal: ${goalData.title}`;
              const html = `<p>Hai ${recipientName},</p><p><strong>${updaterName}</strong> baru saja mencatat progres (${progressText}) pada goal bersama Anda, <em>"${goalData.title}"</em>.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Lihat Progres</a>`;
              await sendEmail(recipient.email, subject, html, `Progres baru pada goal "${goalData.title}". Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          case 'billing_reminder':
          case 'billing_reminder_email': {
            const { project_name, days_overdue } = context;
            const url = `${APP_URL}/billing`;
            let urgency = 'sedikit mendesak';
            if (days_overdue > 30) {
              urgency = 'sangat mendesak dan perlu segera ditindaklanjuti';
            } else if (days_overdue > 7) {
              urgency = 'cukup mendesak';
            }
            
            userPrompt = `Buat notifikasi pengingat tagihan. Penerima: ${recipientName}. Proyek: "${project_name}". Terlambat: ${days_overdue} hari. Tingkat Urgensi: ${urgency}. URL: ${url}`;
            
            if (notification.notification_type === 'billing_reminder_email') {
              const subject = `PENGINGAT: Pembayaran untuk proyek ${project_name} telah jatuh tempo`;
              const html = `<p>Hai ${recipientName},</p><p>Ini adalah pengingat bahwa pembayaran untuk proyek <strong>${project_name}</strong> telah melewati tenggat waktu selama <strong>${days_overdue} hari</strong>.</p><p>Mohon segera selesaikan pembayaran ini.</p><a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #dc3545; text-decoration: none; border-radius: 5px;">Lihat Tagihan</a>`;
              await sendEmail(recipient.email, subject, html, `Pembayaran untuk proyek ${project_name} terlambat. Lihat di: ${url}`);
            } else {
              const aiMessage = await generateAiMessage(userPrompt);
              await sendWhatsappMessage(recipient.phone, aiMessage);
            }
            break;
          }
          default:
            throw new Error(`Unsupported notification type: ${notification.notification_type}`);
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