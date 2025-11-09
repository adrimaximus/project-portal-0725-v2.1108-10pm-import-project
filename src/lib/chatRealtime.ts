import { createClient } from '@supabase/supabase-js'

// Ganti dengan env kamu
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})

// =============================
// 🔥 Hybrid Realtime Chat Engine
// =============================

/**
 * Kirim pesan dan broadcast secara realtime
 */
export async function sendHybridMessage({
  messageId,
  conversationId,
  senderId,
  text,
  attachmentUrl,
  attachmentName,
  attachmentType,
  replyToMessageId,
}: {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  replyToMessageId?: string | null;
}) {
  const payload = {
    id: messageId, // Use the passed-in ID for consistency
    content: text,
    attachment_url: attachmentUrl || null,
    attachment_name: attachmentName || null,
    attachment_type: attachmentType || null,
    conversation_id: conversationId,
    sender_id: senderId,
    reply_to_message_id: replyToMessageId,
    created_at: new Date().toISOString(),
    is_broadcast: true, // Flag to identify broadcast messages
  }

  // 1️⃣ Kirim broadcast supaya lawan bicara langsung terima
  const channel = supabase.channel(`conversation:${conversationId}`)
  channel.send({
    type: 'broadcast',
    event: 'message',
    payload,
  })

  // 2️⃣ Simpan ke database untuk persistensi & memicu update di list chat
  const { error } = await supabase.from('messages').insert({
    id: payload.id, // Use the same ID for consistency
    conversation_id: payload.conversation_id,
    sender_id: payload.sender_id,
    content: payload.content,
    attachment_url: payload.attachment_url,
    attachment_name: payload.attachment_name,
    attachment_type: payload.attachment_type,
    reply_to_message_id: payload.reply_to_message_id,
  })
  if (error) {
    console.error('❌ Failed to insert message:', error)
    throw error;
  }
}

/**
 * Listener hybrid: broadcast + database realtime
 */
export function subscribeToConversation({
  conversationId,
  onNewMessage,
}: {
  conversationId: string
  onNewMessage: (message: any) => void
}) {
  const channel = supabase.channel(`conversation:${conversationId}`)

  // 1️⃣ Broadcast cepat antar klien
  channel.on('broadcast', { event: 'message' }, ({ payload }) => {
    onNewMessage(payload)
  })

  // 2️⃣ Realtime DB untuk sync penuh (misal kalau reload)
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
    (payload) => {
      onNewMessage(payload.new)
    }
  )

  channel.subscribe((status) => {
    if (status !== 'SUBSCRIBED') {
      console.log('Supabase realtime status:', status)
    }
  })

  return () => {
    supabase.removeChannel(channel)
  }
}