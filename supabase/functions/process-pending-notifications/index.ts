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

const getSystemPrompt = (channel: 'whatsapp' | 'email') => {
  if (channel === 'email') {
    return `Anda adalah asisten notifikasi yang profesional dan efisien. Tugas Anda adalah membuat konten email notifikasi yang jelas dan informatif.

**Aturan Penting:**
1.  **Subjek yang Jelas:** Buat subjek email yang ringkas dan langsung ke intinya (misalnya, "Anda Disebut di Proyek X" atau "Pesan Baru di Grup Y").
2.  **Konten HTML:** Buat isi email dalam format HTML sederhana. Mulai dengan sapaan (misalnya, "Hai [Nama Penerima],").
3.  **Detail Lengkap:** Sertakan semua detail kontekstual yang relevan (siapa yang beraksi, di mana, dan kutipan singkat jika ada).
4.  **Call to Action:** Sertakan tautan (URL) yang jelas di akhir email dengan ajakan untuk bertindak (misalnya, "Lihat Komentar" atau "Buka Proyek").
5.  **Format Profesional:** Gunakan paragraf (<p>) dan format tebal (<strong>) untuk menyorot informasi penting.
6.  **Output JSON:** Respons Anda HARUS berupa objek JSON yang valid dengan dua kunci: "subject" dan "htmlBody". Jangan sertakan teks atau format lain.`;
  }

  // Default to WhatsApp prompt
  return `Anda adalah asisten notifikasi yang ramah dan suportif. Tugas Anda adalah membuat pesan notifikasi WhatsApp yang singkat, natural, dan positif.

**Aturan Penting:**
1.  **Gunakan Variasi Kalimat:** Jangan pernah menggunakan kalimat yang sama persis berulang kali.
2.  **Sertakan Emoji:** Tambahkan satu atau dua emoji yang relevan dan sopan di akhir pesan untuk memberikan sentuhan visual.
3.  **Sentuhan Personal Positif:** Di akhir pesan, sertakan satu kalimat positif yang ringan dan relevan.
4.  **Jaga Profesionalisme:** Pastikan nada tetap profesional namun ramah.
5.  **Format:** Gunakan format tebal WhatsApp (*kata*) untuk nama orang, nama proyek, nama tugas, dll.
6.  **Konteks Pesan:** Jika isi pesan/komentar disediakan, kutip sebagian kecil saja (misalnya, 5-7 kata pertama) menggunakan format miring (_"kutipan..."_). Jangan kutip seluruh pesan.
7.  **Singkat:** Jaga agar keseluruhan pesan notifikasi tetap singkat dan langsung ke intinya.
8.  **Sertakan URL:** Jika URL disediakan dalam konteks, Anda HARUS menyertakannya secara alami di akhir pesan.`;
};

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
    let cancelledCount = 0;

    for (const notification of pendingNotifications) {
      const notificationId = notification.id;
      try {
        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'processing', processed_at: new Date().toISOString() }).eq('id', notificationId);
        console.log(`[process-and-send] [${notificationId}] Processing notification of type: ${notification.notification_type}`);
        
        if (notification.notification_type === 'new_chat_message') {
          const { data: participantData, error: participantError } = await supabaseAdmin
            .from('conversation_participants')
            .select('read_at')
            .eq('conversation_id', notification.conversation_id)
            .eq('user_id', notification.recipient_id)
            .single();

          if (participantError) throw new Error(`Failed to fetch participant data: ${participantError.message}`);

          if (participantData.read_at && new Date(participantData.read_at) > new Date(notification.created_at)) {
            console.log(`[process-and-send] [${notificationId}] Cancelling chat notification as user has already read the conversation.`);
            await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'cancelled', error_message: 'User read conversation before notification was sent.' }).eq('id', notificationId);
            cancelledCount++;
            continue;
          }
        }

        const { data: recipientData, error: recipientError } = await supabaseAdmin.from('profiles').select('id, first_name, last_name, email, phone, notification_preferences').eq('id', notification.recipient_id).single();
        if (recipientError) throw new Error(`Failed to fetch recipient profile: ${recipientError.message}`);
        
        const prefs = recipientData.notification_preferences || {};
        const notificationType = notification.notification_type || 'new_chat_message';
        const typePrefs = prefs[notificationType] || {};

        // Check per-type settings, default to true if not specified
        const isWhatsappEnabled = typePrefs.whatsapp !== false;
        const isEmailEnabled = typePrefs.email === true; // Email is opt-in

        let whatsappSent = false;
        let emailSent = false;

        const recipientName = `${recipientData.first_name || ''} ${recipientData.last_name || ''}`.trim() || recipientData.email;
        
        // --- Send WhatsApp Notification ---
        if (isWhatsappEnabled) {
          const recipientPhone = formatPhoneNumberForApi(recipientData.phone);
          if (recipientPhone) {
            try {
              const userPrompt = `**Konteks:**\n- **Jenis:** Notifikasi ${notificationType}\n- **Penerima:** ${recipientName}\n- **Detail:** ${JSON.stringify(notification.context_data)}\n\nBuat pesan notifikasi WhatsApp yang sesuai.`;
              const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
              const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 150, system: getSystemPrompt('whatsapp'), messages: [{ role: "user", content: userPrompt }] });
              const aiMessage = aiResponse.content[0].text;

              const { data: wbizConfig } = await supabaseAdmin.from('app_config').select('key, value').in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);
              const clientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
              const apiKey = wbizConfig?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
              const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');
              if (!clientId || !apiKey || !whatsappClientId) throw new Error("WBIZTOOL credentials not configured.");

              const wbizPayload = { client_id: parseInt(clientId, 10), api_key: apiKey, whatsapp_client: parseInt(whatsappClientId, 10), phone: recipientPhone, message: aiMessage };
              const wbizResponse = await fetch("https://wbiztool.com/api/v1/send_msg/", { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-ID': clientId, 'X-Api-Key': apiKey }, body: JSON.stringify(wbizPayload) });
              if (!wbizResponse.ok) {
                  const errorData = await wbizResponse.json().catch(() => ({}));
                  throw new Error(`WBIZTOOL API Error (${wbizResponse.status}): ${errorData.message || 'Unknown error'}`);
              }
              whatsappSent = true;
            } catch (e) {
              console.error(`[process-and-send] [${notificationId}] Failed to send WhatsApp:`, e.message);
            }
          }
        }

        // --- Send Email Notification ---
        if (isEmailEnabled) {
          const recipientEmail = recipientData.email;
          if (recipientEmail) {
            try {
              const userPrompt = `**Konteks:**\n- **Jenis:** Notifikasi ${notificationType}\n- **Penerima:** ${recipientName}\n- **Detail:** ${JSON.stringify(notification.context_data)}\n\nBuat subjek dan isi email notifikasi yang sesuai.`;
              const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
              const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 400, system: getSystemPrompt('email'), messages: [{ role: "user", content: userPrompt }] });
              const jsonMatch = aiResponse.content[0].text.match(/{[\s\S]*}/);
              if (!jsonMatch) throw new Error("AI response for email was not valid JSON.");
              const { subject, htmlBody } = JSON.parse(jsonMatch[0]);

              const { data: emailitConfig } = await supabaseAdmin.from('app_config').select('value').eq('key', 'EMAILIT_API_KEY').single();
              const emailitApiKey = emailitConfig?.value;
              if (!emailitApiKey) throw new Error("Emailit API key not configured.");

              const emailPayload = { from: Deno.env.get("EMAIL_FROM") ?? "7i Portal <no-reply@mail.ahensi.com>", to: recipientEmail, subject, html: htmlBody };
              const emailitResponse = await fetch("https://api.emailit.com/v1/emails", { method: "POST", headers: { "Authorization": `Bearer ${emailitApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(emailPayload) });
              if (!emailitResponse.ok) {
                  const errorData = await emailitResponse.json().catch(() => ({}));
                  throw new Error(`Emailit API Error (${emailitResponse.status}): ${errorData.message || 'Unknown error'}`);
              }
              emailSent = true;
            } catch (e) {
              console.error(`[process-and-send] [${notificationId}] Failed to send Email:`, e.message);
            }
          }
        }

        if (whatsappSent || emailSent) {
          await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'sent' }).eq('id', notificationId);
          successCount++;
        } else {
          await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'cancelled', error_message: 'All notification channels for this type are disabled by the user.' }).eq('id', notificationId);
          cancelledCount++;
        }

      } catch (innerError) {
        failureCount++;
        console.error(`[process-and-send] [${notificationId}] Error processing notification:`, innerError.message);
        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'failed', error_message: innerError.message }).eq('id', notificationId);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: pendingNotifications.length, successes: successCount, failures: failureCount, cancelled: cancelledCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[process-pending-notifications] Top-level function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});