// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.22.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const formatPhoneNumberForApi = (phone: string): string | null => {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    }
    if (cleaned.startsWith('62')) {
      return cleaned;
    }
    if (cleaned.length > 8 && cleaned.startsWith('8')) {
      return '62' + cleaned;
    }
    return cleaned;
};

const getSystemPrompt = () => `Anda adalah asisten notifikasi yang ramah dan suportif. Tugas Anda adalah membuat pesan notifikasi WhatsApp yang singkat, natural, dan positif.

**Aturan Penting:**
1.  **Gunakan Variasi Kalimat:** Jangan pernah menggunakan kalimat yang sama persis berulang kali.
2.  **Sertakan Emoji:** Tambahkan satu atau dua emoji yang relevan dan sopan di akhir pesan untuk memberikan sentuhan visual.
3.  **Sentuhan Personal Positif:** Di akhir pesan, sertakan satu kalimat positif yang ringan dan relevan. Variasikan gaya Anda agar tidak monoton:
    *   **Pertanyaan Ramah:** Ajukan pertanyaan singkat yang tidak perlu dijawab (misal: _Sudah ngopi pagi ini? ☕_, _Jangan lupa istirahat sejenak ya!_).
    *   **Observasi Positif:** Berikan komentar positif singkat (misal: _Kolaborasi tim yang hebat!_, _Satu langkah lebih dekat menuju sukses._).
    *   **Penyemangat Klasik:** Gunakan kalimat penyemangat jika dirasa paling cocok (misal: _Semangat terus!_, _Anda pasti bisa!_).
4.  **Jaga Profesionalisme:** Pastikan nada tetap profesional namun ramah.
5.  **Format:** Gunakan format tebal WhatsApp (*kata*) untuk nama orang, nama proyek, nama tugas, dll.
6.  **Konteks Pesan:** Jika isi pesan/komentar disediakan, kutip sebagian kecil saja (misalnya, 5-7 kata pertama) menggunakan format miring (_"kutipan..."_). Jangan kutip seluruh pesan.
7.  **Singkat:** Jaga agar keseluruhan pesan notifikasi tetap singkat dan langsung ke intinya.
8.  **Sertakan URL:** Jika URL disediakan dalam konteks, Anda HARUS menyertakannya secara alami di akhir pesan.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log("[process-pending-notifications] Cron job triggered. Fetching pending notifications.");
    const { data: pendingNotifications, error: fetchError } = await supabaseAdmin
      .from('pending_whatsapp_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .limit(10);

    if (fetchError) throw fetchError;

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log("[process-pending-notifications] No pending notifications to process.");
      return new Response(JSON.stringify({ message: "No pending notifications." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[process-pending-notifications] Found ${pendingNotifications.length} notifications to process.`);
    let successCount = 0;
    let failureCount = 0;

    for (const notification of pendingNotifications) {
      const notificationId = notification.id;
      try {
        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'processing', processed_at: new Date().toISOString() }).eq('id', notificationId);
        console.log(`[process-and-send] [${notificationId}] Processing notification of type: ${notification.notification_type}`);
        
        const { data: recipientData, error: recipientError } = await supabaseAdmin.from('profiles').select('id, first_name, last_name, email, phone').eq('id', notification.recipient_id).single();
        if (recipientError) throw new Error(`Failed to fetch recipient profile: ${recipientError.message}`);
        
        const recipientPhone = formatPhoneNumberForApi(recipientData.phone);
        if (!recipientPhone) {
            const errorMessage = `Recipient ${recipientData.id} does not have a valid phone number.`;
            console.warn(`[process-and-send] [${notificationId}] Skipping notification: ${errorMessage}`);
            await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'failed', error_message: 'Recipient does not have a valid phone number.' }).eq('id', notificationId);
            failureCount++;
            continue;
        }

        let userPrompt = '';
        let attachmentPayload = {};
        const recipientName = `${recipientData.first_name || ''} ${recipientData.last_name || ''}`.trim() || recipientData.email;
        const notificationType = notification.notification_type || 'new_chat_message';

        switch (notificationType) {
          case 'new_chat_message': {
            const { data: participantData, error: participantError } = await supabaseAdmin
              .from('conversation_participants')
              .select('read_at')
              .eq('conversation_id', notification.conversation_id)
              .eq('user_id', notification.recipient_id)
              .single();
            if (participantError) throw new Error(`Failed to fetch participant data: ${participantError.message}`);

            const { data: unreadMessages, error: unreadError } = await supabaseAdmin
              .from('messages')
              .select('content, sender_id, attachment_url, attachment_name')
              .eq('conversation_id', notification.conversation_id)
              .neq('sender_id', notification.recipient_id)
              .gt('created_at', participantData.read_at || new Date(0).toISOString())
              .order('created_at', { ascending: true });
            if (unreadError) throw new Error(`Failed to fetch unread messages: ${unreadError.message}`);
            if (!unreadMessages || unreadMessages.length === 0) {
              await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'sent', error_message: 'No unread messages found to send.' }).eq('id', notificationId);
              successCount++;
              continue;
            }

            const senderId = unreadMessages[0].sender_id;
            const { data: senderData, error: senderError } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', senderId).single();
            if (senderError) throw new Error(`Failed to fetch sender profile: ${senderError.message}`);
            const senderName = `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || senderData.email;

            const { data: convoData, error: convoError } = await supabaseAdmin.from('conversations').select('is_group, group_name').eq('id', notification.conversation_id).single();
            if (convoError) throw new Error(`Failed to fetch conversation data: ${convoError.message}`);

            if (unreadMessages.length === 1) {
              const msg = unreadMessages[0];
              userPrompt = `**Konteks:**\n- **Jenis:** Pesan Obrolan Baru\n- **Pengirim:** ${senderName}\n- **Penerima:** ${recipientName}\n- **Grup:** ${convoData.is_group ? (convoData.group_name || 'Grup') : 'Percakapan pribadi'}\n- **Isi Pesan:** ${msg.content || '(Pesan tidak berisi teks)'}\n- **URL:** https://7inked.ahensi.xyz/chat\n\nBuat pesan notifikasi yang sesuai dan sertakan URL di akhir.`;
              if (msg.attachment_url) {
                  attachmentPayload = { url: msg.attachment_url, filename: msg.attachment_name || 'attachment' };
              }
            } else {
              const messageContents = unreadMessages.map(m => `- ${m.content || '(Lampiran)'}`).join('\n');
              userPrompt = `**Konteks:**\n- **Jenis:** Beberapa Pesan Obrolan Baru\n- **Pengirim:** ${senderName}\n- **Penerima:** ${recipientName}\n- **Grup:** ${convoData.is_group ? (convoData.group_name || 'Grup') : 'Percakapan pribadi'}\n- **Jumlah Pesan:** ${unreadMessages.length}\n- **Isi Pesan:**\n${messageContents}\n- **URL:** https://7inked.ahensi.xyz/chat\n\nBuat pesan notifikasi yang MERANGKUM semua pesan baru ini menjadi satu notifikasi singkat dan sertakan URL di akhir.`;
            }
            break;
          }
          case 'project_invite': {
            const { project_id, inviter_id } = notification.context_data;
            const [projRes, inviterRes] = await Promise.all([
              supabaseAdmin.from('projects').select('name, slug').eq('id', project_id).single(),
              supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', inviter_id).single(),
            ]);
            if (projRes.error || inviterRes.error) throw new Error("Failed to fetch project invite context.");
            const inviterName = `${inviterRes.data.first_name || ''} ${inviterRes.data.last_name || ''}`.trim() || inviterRes.data.email;
            userPrompt = `**Konteks:**\n- **Jenis:** Undangan Proyek\n- **Pengundang:** ${inviterName}\n- **Penerima:** ${recipientName}\n- **Proyek:** ${projRes.data.name}\n- **URL:** https://7inked.ahensi.xyz/projects/${projRes.data.slug}\n\nBuat pesan notifikasi yang sesuai dan sertakan URL di akhir.`;
            break;
          }
          case 'discussion_mention': {
            const { project_id, comment_id, mentioner_id } = notification.context_data;
            const [projRes, commentRes, mentionerRes] = await Promise.all([
              supabaseAdmin.from('projects').select('name, slug').eq('id', project_id).single(),
              supabaseAdmin.from('comments').select('text').eq('id', comment_id).single(),
              supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', mentioner_id).single(),
            ]);
            if (projRes.error || commentRes.error || mentionerRes.error) throw new Error("Failed to fetch mention context.");
            const mentionerName = `${mentionerRes.data.first_name || ''} ${mentionerRes.data.last_name || ''}`.trim() || mentionerRes.data.email;
            userPrompt = `**Konteks:**\n- **Jenis:** Mention di Diskusi\n- **Penyebut:** ${mentionerName}\n- **Penerima:** ${recipientName}\n- **Proyek:** ${projRes.data.name}\n- **Isi Komentar:** ${commentRes.data.text}\n- **URL:** https://7inked.ahensi.xyz/projects/${projRes.data.slug}\n\nBuat pesan notifikasi yang sesuai dan sertakan URL di akhir.`;
            break;
          }
          case 'task_assignment': {
            const { task_id, assigner_id } = notification.context_data;
            const [taskRes, assignerRes] = await Promise.all([
              supabaseAdmin.from('tasks').select('title, project_id').eq('id', task_id).single(),
              supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', assigner_id).single(),
            ]);
            if (taskRes.error || assignerRes.error) throw new Error("Failed to fetch task assignment context.");
            const { data: projRes, error: projErr } = await supabaseAdmin.from('projects').select('name, slug').eq('id', taskRes.data.project_id).single();
            if (projErr) throw new Error("Failed to fetch project name for task.");
            const assignerName = `${assignerRes.data.first_name || ''} ${assignerRes.data.last_name || ''}`.trim() || assignerRes.data.email;
            userPrompt = `**Konteks:**\n- **Jenis:** Penugasan Tugas\n- **Pemberi Tugas:** ${assignerName}\n- **Penerima:** ${recipientName}\n- **Proyek:** ${projRes.name}\n- **Tugas:** ${taskRes.data.title}\n- **URL:** https://7inked.ahensi.xyz/projects/${projRes.slug}?tab=tasks&task=${task_id}\n\nBuat pesan notifikasi yang sesuai dan sertakan URL di akhir.`;
            break;
          }
          case 'task_completed': {
            const { task_id, completer_id, project_id } = notification.context_data;
            const [taskRes, completerRes, projRes] = await Promise.all([
                supabaseAdmin.from('tasks').select('title').eq('id', task_id).single(),
                supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', completer_id).single(),
                supabaseAdmin.from('projects').select('name, slug').eq('id', project_id).single(),
            ]);
            if (taskRes.error || completerRes.error || projRes.error) throw new Error("Failed to fetch task completion context.");
            
            const completerName = `${completerRes.data.first_name || ''} ${completerRes.data.last_name || ''}`.trim() || completerRes.data.email;
            
            userPrompt = `**Konteks:**\n- **Jenis:** Tugas Selesai\n- **Penyelesai Tugas:** ${completerName}\n- **Penerima:** ${recipientName}\n- **Proyek:** ${projRes.data.name}\n- **Tugas:** ${taskRes.data.title}\n- **URL:** https://7inked.ahensi.xyz/projects/${projRes.data.slug}?tab=tasks&task=${task_id}\n\nBuat pesan notifikasi yang sesuai dan sertakan URL di akhir. Beri tahu penerima bahwa tugas telah selesai.`;
            break;
          }
          case 'payment_status_updated': {
            const { project_id, updater_id, new_status } = notification.context_data;
            const [projRes, updaterRes] = await Promise.all([
                supabaseAdmin.from('projects').select('name').eq('id', project_id).single(),
                supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', updater_id).single(),
            ]);
            if (projRes.error || updaterRes.error) throw new Error("Failed to fetch payment status update context.");
            
            const updaterName = `${updaterRes.data.first_name || ''} ${updaterRes.data.last_name || ''}`.trim() || updaterRes.data.email;
            
            userPrompt = `**Konteks:**\n- **Jenis:** Pembaruan Status Pembayaran\n- **Pengubah Status:** ${updaterName}\n- **Penerima:** ${recipientName}\n- **Proyek:** ${projRes.data.name}\n- **Status Baru:** ${new_status}\n- **URL:** https://7inked.ahensi.xyz/billing\n\nBuat pesan notifikasi yang sesuai dan sertakan URL di akhir. Beri tahu penerima tentang pembaruan status pembayaran.`;
            break;
          }
          case 'project_status_updated': {
            const { project_id, project_slug, updater_id, old_status, new_status } = notification.context_data;
            const [projRes, updaterRes] = await Promise.all([
                supabaseAdmin.from('projects').select('name').eq('id', project_id).single(),
                supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', updater_id).single(),
            ]);
            if (projRes.error || updaterRes.error) throw new Error("Failed to fetch project status update context.");
            
            const updaterName = `${updaterRes.data.first_name || ''} ${updaterRes.data.last_name || ''}`.trim() || updaterRes.data.email;
            
            userPrompt = `**Konteks:**\n- **Jenis:** Pembaruan Status Proyek\n- **Pengubah Status:** ${updaterName}\n- **Penerima:** ${recipientName}\n- **Proyek:** ${projRes.data.name}\n- **Status Lama:** ${old_status}\n- **Status Baru:** ${new_status}\n- **URL:** https://7inked.ahensi.xyz/projects/${project_slug}\n\nBuat pesan notifikasi yang sesuai dan sertakan URL di akhir. Beri tahu penerima tentang pembaruan status proyek.`;
            break;
          }
          case 'goal_invite': {
            const { goal_id, inviter_id } = notification.context_data;
            const [goalRes, inviterRes] = await Promise.all([
              supabaseAdmin.from('goals').select('title, slug').eq('id', goal_id).single(),
              supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', inviter_id).single(),
            ]);
            if (goalRes.error || inviterRes.error) throw new Error("Failed to fetch goal invite context.");
            const inviterName = `${inviterRes.data.first_name || ''} ${inviterRes.data.last_name || ''}`.trim() || inviterRes.data.email;
            userPrompt = `**Konteks:**\n- **Jenis:** Undangan Kolaborasi Goal\n- **Pengundang:** ${inviterName}\n- **Penerima:** ${recipientName}\n- **Goal:** ${goalRes.data.title}\n- **URL:** https://7inked.ahensi.xyz/goals/${goalRes.data.slug}\n\nBuat pesan notifikasi yang sesuai dan sertakan URL di akhir.`;
            break;
          }
          case 'kb_invite': {
            const { folder_id, inviter_id } = notification.context_data;
            const [folderRes, inviterRes] = await Promise.all([
              supabaseAdmin.from('kb_folders').select('name, slug').eq('id', folder_id).single(),
              supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', inviter_id).single(),
            ]);
            if (folderRes.error || inviterRes.error) throw new Error("Failed to fetch knowledge base invite context.");
            const inviterName = `${inviterRes.data.first_name || ''} ${inviterRes.data.last_name || ''}`.trim() || inviterRes.data.email;
            userPrompt = `**Konteks:**\n- **Jenis:** Undangan Kolaborasi Knowledge Base\n- **Pengundang:** ${inviterName}\n- **Penerima:** ${recipientName}\n- **Folder:** ${folderRes.data.name}\n- **URL:** https://7inked.ahensi.xyz/knowledge-base/folders/${folderRes.data.slug}\n\nBuat pesan notifikasi yang sesuai dan sertakan URL di akhir.`;
            break;
          }
          default:
            throw new Error(`Unknown notification type: ${notificationType}`);
        }

        const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
        const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 150, system: getSystemPrompt(), messages: [{ role: "user", content: userPrompt }] });
        const aiMessage = aiResponse.content[0].text;

        const { data: wbizConfig } = await supabaseAdmin.from('app_config').select('key, value').in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);
        const clientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
        const apiKey = wbizConfig?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
        const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');
        if (!clientId || !apiKey || !whatsappClientId) throw new Error("WBIZTOOL credentials not configured.");

        const finalMessage = aiMessage;
        const wbizPayload: any = { client_id: parseInt(clientId, 10), api_key: apiKey, whatsapp_client: parseInt(whatsappClientId, 10), phone: recipientPhone, message: finalMessage, ...attachmentPayload };

        const wbizResponse = await fetch("https://wbiztool.com/api/v1/send_msg/", { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-ID': clientId, 'X-Api-Key': apiKey }, body: JSON.stringify(wbizPayload) });
        if (!wbizResponse.ok) {
            const errorData = await wbizResponse.json().catch(() => ({}));
            throw new Error(`WBIZTOOL API Error (${wbizResponse.status}): ${errorData.message || 'Unknown error'}`);
        }

        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'sent' }).eq('id', notificationId);
        successCount++;
        console.log(`[process-and-send] [${notificationId}] Successfully processed and sent.`);
      } catch (innerError) {
        failureCount++;
        console.error(`[process-and-send] [${notificationId}] Error processing notification:`, innerError.message);
        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'failed', error_message: innerError.message }).eq('id', notificationId);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: pendingNotifications.length, successes: successCount, failures: failureCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[process-pending-notifications] Top-level function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});