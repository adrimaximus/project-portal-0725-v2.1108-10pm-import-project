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
  conversationId,
  senderId,
  text,
  attachmentUrl,
  attachmentName,
  attachmentType,
  replyToMessageId,
}: {
  conversationId: string
  senderId: string
  text: string
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentType?: string | null
  replyToMessageId?: string | null
}) {
  const payload = {
    id: crypto.randomUUID(), // Add a temporary client-side ID
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
  // Hapus flag 'is_broadcast' sebelum menyimpan ke database
  const { is_broadcast, ...dbPayload } = payload;
  const { error } = await supabase.from('messages').insert(dbPayload);
  if (error) console.error('❌ Failed to insert message:', error)
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
    { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
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