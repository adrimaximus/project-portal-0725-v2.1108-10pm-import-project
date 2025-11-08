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

    let successCount = 0, failureCount = 0, skippedCount = 0;

    const userIds = new Set<string>();
    const projectIds = new Set<string>();
    const taskIds = new Set<string>();
    const goalIds = new Set<string>();
    const folderIds = new Set<string>();
    const commentIds = new Set<string>();

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
            if (n.context_data.comment_id) commentIds.add(n.context_data.comment_id);
        }
    });

    const [profilesRes, projectsRes, tasksRes, goalsRes, foldersRes, commentsRes] = await Promise.all([
        userIds.size > 0 ? supabaseAdmin.from('profiles').select('id, first_name, last_name, email').in('id', Array.from(userIds)) : Promise.resolve({ data: [], error: null }),
        projectIds.size > 0 ? supabaseAdmin.from('projects').select('id, name, slug').in('id', Array.from(projectIds)) : Promise.resolve({ data: [], error: null }),
        taskIds.size > 0 ? supabaseAdmin.from('tasks').select('id, title, project_id').in('id', Array.from(taskIds)) : Promise.resolve({ data: [], error: null }),
        goalIds.size > 0 ? supabaseAdmin.from('goals').select('id, title, slug').in('id', Array.from(goalIds)) : Promise.resolve({ data: [], error: null }),
        folderIds.size > 0 ? supabaseAdmin.from('kb_folders').select('id, name, slug').in('id', Array.from(folderIds)) : Promise.resolve({ data: [], error: null }),
        commentIds.size > 0 ? supabaseAdmin.from('comments').select('id, text, attachments_jsonb').in('id', Array.from(commentIds)) : Promise.resolve({ data: [], error: null }),
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]));
    const projectMap = new Map(projectsRes.data?.map(p => [p.id, p]));
    const taskMap = new Map(tasksRes.data?.map(t => [t.id, t]));
    const goalMap = new Map(goalsRes.data?.map(g => [g.id, g]));
    const folderMap = new Map(foldersRes.data?.map(f => [f.id, f]));
    const commentMap = new Map(commentsRes.data?.map(c => [c.id, c]));

    for (const notification of notifications) {
      try {
        const recipient = notification.recipient;
        if (!recipient) {
          await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', error_message: 'Recipient profile not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
          skippedCount++;
          continue;
        }

        let userPrompt = '';
        const context = notification.context_data;
        const recipientName = recipient.first_name || recipient.email.split('@')[0];

        switch (notification.notification_type) {
          case 'discussion_mention': {
            if (!recipient.phone) {
              await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', error_message: 'Recipient phone not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
              skippedCount++;
              continue;
            }
            const { project_id, mentioner_id, task_id } = context;
            const projectData = projectMap.get(project_id);
            const mentionerData = profileMap.get(mentioner_id);
            if (!projectData || !mentionerData) throw new Error('Missing context data for discussion_mention');
            const url = task_id
              ? `${APP_URL}/projects/${projectData.slug}?tab=tasks&task=${task_id}`
              : `${APP_URL}/projects/${projectData.slug}`;
            userPrompt = `Buat notifikasi mention. Penerima: ${recipientName}. Yang me-mention: ${getFullName(mentionerData)}. Proyek: "${projectData.name}". URL: ${url}`;
            const aiMessage = await generateAiMessage(userPrompt);
            await sendWhatsappMessage(recipient.phone, aiMessage);
            break;
          }
          case 'discussion_mention_email': {
            if (!recipient.email) {
              await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', error_message: 'Recipient email not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
              skippedCount++;
              continue;
            }
            const { project_id, mentioner_id, task_id, comment_id } = context;
            const projectData = projectMap.get(project_id);
            const mentionerData = profileMap.get(mentioner_id);
            const commentData = commentMap.get(comment_id);
            if (!projectData || !mentionerData || !commentData) throw new Error('Missing context for discussion_mention_email');
            
            const url = task_id
              ? `${APP_URL}/projects/${projectData.slug}?tab=tasks&task=${task_id}`
              : `${APP_URL}/projects/${projectData.slug}`;
            
            const subject = `You were mentioned in the project: ${projectData.name}`;
            const html = `
                <p>Hi ${recipientName},</p>
                <p><strong>${getFullName(mentionerData)}</strong> mentioned you in a comment on the project <strong>${projectData.name}</strong>.</p>
                <blockquote style="border-left: 4px solid #ccc; padding-left: 1em; margin: 1em 0; color: #666;">
                    ${commentData.text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')}
                </blockquote>
                <p>You can view the comment by clicking the button below:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #008A9E; text-decoration: none; border-radius: 8px;">View Comment</a>
            `;
            const text = `Hi, ${getFullName(mentionerData)} mentioned you in a comment on the project ${projectData.name}. View it here: ${url}`;

            await sendEmail(recipient.email, subject, html, text);
            break;
          }
          case 'task_assignment': {
            if (!recipient.phone) {
              await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', error_message: 'Recipient phone not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
              skippedCount++;
              continue;
            }
            const { task_id, assigner_id } = context;
            const taskData = taskMap.get(task_id);
            if (!taskData) throw new Error('Task not found for assignment notification');
            const projectData = projectMap.get(taskData.project_id);
            const assignerData = profileMap.get(assigner_id);
            if (!projectData || !assignerData) throw new Error('Missing context data for task_assignment');
            const url = `${APP_URL}/projects/${projectData.slug}?tab=tasks&task=${task_id}`;
            userPrompt = `Buat notifikasi penugasan tugas. Penerima: ${recipientName}. Yang menugaskan: ${getFullName(assignerData)}. Tugas: "${taskData.title}" di proyek "${projectData.name}". URL: ${url}`;
            const aiMessage = await generateAiMessage(userPrompt);
            await sendWhatsappMessage(recipient.phone, aiMessage);
            break;
          }
          case 'goal_invite_email': {
            if (!recipient.email) {
              await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', error_message: 'Recipient email not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
              skippedCount++;
              continue;
            }
            const { goal_id, inviter_id } = context;
            const goalData = goalMap.get(goal_id);
            const inviterData = profileMap.get(inviter_id);
            if (!goalData || !inviterData) throw new Error('Missing context for goal_invite_email');
            
            const url = `${APP_URL}/goals/${goalData.slug}`;
            const subject = `You've been invited to collaborate on a goal: ${goalData.title}`;
            const html = `
                <p>Hi ${recipientName},</p>
                <p><strong>${getFullName(inviterData)}</strong> has invited you to collaborate on the goal "<strong>${goalData.title}</strong>".</p>
                <p>You can view the goal and start collaborating by clicking the button below:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #008A9E; text-decoration: none; border-radius: 8px;">View Goal</a>
            `;
            const text = `Hi, ${getFullName(inviterData)} invited you to the goal "${goalData.title}". View it here: ${url}`;

            await sendEmail(recipient.email, subject, html, text);
            break;
          }
          case 'kb_invite_email': {
            if (!recipient.email) {
              await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', error_message: 'Recipient email not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
              skippedCount++;
              continue;
            }
            const { folder_id, inviter_id } = context;
            const folderData = folderMap.get(folder_id);
            const inviterData = profileMap.get(inviter_id);
            if (!folderData || !inviterData) throw new Error('Missing context for kb_invite_email');
            
            const url = `${APP_URL}/knowledge-base/folders/${folderData.slug}`;
            const subject = `You've been invited to the folder: ${folderData.name}`;
            const html = `
                <p>Hi ${recipientName},</p>
                <p><strong>${getFullName(inviterData)}</strong> has invited you to collaborate on the knowledge base folder "<strong>${folderData.name}</strong>".</p>
                <p>You can view the folder by clicking the button below:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #008A9E; text-decoration: none; border-radius: 8px;">View Folder</a>
            `;
            const text = `Hi, ${getFullName(inviterData)} invited you to the folder "${folderData.name}". View it here: ${url}`;

            await sendEmail(recipient.email, subject, html, text);
            break;
          }
          case 'goal_progress_update_email': {
            if (!recipient.email) {
              await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', error_message: 'Recipient email not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
              skippedCount++;
              continue;
            }
            const { goal_id, updater_id, value_logged } = context;
            const goalData = goalMap.get(goal_id);
            const updaterData = profileMap.get(updater_id);
            if (!goalData || !updaterData) throw new Error('Missing context for goal_progress_update_email');
            
            const url = `${APP_URL}/goals/${goalData.slug}`;
            const subject = `Progress update on your goal: ${goalData.title}`;
            const html = `
                <p>Hi ${recipientName},</p>
                <p><strong>${getFullName(updaterData)}</strong> just logged progress on your shared goal "<strong>${goalData.title}</strong>".</p>
                <p><strong>Progress Logged:</strong> ${value_logged}</p>
                <p>You can view the latest progress by clicking the button below:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #008A9E; text-decoration: none; border-radius: 8px;">View Goal Progress</a>
            `;
            const text = `Hi, ${getFullName(updaterData)} logged progress on "${goalData.title}". View it here: ${url}`;

            await sendEmail(recipient.email, subject, html, text);
            break;
          }
          default:
            throw new Error(`Unsupported notification type: ${notification.notification_type}`);
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