// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.22.0';
import OpenAI from 'npm:openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("SITE_URL")! || Deno.env.get("VITE_APP_URL")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let wbizConfigCache: { clientId: string; apiKey: string; whatsappClientId: string } | null = null;

const formatPhoneNumberForApi = (phone: string): string | null => {
    if (!phone) return null;
    // Remove all non-digit characters
    let cleaned = phone.trim().replace(/\D/g, '');
    
    // Handle numbers starting with '0'
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    }
    // Handle numbers that are missing the '0' or '62' prefix but are otherwise valid length
    if (cleaned.length > 8 && cleaned.startsWith('8')) {
      return '62' + cleaned;
    }
    // If it already starts with '62', it's good
    if (cleaned.startsWith('62')) {
      return cleaned;
    }
    // Return null if it's not a recognizable Indonesian format
    return null;
};

const getWbizConfig = async () => {
  if (wbizConfigCache) return wbizConfigCache;
  const { data, error } = await supabaseAdmin.from('app_config').select('key, value').in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);
  if (error) throw error;
  const clientId = data?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
  const apiKey = data?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
  const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');
  if (!clientId || !apiKey || !whatsappClientId) throw new Error("WBIZTOOL credentials not fully configured.");
  wbizConfigCache = { clientId, apiKey, whatsappClientId };
  return wbizConfigCache;
};

const sendWhatsappMessage = async (phone: string, message: string) => {
  const config = await getWbizConfig();
  const formattedPhone = formatPhoneNumberForApi(phone);
  if (!formattedPhone) {
    console.warn(`Invalid phone number format: ${phone}. Skipping.`);
    return;
  }

  const devicesResponse = await fetch('https://wbiztool.com/api/get-devices/', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'x-client-id': config.clientId, 'x-api-key': config.apiKey },
  });

  if (!devicesResponse.ok) {
    const errorData = await devicesResponse.json().catch(() => ({}));
    throw new Error(`WBIZTOOL API Error (devices): ${errorData.message || 'Invalid credentials'}`);
  }
  
  const devicesData = await devicesResponse.json();
  const activeDevice = devicesData.data?.find((d: any) => d.status === 'connected');

  if (!activeDevice) throw new Error('No active WBIZTOOL device found.');

  const messageResponse = await fetch('https://wbiztool.com/api/v1/send_msg/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-client-id': config.clientId, 'x-api-key': config.apiKey },
    body: JSON.stringify({ phone: formattedPhone, message: message, device_id: activeDevice.id }),
  });

  if (!messageResponse.ok) {
    const errorData = await messageResponse.json().catch(() => ({}));
    throw new Error(`WBIZTOOL API Error (messages): ${errorData.message || 'Failed to send message'}`);
  }

  return messageResponse.json();
};

const getSystemPrompt = () => `Anda adalah asisten AI untuk platform manajemen proyek bernama 7i Portal. Tugas Anda adalah membuat pesan notifikasi WhatsApp yang singkat, ramah, dan profesional dalam Bahasa Indonesia.

**Aturan Penting:**
1.  **Bahasa:** Seluruh pesan WAJIB dalam Bahasa Indonesia.
2.  **Nada:** Gunakan sapaan yang ramah (misalnya, "Hai [Nama],"), diikuti dengan pesan yang jelas dan positif.
3.  **Emoji:** Awali setiap pesan dengan SATU emoji yang relevan dengan konteks notifikasi.
4.  **Format:** Gunakan format tebal WhatsApp (*kata*) untuk menyorot detail penting seperti nama proyek, judul tugas, atau nama orang.
5.  **Mention:** Saat menyebut nama pengguna, formatnya adalah **@Nama Pengguna**. JANGAN gunakan format \`[]()\` atau ID internal.
6.  **URL:** Sertakan HANYA SATU URL lengkap di baris terakhir pesan. Jangan menambah teks lain setelah URL.
7.  **Singkat:** Buat pesan seefisien mungkin, langsung ke intinya.

Anda akan diberikan konteks untuk setiap notifikasi. Gunakan konteks tersebut untuk membuat pesan yang sesuai.`;

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

