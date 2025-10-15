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
3.  **Beri Semangat:** Sertakan satu kalimat penyemangat yang singkat, sopan, dan relevan dengan konteks kerja.
4.  **Jaga Profesionalisme:** Pastikan nada tetap profesional namun ramah.
5.  **Format:** Gunakan format tebal WhatsApp (*kata*) untuk nama orang dan nama grup.
6.  **Konteks Pesan:** Jika isi pesan disediakan, kutip sebagian kecil saja (misalnya, 5-7 kata pertama) menggunakan format miring (_"kutipan..."_). Jangan kutip seluruh pesan.
7.  **Singkat:** Jaga agar keseluruhan pesan notifikasi tetap singkat dan langsung ke intinya.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { pending_notification_id } = await req.json();
  console.log(`[process-and-send] Function invoked for notification ID: ${pending_notification_id}`);

  try {
    if (!pending_notification_id) {
      throw new Error("Missing pending_notification_id.");
    }

    // 1. Update status to 'processing' to prevent re-runs
    console.log(`[process-and-send] [${pending_notification_id}] Updating status to 'processing'.`);
    const { data: pendingNotification, error: updateError } = await supabaseAdmin
      .from('pending_whatsapp_notifications')
      .update({ status: 'processing', processed_at: new Date().toISOString() })
      .eq('id', pending_notification_id)
      .select()
      .single();

    if (updateError || !pendingNotification) {
      throw new Error(`Notification ${pending_notification_id} not found or already processed.`);
    }

    // 2. Fetch all context data
    console.log(`[process-and-send] [${pending_notification_id}] Fetching context data.`);
    const { data: messageData, error: messageError } = await supabaseAdmin.from('messages').select('content, sender_id, attachment_url, attachment_name').eq('id', pendingNotification.message_id).single();
    if (messageError) throw new Error(`Failed to fetch message: ${messageError.message}`);

    const [conversationRes, senderRes, recipientRes] = await Promise.all([
      supabaseAdmin.from('conversations').select('is_group, group_name').eq('id', pendingNotification.conversation_id).single(),
      supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', messageData.sender_id).single(),
      supabaseAdmin.from('profiles').select('id, first_name, last_name, email, phone').eq('id', pendingNotification.recipient_id).single(),
    ]);

    if (conversationRes.error || senderRes.error || recipientRes.error) {
      throw new Error("Failed to fetch full notification context.");
    }
    console.log(`[process-and-send] [${pending_notification_id}] Context data fetched successfully.`);

    const messageContent = messageData.content;
    const { is_group, group_name } = conversationRes.data;
    const senderName = `${senderRes.data.first_name || ''} ${senderRes.data.last_name || ''}`.trim() || senderRes.data.email;
    const recipientName = `${recipientRes.data.first_name || ''} ${recipientRes.data.last_name || ''}`.trim() || recipientRes.data.email;
    const recipientPhone = formatPhoneNumberForApi(recipientRes.data.phone);

    if (!recipientPhone) {
      // Gracefully handle missing phone number
      const errorMessage = `Recipient ${recipientRes.data.id} does not have a valid phone number.`;
      await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'failed', error_message: errorMessage }).eq('id', pending_notification_id);
      console.log(`[process-and-send] [${pending_notification_id}] Failed: ${errorMessage}. Function complete.`);
      return new Response(JSON.stringify({ success: false, message: errorMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 3. Generate AI message
    console.log(`[process-and-send] [${pending_notification_id}] Generating AI message.`);
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
    const userPrompt = `
      **Konteks:**
      - **Pengirim:** ${senderName}
      - **Penerima:** ${recipientName}
      - **Grup:** ${is_group ? (group_name || 'Grup') : 'Percakapan pribadi'}
      - **Isi Pesan:** ${messageContent || '(Pesan tidak berisi teks)'}

      Buat pesan notifikasi yang sesuai.`;

    const aiResponse = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 150,
      system: getSystemPrompt(),
      messages: [{ role: "user", content: userPrompt }],
    });
    const aiMessage = aiResponse.content[0].text;
    console.log(`[process-and-send] [${pending_notification_id}] AI message generated.`);

    // 4. Send WhatsApp message via WBIZTOOL
    const { data: wbizConfig } = await supabaseAdmin.from('app_config').select('key, value').in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);
    const clientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const apiKey = wbizConfig?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');

    if (!clientId || !apiKey || !whatsappClientId) {
      throw new Error("WBIZTOOL credentials not configured.");
    }

    const finalMessage = `${aiMessage}\n\nBalas di sini: https://7inked.ahensi.xyz/chat`;

    const wbizPayload: any = {
        client_id: parseInt(clientId, 10),
        api_key: apiKey,
        whatsapp_client: parseInt(whatsappClientId, 10),
        phone: recipientPhone,
        message: finalMessage,
    };

    if (messageData.attachment_url) {
        wbizPayload.url = messageData.attachment_url;
        wbizPayload.filename = messageData.attachment_name || 'attachment';
    }

    console.log(`[process-and-send] [${pending_notification_id}] Sending message to ${recipientPhone} via WBIZTOOL.`);
    const wbizResponse = await fetch("https://wbiztool.com/api/v1/send_msg/", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-ID': clientId, 'X-Api-Key': apiKey },
      body: JSON.stringify(wbizPayload),
    });

    if (!wbizResponse.ok) {
      const errorData = await wbizResponse.json().catch(() => ({}));
      throw new Error(`WBIZTOOL API Error (${wbizResponse.status}): ${errorData.message || 'Unknown error'}`);
    }
    console.log(`[process-and-send] [${pending_notification_id}] WBIZTOOL call successful.`);

    // 5. Update notification status to 'sent'
    await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'sent' }).eq('id', pending_notification_id);
    console.log(`[process-and-send] [${pending_notification_id}] Status updated to 'sent'. Function complete.`);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    if (pending_notification_id) {
      await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'failed', error_message: error.message }).eq('id', pending_notification_id);
    }
    console.error(`[process-and-send] [${pending_notification_id}] Function error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});