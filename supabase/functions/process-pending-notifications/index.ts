// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.22.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("SITE_URL")! || Deno.env.get("VITE_APP_URL")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let wbizConfigCache: { clientId: string; apiKey: string; whatsappClientId: string } | null = null;

const formatPhoneNumberForApi = (phone: string): string | null => {
  if (!phone) return null;
  let cleaned = phone.trim().replace(/\D/g, '');
  if (cleaned.startsWith('0')) return '62' + cleaned.substring(1);
  if (cleaned.startsWith('62')) return cleaned;
  if (cleaned.length > 8 && cleaned.startsWith('8')) return '62' + cleaned;
  return cleaned;
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
  const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`WBIZTOOL API Error (${response.status}): ${errorData.message || 'Unknown error'}`);
  }
  return response.json();
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from('pending_whatsapp_notifications')
      .select('*, recipient:profiles(id, email, first_name, last_name, phone, notification_preferences)')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .limit(20);

    if (fetchError) throw fetchError;
    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending notifications.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    let successCount = 0;
    let failureCount = 0;

    for (const notification of notifications) {
      try {
        const recipient = notification.recipient;
        if (!recipient || !recipient.phone) {
          throw new Error(`Recipient ${recipient?.id || 'unknown'} has no phone number.`);
        }

        const prefs = recipient.notification_preferences || {};
        if (prefs[notification.notification_type] === false || prefs.whatsapp === false) {
          await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('id', notification.id);
          continue;
        }

        let userPrompt = '';
        const context = notification.context_data;
        const recipientName = recipient.first_name || recipient.email.split('@')[0];

        switch (notification.notification_type) {
          case 'task_assignment': {
            const { data: taskData } = await supabaseAdmin.from('tasks').select('title, project_id').eq('id', context.task_id).single();
            const { data: projectData } = await supabaseAdmin.from('projects').select('name, slug').eq('id', taskData?.project_id).single();
            const { data: assignerData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', context.assigner_id).single();
            userPrompt = `Buat notifikasi penugasan tugas. Penerima: ${recipientName}. Pemberi tugas: ${getFullName(assignerData)}. Judul tugas: "${taskData.title}". Proyek: "${projectData.name}". URL: ${APP_URL}/projects/${projectData.slug}?tab=tasks&task=${context.task_id}`;
            break;
          }
          case 'discussion_mention': {
            const { data: projectData } = await supabaseAdmin.from('projects').select('name, slug').eq('id', context.project_id).single();
            const { data: mentionerData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', context.mentioner_id).single();
            userPrompt = `Buat notifikasi mention. Penerima: ${recipientName}. Yang me-mention: ${getFullName(mentionerData)}. Proyek: "${projectData.name}". URL: ${APP_URL}/projects/${projectData.slug}`;
            break;
          }
          case 'task_completed': {
            const { data: taskData } = await supabaseAdmin.from('tasks').select('title').eq('id', context.task_id).single();
            const { data: completerData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', context.completer_id).single();
            userPrompt = `Buat notifikasi tugas selesai. Penerima: ${recipientName}. Yang menyelesaikan: ${getFullName(completerData)}. Judul tugas: "${taskData.title}". Proyek: "${context.project_name}". URL: ${APP_URL}/projects/${context.project_slug}?tab=tasks&task=${context.task_id}`;
            break;
          }
          case 'project_invite': {
            const { data: projectData } = await supabaseAdmin.from('projects').select('name, slug').eq('id', context.project_id).single();
            const { data: inviterData } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', context.inviter_id).single();
            userPrompt = `Buat notifikasi undangan proyek. Penerima: ${recipientName}. Pengundang: ${getFullName(inviterData)}. Proyek: "${projectData.name}". URL: ${APP_URL}/projects/${projectData.slug}`;
            break;
          }
          default:
            throw new Error(`Unsupported notification type: ${notification.notification_type}`);
        }

        const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 200, system: getSystemPrompt(), messages: [{ role: "user", content: userPrompt }] });
        const aiMessage = aiResponse.content[0].text;

        await sendWhatsappMessage(recipient.phone, aiMessage);
        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'sent', processed_at: new Date().toISOString() }).eq('id', notification.id);
        successCount++;

      } catch (e) {
        failureCount++;
        console.error(`Failed to process notification ${notification.id}:`, e.message);
        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'error', error_message: e.message, processed_at: new Date().toISOString() }).eq('id', notification.id);
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${notifications.length} notifications. Success: ${successCount}, Failed: ${failureCount}` }), {
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