const generateChatEmailHtml = (recipientName: string, messages: any[], conversationData: any, senderName: string) => {
    const messageHtml = messages.map(msg => {
        const sender = getFullName(msg.sender);
        const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eeeeee;">
                <p style="margin: 0; font-weight: 600; color: #111827;">${sender} <span style="font-weight: 400; color: #6b7280; font-size: 12px;">${time}</span></p>
                <p style="margin: 4px 0 0; color: #374151;">${msg.content.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }).join('');

    const conversationName = conversationData.is_group ? `the group "${conversationData.group_name}"` : `your chat with ${senderName}`;

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111827;">
        <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 8px;">New Messages in 7i Portal</h2>
        <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi ${recipientName},</p>
        <p style="font-size: 16px; color: #374151;">You have ${messages.length} new message(s) in ${conversationName}.</p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 24px; margin-bottom: 24px;">
            ${messageHtml}
        </div>
        <a href="${APP_URL}/chat?highlight=${conversationData.id}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #008A9E; text-decoration: none; border-radius: 8px; font-weight: 600;">View Conversation</a>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">You are receiving this because you have email notifications enabled for new chat messages.</p>
    </div>
    `;
};

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
      .from('pending_whatsapp_notifications')
      .select('*, recipient:profiles(*)')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .limit(50);

    if (fetchError) throw fetchError;

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending notifications.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const recipientIds = notifications.map(n => n.recipient_id).filter(Boolean);
    const { data: peopleData } = await supabaseAdmin.from('people').select('user_id, contact').in('user_id', recipientIds);
    const peopleContactMap = new Map(peopleData?.map(p => [p.user_id, p.contact]) || []);

    let successCount = 0, failureCount = 0, skippedCount = 0;

    const userIds = new Set<string>();
    const projectIds = new Set<string>();
    const taskIds = new Set<string>();
    const goalIds = new Set<string>();
    const folderIds = new Set<string>();
    const conversationIds = new Set<string>();

    notifications.forEach(n => {
        if (n.context_data) {
            Object.values(n.context_data).forEach(value => {
                if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                    userIds.add(value);
                }
            });
            if (n.context_data.project_id) projectIds.add(n.context_data.project_id);
            if (n.context_data.task_id) taskIds.add(n.context_data.task_id);
            if (n.context_data.goal_id) goalIds.add(n.context_data.goal_id);
            if (n.context_data.folder_id) folderIds.add(n.context_data.folder_id);
        }
        if (n.conversation_id) conversationIds.add(n.conversation_id);
    });

    const [profilesRes, projectsRes, tasksRes, goalsRes, foldersRes, conversationsRes] = await Promise.all([
        userIds.size > 0 ? supabaseAdmin.from('profiles').select('id, first_name, last_name, email').in('id', Array.from(userIds)) : Promise.resolve({ data: [], error: null }),
        projectIds.size > 0 ? supabaseAdmin.from('projects').select('id, name, slug').in('id', Array.from(projectIds)) : Promise.resolve({ data: [], error: null }),
        taskIds.size > 0 ? supabaseAdmin.from('tasks').select('id, title, project_id').in('id', Array.from(taskIds)) : Promise.resolve({ data: [], error: null }),
        goalIds.size > 0 ? supabaseAdmin.from('goals').select('id, title, slug').in('id', Array.from(goalIds)) : Promise.resolve({ data: [], error: null }),
        folderIds.size > 0 ? supabaseAdmin.from('kb_folders').select('id, name, slug').in('id', Array.from(folderIds)) : Promise.resolve({ data: [], error: null }),
        conversationIds.size > 0 ? supabaseAdmin.from('conversations').select('id, group_name, is_group').in('id', Array.from(conversationIds)) : Promise.resolve({ data: [], error: null }),
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]));
    const projectMap = new Map(projectsRes.data?.map(p => [p.id, p]));
    const taskMap = new Map(tasksRes.data?.map(t => [t.id, t]));
    const goalMap = new Map(goalsRes.data?.map(g => [g.id, g]));
    const folderMap = new Map(foldersRes.data?.map(f => [f.id, f]));
    const conversationMap = new Map(conversationsRes.data?.map(c => [c.id, c]));

    for (const notification of notifications) {
      try {
        const recipient = notification.recipient;
        if (!recipient) {
          await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', error_message: 'Recipient profile not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
          skippedCount++;
          continue;
        }

        const personContact = peopleContactMap.get(recipient.id);
        const phoneFromPeople = personContact?.phones?.[0];
        const phoneToSend = phoneFromPeople || recipient.phone;
        const prefs = recipient.notification_preferences || {};
        const typePref = prefs[notification.notification_type] || {};

        if (typePref.enabled === false) {
          await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', error_message: 'User disabled this notification type.', processed_at: new Date().toISOString() }).eq('id', notification.id);
          skippedCount++;
          continue;
        }

        let userPrompt = '';
        const context = notification.context_data;
        const recipientName = recipient.first_name || recipient.email.split('@')[0];

        if (notification.notification_type === 'new_chat_message') {
          const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
          const { data: recentMessages, error: messagesError } = await supabaseAdmin
            .from('messages')
            .select('content, sender_id, created_at, sender:profiles(first_name, last_name, email)')
            .eq('conversation_id', notification.conversation_id)
            .gt('created_at', sixMinutesAgo)
            .neq('sender_id', recipient.id)
            .order('created_at', { ascending: true });

          if (messagesError || !recentMessages || recentMessages.length === 0) {
            await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', notification.id);
            successCount++;
            continue;
          }

          const conversationData = conversationMap.get(notification.conversation_id);
          const senderName = getFullName(recentMessages[0].sender);
          const subject = recentMessages.length > 1
            ? `You have new messages in ${conversationData.is_group ? `"${conversationData.group_name}"` : 'your chat'}`
            : `New message from ${senderName}`;

          if (typePref.email !== false && recipient.email) {
            const emailHtml = generateChatEmailHtml(recipientName, recentMessages, conversationData, senderName);
            const { error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
                body: { to: recipient.email, subject, html: emailHtml }
            });
            if (emailError) console.error(`[EMAIL] Failed for notif ${notification.id}:`, emailError.message);
            else console.log(`[EMAIL] Sent for notif ${notification.id} to ${recipient.email}`);
          }

          if (typePref.whatsapp !== false && phoneToSend) {
            const messagesForPrompt = recentMessages.map(m => `${getFullName(m.sender)}: ${m.content}`).join('\n');
            userPrompt = `Buat notifikasi ringkasan chat. Penerima: ${recipientName}. Pengirim: ${senderName}. Percakapan: "${conversationData.is_group ? conversationData.group_name : senderName}". Ada ${recentMessages.length} pesan baru. Ringkasan pesan: ${messagesForPrompt}. URL: ${APP_URL}/chat?highlight=${notification.conversation_id}`;
            const aiMessage = await generateAiMessage(userPrompt);
            await sendWhatsappMessage(phoneToSend, aiMessage);
          }
        } else {
            switch (notification.notification_type) {
              case 'billing_reminder': {
                const { project_name, days_overdue } = context;
                if (!project_name) throw new Error('Missing project_name for billing_reminder');
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
              case 'task_assignment': {
                const taskData = taskMap.get(context.task_id);
                const projectData = projectMap.get(taskData?.project_id);
                const assignerData = profileMap.get(context.assigner_id);
                if (!taskData || !projectData || !assignerData) throw new Error('Missing context data for task_assignment');
                userPrompt = `Buat notifikasi penugasan tugas. Penerima: ${recipientName}. Pemberi tugas: ${getFullName(assignerData)}. Judul tugas: "${taskData.title}". Proyek: "${projectData.name}". URL: ${APP_URL}/projects/${projectData.slug}?tab=tasks&task=${context.task_id}`;
                break;
              }
              case 'new_task': {
                const { task_title, creator_id, project_name, project_slug, task_id } = context;
                const creatorData = profileMap.get(creator_id);
                if (!task_title || !creatorData || !project_name || !project_slug || !task_id) {
                    throw new Error('Missing context data for new_task notification');
                }
                userPrompt = `Buat notifikasi tugas baru. Penerima: ${recipientName}. Pembuat tugas: ${getFullName(creatorData)}. Judul tugas: "${task_title}". Proyek: "${project_name}". URL: ${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
                break;
              }
              case 'discussion_mention': {
                const { project_id, mentioner_id } = context;
                const projectData = projectMap.get(project_id);
                const mentionerData = profileMap.get(mentioner_id);
                if (!projectData || !mentionerData) throw new Error('Missing context data for discussion_mention');
                userPrompt = `Buat notifikasi mention. Penerima: ${recipientName}. Yang me-mention: ${getFullName(mentionerData)}. Proyek: "${projectData.name}". URL: ${APP_URL}/projects/${projectData.slug}`;
                break;
              }
              case 'task_completed': {
                const taskData = taskMap.get(context.task_id);
                const completerData = profileMap.get(context.completer_id);
                if (!taskData || !completerData) throw new Error('Missing context data for task_completed');
                userPrompt = `Buat notifikasi tugas selesai. Penerima: ${recipientName}. Yang menyelesaikan: ${getFullName(completerData)}. Judul tugas: "${taskData.title}". Proyek: "${context.project_name}". URL: ${APP_URL}/projects/${context.project_slug}?tab=tasks&task=${context.task_id}`;
                break;
              }
              case 'project_invite': {
                const projectData = projectMap.get(context.project_id);
                const inviterData = profileMap.get(context.inviter_id);
                if (!projectData || !inviterData) throw new Error('Missing context data for project_invite');
                userPrompt = `Buat notifikasi undangan proyek. Penerima: ${recipientName}. Pengundang: ${getFullName(inviterData)}. Proyek: "${projectData.name}". URL: ${APP_URL}/projects/${projectData.slug}`;
                break;
              }
              case 'goal_invite': {
                const goalData = goalMap.get(context.goal_id);
                const inviterData = profileMap.get(context.inviter_id);
                if (!goalData || !inviterData) throw new Error('Missing context data for goal_invite');
                userPrompt = `Buat notifikasi undangan kolaborasi goal. Penerima: ${recipientName}. Pengundang: ${getFullName(inviterData)}. Judul goal: "${goalData.title}". URL: ${APP_URL}/goals/${goalData.slug}`;
                break;
              }
              case 'kb_invite': {
                const folderData = folderMap.get(context.folder_id);
                const inviterData = profileMap.get(context.inviter_id);
                if (!folderData || !inviterData) throw new Error('Missing context data for kb_invite');
                userPrompt = `Buat notifikasi undangan kolaborasi knowledge base. Penerima: ${recipientName}. Pengundang: ${getFullName(inviterData)}. Nama folder: "${folderData.name}". URL: ${APP_URL}/knowledge-base/folders/${folderData.slug}`;
                break;
              }
              case 'payment_status_updated': {
                const projectData = projectMap.get(context.project_id);
                const updaterData = profileMap.get(context.updater_id);
                if (!projectData || !updaterData) throw new Error('Missing context data for payment_status_updated');
                userPrompt = `Buat notifikasi pembaruan status pembayaran. Penerima: ${recipientName}. Yang memperbarui: ${getFullName(updaterData)}. Proyek: "${projectData.name}". Status baru: *${context.new_status}*. URL: ${APP_URL}/projects/${projectData.slug}`;
                break;
              }
              case 'project_status_updated': {
                const projectData = projectMap.get(context.project_id);
                const updaterData = profileMap.get(context.updater_id);
                if (!projectData || !updaterData) throw new Error('Missing context data for project_status_updated');
                userPrompt = `Buat notifikasi pembaruan status proyek. Penerima: ${recipientName}. Yang memperbarui: ${getFullName(updaterData)}. Proyek: "${projectData.name}". Status diubah dari *${context.old_status}* menjadi *${context.new_status}*. URL: ${APP_URL}/projects/${projectData.slug}`;
                break;
              }
              case 'goal_progress_update': {
                const goalData = goalMap.get(context.goal_id);
                const updaterData = profileMap.get(context.updater_id);
                if (!goalData || !updaterData) throw new Error('Missing context data for goal_progress_update');
                userPrompt = `Buat notifikasi pembaruan progres goal. Penerima: ${recipientName}. Yang memperbarui: ${getFullName(updaterData)}. Goal: "${goalData.title}". Progres baru dicatat. URL: ${APP_URL}/goals/${goalData.slug}`;
                break;
              }
              case 'task_overdue': {
                const { task_title, project_name, project_slug, task_id, days_overdue } = context;
                if (!task_title || !project_name || !project_slug || !task_id || days_overdue === undefined) {
                  throw new Error('Missing context data for task_overdue notification');
                }
                userPrompt = `Buat notifikasi tugas yang telah jatuh tempo. Penerima: ${recipientName}. Judul tugas: "${task_title}". Proyek: "${project_name}". Tugas ini telah terlambat *${days_overdue} hari*. URL: ${APP_URL}/projects/${project_slug}?tab=tasks&task=${task_id}`;
                break;
              }
              default:
                throw new Error(`Unsupported notification type: ${notification.notification_type}`);
            }
            if (typePref.whatsapp !== false && phoneToSend) {
                const aiMessage = await generateAiMessage(userPrompt);
                await sendWhatsappMessage(phoneToSend, aiMessage);
            }
        }

        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', notification.id);
        successCount++;

      } catch (e) {
        failureCount++;
        console.error(`Failed to process notification ${notification.id}:`, e.message);
        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'error', error_message: e.message, processed_at: new Date().toISOString() }).eq('id', notification.id);
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