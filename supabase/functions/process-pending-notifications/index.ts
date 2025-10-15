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
        console.log(`[process-and-send] [${notificationId}] Fetching context data.`);
        
        const { data: messageData, error: messageError } = await supabaseAdmin.from('messages').select('content, sender_id, attachment_url, attachment_name').eq('id', notification.message_id).single();
        if (messageError) throw new Error(`Failed to fetch message: ${messageError.message}`);

        const [conversationRes, senderRes, recipientRes] = await Promise.all([
          supabaseAdmin.from('conversations').select('is_group, group_name').eq('id', notification.conversation_id).single(),
          supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', messageData.sender_id).single(),
          supabaseAdmin.from('profiles').select('id, first_name, last_name, email, phone').eq('id', notification.recipient_id).single(),
        ]);

        if (conversationRes.error || senderRes.error || recipientRes.error) throw new Error("Failed to fetch full notification context.");
        
        const recipientPhone = formatPhoneNumberForApi(recipientRes.data.phone);
        if (!recipientPhone) throw new Error(`Recipient ${recipientRes.data.id} does not have a valid phone number.`);

        const senderName = `${senderRes.data.first_name || ''} ${senderRes.data.last_name || ''}`.trim() || senderRes.data.email;
        const recipientName = `${recipientRes.data.first_name || ''} ${recipientRes.data.last_name || ''}`.trim() || recipientRes.data.email;
        
        const userPrompt = `**Konteks:**\n- **Pengirim:** ${senderName}\n- **Penerima:** ${recipientName}\n- **Grup:** ${conversationRes.data.is_group ? (conversationRes.data.group_name || 'Grup') : 'Percakapan pribadi'}\n- **Isi Pesan:** ${messageData.content || '(Pesan tidak berisi teks)'}\n\nBuat pesan notifikasi yang sesuai.`;
        
        const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
        const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 150, system: getSystemPrompt(), messages: [{ role: "user", content: userPrompt }] });
        const aiMessage = aiResponse.content[0].text;

        const { data: wbizConfig } = await supabaseAdmin.from('app_config').select('key, value').in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);
        const clientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
        const apiKey = wbizConfig?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
        const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');
        if (!clientId || !apiKey || !whatsappClientId) throw new Error("WBIZTOOL credentials not configured.");

        const finalMessage = `${aiMessage}\n\nBalas di sini: https://7inked.ahensi.xyz/chat`;
        const wbizPayload: any = { client_id: parseInt(clientId, 10), api_key: apiKey, whatsapp_client: parseInt(whatsappClientId, 10), phone: recipientPhone, message: finalMessage };
        if (messageData.attachment_url) {
            wbizPayload.url = messageData.attachment_url;
            wbizPayload.filename = messageData.attachment_name || 'attachment';
        }

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