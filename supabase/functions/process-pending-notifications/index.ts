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
        if (!recipient) {
          await supabaseAdmin.from('pending_notifications').update({ status: 'failed', error_message: 'Recipient profile not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
          skippedCount++;
          continue;
        }

        let userPrompt = '';
        const context = notification.context_data;
        const recipientName = recipient.first_name || recipient.email.split('@')[0];

        switch (notification.notification_type) {
          case 'discussion_mention': {
            if (!recipient.phone) {
              await supabaseAdmin.from('pending_notifications').update({ status: 'skipped', error_message: 'Recipient phone not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
              skippedCount++;
              continue;
            }
            const { project_id, mentioner_id, task_id } = context;
            const { data: projectData } = await supabaseAdmin.from('projects').select('name, slug').eq('id', project_id).single();
            const { data: mentionerData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', mentioner_id).single();
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
              await supabaseAdmin.from('pending_notifications').update({ status: 'skipped', error_message: 'Recipient email not found.', processed_at: new Date().toISOString() }).eq('id', notification.id);
              skippedCount++;
              continue;
            }
            const { project_id, mentioner_id, task_id, comment_id } = context;
            const { data: projectData } = await supabaseAdmin.from('projects').select('name, slug').eq('id', project_id).single();
            const { data: mentionerData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', mentioner_id).single();
            const { data: commentData } = await supabaseAdmin.from('comments').select('text').eq('id', comment_id).single();
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
          // ... other cases would be added here, fetching their own context
          default:
            throw new Error(`Unsupported notification type: ${notification.notification_type}`);
        }

        await supabaseAdmin.from('pending_notifications').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', notification.id);
        successCount++;

      } catch (e) {
        failureCount++;
        const newRetryCount = (notification.retry_count || 0) + 1;
        const newStatus = newRetryCount > 3 ? 'failed' : 'pending';
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