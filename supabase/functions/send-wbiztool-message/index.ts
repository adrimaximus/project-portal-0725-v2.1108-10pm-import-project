// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("Unauthorized: Missing or invalid Authorization header.");
    }
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized: Invalid user token.");
    }

    // 2. Get payload
    const { conversation_id, message_id } = await req.json();
    if (!conversation_id || !message_id) {
      throw new Error("Missing required parameters: conversation_id, message_id.");
    }
    console.log(`[WBIZTOOL_DEBUG] Received request for conversation: ${conversation_id}, message: ${message_id}`);

    // 3. Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Fetch all necessary data in parallel
    const [messageRes, conversationRes, wbizConfigRes] = await Promise.all([
        supabaseAdmin.from('messages').select('content, sender_id').eq('id', message_id).single(),
        supabaseAdmin.from('conversations').select('is_group, group_name').eq('id', conversation_id).single(),
        supabaseAdmin.from('app_config').select('key, value').in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY'])
    ]);

    if (messageRes.error || !messageRes.data) throw new Error("Message not found or access denied.");
    if (conversationRes.error) throw new Error(`Conversation not found: ${conversationRes.error.message}`);
    if (wbizConfigRes.error) throw new Error(`Failed to fetch WBIZTOOL config: ${wbizConfigRes.error.message}`);

    const { content: messageContent, sender_id } = messageRes.data;
    const { is_group, group_name } = conversationRes.data;

    // Verify the caller is the sender
    if (sender_id !== user.id) {
      throw new Error("Forbidden: You can only trigger notifications for messages you sent.");
    }

    // 5. Get WBIZTOOL credentials
    const wbizConfig = wbizConfigRes.data;
    if (!wbizConfig || wbizConfig.length < 2) {
      console.warn("[WBIZTOOL_DEBUG] WBIZTOOL credentials not fully configured. Skipping WhatsApp notification.");
      return new Response(JSON.stringify({ message: "WBIZTOOL not configured." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const clientId = wbizConfig.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const apiKey = wbizConfig.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');
    if (!clientId || !apiKey || !whatsappClientId) {
      console.warn("[WBIZTOOL_DEBUG] WBIZTOOL credentials missing. Skipping WhatsApp notification.");
      return new Response(JSON.stringify({ message: "WBIZTOOL credentials missing." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 6. Get sender and recipients details
    const { data: senderProfile } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', sender_id).single();
    const sender_name = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || senderProfile.email;

    const { data: recipients, error: recipientsError } = await supabaseAdmin
      .from('conversation_participants')
      .select('profiles (id, phone, first_name, last_name, email, notification_preferences)')
      .eq('conversation_id', conversation_id)
      .neq('user_id', sender_id);
    if (recipientsError) throw recipientsError;
    console.log(`[WBIZTOOL_DEBUG] Found ${recipients.length} recipients for conversation ${conversation_id}.`);

    // 7. Construct and send messages
    const sendPromises = recipients.map(async (recipient) => {
      const profile = recipient.profiles;
      console.log(`[WBIZTOOL_DEBUG] Processing recipient: ${profile.id}`);
      const formattedPhone = formatPhoneNumberForApi(profile.phone);
      console.log(`[WBIZTOOL_DEBUG] Recipient phone: ${profile.phone}, Formatted: ${formattedPhone}`);
      console.log(`[WBIZTOOL_DEBUG] Recipient notification preferences:`, profile.notification_preferences);

      if (profile && formattedPhone && (profile.notification_preferences?.whatsapp_chat !== false)) {
        const recipientName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;
        
        let intro;
        if (is_group) {
          intro = `Hi *${recipientName}* 👋 Pesan baru dari *${sender_name}* di grup *${group_name || 'Grup'}*:`;
        } else {
          intro = `Hi *${recipientName}* 👋 Pesan baru dari *${sender_name}*:`;
        }

        const messageBody = `_"${messageContent}"_`;
        const finalMessage = `${intro}\n\n${messageBody}`;

        console.log(`[WBIZTOOL_DEBUG] Preparing to send WA to ${formattedPhone}.`);

        const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': clientId,
            'X-Api-Key': apiKey,
          },
          body: JSON.stringify({
            client_id: parseInt(clientId, 10),
            api_key: apiKey,
            whatsapp_client: parseInt(whatsappClientId, 10),
            phone: formattedPhone,
            message: finalMessage,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`[WBIZTOOL_DEBUG] Failed to send WA to ${profile.phone}: ${response.statusText}`, errorData);
        } else {
          console.log(`[WBIZTOOL_DEBUG] Successfully sent WA to ${profile.phone}`);
        }
      } else {
        console.log(`[WBIZTOOL_DEBUG] Skipping recipient ${profile.id} due to missing phone or disabled preference.`);
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, message: "Notifications triggered." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[WBIZTOOL_DEBUG] Function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});