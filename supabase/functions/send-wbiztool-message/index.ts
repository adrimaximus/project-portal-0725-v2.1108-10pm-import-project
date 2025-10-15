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
  // 1. Hapus semua karakter non-digit
  let cleaned = phone.trim().replace(/\D/g, '');
  
  // 2. Normalisasi berdasarkan awalan
  if (cleaned.startsWith('0')) {
    // Ganti '0' di depan dengan '62'
    return '62' + cleaned.substring(1);
  }
  if (cleaned.startsWith('62')) {
    // Sudah dalam format yang benar
    return cleaned;
  }
  if (cleaned.length > 8 && cleaned.startsWith('8')) {
    // Diasumsikan nomor Indonesia tanpa '0' di depan
    return '62' + cleaned;
  }
  
  // Kembalikan nomor yang sudah dibersihkan jika tidak cocok dengan pola umum Indonesia
  return cleaned;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Authenticate the request (must be from a trusted source, like another function with service_role)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("Unauthorized: Missing or invalid Authorization header.");
    }
    
    // Create a Supabase client with the user's auth token to validate the user
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

    // 3. Create admin client for elevated privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Verify the caller is the sender of the message
    const { data: messageData, error: messageError } = await supabaseAdmin
      .from('messages')
      .select('sender_id')
      .eq('id', message_id)
      .single();

    if (messageError || !messageData) {
      throw new Error("Message not found or access denied.");
    }
    if (messageData.sender_id !== user.id) {
      throw new Error("Forbidden: You can only trigger notifications for messages you sent.");
    }
    const sender_id = user.id;
    const { data: senderProfile } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', sender_id).single();
    const sender_name = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || senderProfile.email;

    // 5. Get WBIZTOOL credentials
    const { data: wbizConfig, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);

    if (configError) throw configError;
    if (!wbizConfig || wbizConfig.length < 2) {
      console.warn("WBIZTOOL credentials not fully configured. Skipping WhatsApp notification.");
      return new Response(JSON.stringify({ message: "WBIZTOOL not configured." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const clientId = wbizConfig.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const apiKey = wbizConfig.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');

    if (!clientId || !apiKey || !whatsappClientId) {
      console.warn("WBIZTOOL credentials missing. Skipping WhatsApp notification.");
      return new Response(JSON.stringify({ message: "WBIZTOOL credentials missing." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 6. Get recipients and send messages
    const { data: recipients, error: recipientsError } = await supabaseAdmin
      .from('conversation_participants')
      .select('profiles (id, phone, first_name, email, notification_preferences)')
      .eq('conversation_id', conversation_id)
      .neq('user_id', sender_id);

    if (recipientsError) throw recipientsError;

    const sendPromises = recipients.map(async (recipient) => {
      const profile = recipient.profiles;
      const formattedPhone = formatPhoneNumberForApi(profile.phone);

      if (profile && formattedPhone && (profile.notification_preferences?.whatsapp_chat !== false)) {
        const message = `Hi ${profile.first_name || profile.email} 👋\nAda pesan baru di Chat Portal untuk kamu dari ${sender_name}.\n\nBuka di sini: https://7inked.ahensi.xyz/chat`;
        
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
            message: message,
          }),
        });
        if (!response.ok) {
          console.error(`Failed to send WA to ${profile.phone}: ${response.statusText}`);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, message: "Notifications triggered." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});