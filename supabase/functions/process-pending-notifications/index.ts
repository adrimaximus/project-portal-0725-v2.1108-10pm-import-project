// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';
import Anthropic from 'npm:@anthropic-ai/sdk@0.22.0';

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

const getSystemPrompt = () => `Anda adalah asisten notifikasi yang ramah dan suportif. Tugas Anda adalah membuat pesan notifikasi WhatsApp yang singkat, natural, dan positif, mengikuti format yang diberikan dalam contoh.

**Aturan Penting:**
1.  **Gunakan Variasi Kalimat:** Jangan pernah menggunakan kalimat yang sama persis berulang kali.
2.  **Sertakan Emoji:** Tambahkan satu emoji yang relevan dan sopan di akhir pesan untuk memberikan sentuhan visual.
3.  **Sentuhan Personal Positif:** Di akhir pesan, sertakan satu kalimat positif yang ringan dan relevan.
4.  **Jaga Profesionalisme:** Pastikan nada tetap profesional namun ramah.
5.  **Format:** Gunakan format tebal WhatsApp (*kata*) untuk nama orang, nama proyek, nama tugas, dll.
6.  **Konteks Pesan:** Jika isi pesan/komentar disediakan, kutip sebagian kecil saja (misalnya, 5-7 kata pertama) menggunakan format miring (_"kutipan..."_). Jangan kutip seluruh pesan.
7.  **Singkat:** Jaga agar keseluruhan pesan notifikasi tetap singkat dan langsung ke intinya.
8.  **Sertakan URL:** Jika URL disediakan dalam konteks, Anda HARUS menyertakannya secara alami di akhir pesan.`;

const getFullName = (profile: any) => `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;

const getContext = async (supabaseAdmin: any, notification: any) => {
    const { notification_type, context_data } = notification;
    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz";
    let context: any = { type: notification_type };

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', userId).single();
        if (error) throw new Error(`Failed to fetch profile for user ${userId}: ${error.message}`);
        return { ...data, name: getFullName(data) };
    };

    switch (notification_type) {
        case 'task_completed': {
            const [completer, task, project] = await Promise.all([
                fetchProfile(context_data.completer_id),
                supabaseAdmin.from('tasks').select('title, project_id').eq('id', context_data.task_id).single(),
                supabaseAdmin.from('projects').select('name, slug').eq('id', context_data.project_id).single(),
            ]);
            context = { ...context, completerName: completer.name, taskTitle: task.data.title, projectName: project.data.name, url: `${SITE_URL}/projects/${project.data.slug}` };
            break;
        }
        case 'project_status_updated': {
            const [updater, project] = await Promise.all([
                fetchProfile(context_data.updater_id),
                supabaseAdmin.from('projects').select('name, slug').eq('id', context_data.project_id).single(),
            ]);
            context = { ...context, updaterName: updater.name, projectName: project.data.name, oldStatus: context_data.old_status, newStatus: context_data.new_status, url: `${SITE_URL}/projects/${project.data.slug}` };
            break;
        }
        case 'goal_progress_update': {
            const [updater, goal] = await Promise.all([
                fetchProfile(context_data.updater_id),
                supabaseAdmin.from('goals').select('title, slug, unit').eq('id', context_data.goal_id).single(),
            ]);
            context = { ...context, updaterName: updater.name, goalTitle: goal.data.title, valueLogged: context_data.value_logged, unit: goal.data.unit, url: `${SITE_URL}/goals/${goal.data.slug}` };
            break;
        }
        case 'new_chat_message': {
            const [sender, conversation] = await Promise.all([
                fetchProfile(context_data.sender_id),
                supabaseAdmin.from('conversations').select('is_group, group_name').eq('id', notification.conversation_id).single(),
            ]);
            const { data: unreadMessages, error: msgError } = await supabaseAdmin
                .from('messages')
                .select('content')
                .eq('conversation_id', notification.conversation_id)
                .eq('sender_id', context_data.sender_id)
                .gt('created_at', notification.created_at)
                .order('created_at', { ascending: true });
            if (msgError) throw msgError;

            context = { ...context, senderName: sender.name, isGroup: conversation.data.is_group, groupName: conversation.data.group_name, messages: unreadMessages.map(m => m.content), url: `${SITE_URL}/chat` };
            break;
        }
        case 'discussion_mention': {
            const [mentioner, project, comment] = await Promise.all([
                fetchProfile(context_data.mentioner_id),
                supabaseAdmin.from('projects').select('name, slug').eq('id', context_data.project_id).single(),
                supabaseAdmin.from('comments').select('text').eq('id', context_data.comment_id).single(),
            ]);
            context = { ...context, mentionerName: mentioner.name, projectName: project.data.name, commentText: comment.data.text, url: `${SITE_URL}/projects/${project.data.slug}` };
            break;
        }
        case 'task_assignment': {
            const { data: task, error: taskError } = await supabaseAdmin.from('tasks').select('title, project_id').eq('id', context_data.task_id).single();
            if (taskError) throw taskError;
            if (!task.data) throw new Error(`Task with ID ${context_data.task_id} not found.`);

            const [assigner, project] = await Promise.all([
                fetchProfile(context_data.assigner_id),
                supabaseAdmin.from('projects').select('name, slug').eq('id', task.data.project_id).single(),
            ]);
            if (!project.data) throw new Error(`Project with ID ${task.data.project_id} not found.`);

            context = { ...context, assignerName: assigner.name, taskTitle: task.data.title, projectName: project.data.name, url: `${SITE_URL}/projects/${project.data.slug}` };
            break;
        }
        case 'project_invite':
        case 'goal_invite':
        case 'kb_invite': {
            const [inviter, resource] = await Promise.all([
                fetchProfile(context_data.inviter_id),
                notification_type === 'project_invite' ? supabaseAdmin.from('projects').select('name, slug').eq('id', context_data.project_id).single() :
                notification_type === 'goal_invite' ? supabaseAdmin.from('goals').select('title, slug').eq('id', context_data.goal_id).single() :
                supabaseAdmin.from('kb_folders').select('name, slug').eq('id', context_data.folder_id).single(),
            ]);
            const resourceName = resource.data.name || resource.data.title;
            const resourceType = notification_type.split('_')[0];
            const urlPath = resourceType === 'kb' ? 'knowledge-base/folders' : `${resourceType}s`;
            context = { ...context, inviterName: inviter.name, resourceName, resourceType, url: `${SITE_URL}/${urlPath}/${resource.data.slug}` };
            break;
        }
        default:
            context = { ...context, details: context_data };
            break;
    }
    return context;
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
    console.log("[process-pending-notifications] Job started. Fetching pending notifications.");
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
    let successCount = 0, failureCount = 0, cancelledCount = 0;

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
        const notificationTypeKey = notification.notification_type?.replace(/_updated$/, '_update') || 'system';
        const typePrefs = prefs[notificationTypeKey] || {};

        const isWhatsappEnabled = typePrefs.whatsapp !== false;
        
        if (!isWhatsappEnabled) {
            await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'cancelled', error_message: 'WhatsApp notifications for this type are disabled by the user.' }).eq('id', notificationId);
            cancelledCount++;
            continue;
        }

        const recipientPhone = formatPhoneNumberForApi(recipientData.phone);
        if (!recipientPhone) {
            await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'failed', error_message: 'Recipient does not have a valid phone number.' }).eq('id', notificationId);
            failureCount++;
            continue;
        }

        const context = await getContext(supabaseAdmin, notification);
        const recipientName = getFullName(recipientData);

        const userPrompt = `**Konteks:**\n- **Jenis:** Notifikasi ${notification.notification_type}\n- **Penerima:** ${recipientName}\n- **Detail:** ${JSON.stringify(context)}\n\nBuat pesan notifikasi WhatsApp yang sesuai.`;
        const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
        const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 250, system: getSystemPrompt(), messages: [{ role: "user", content: userPrompt }] });
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
        
        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'sent' }).eq('id', notificationId);
        successCount++;
        console.log(`[process-and-send] [${notificationId}] Sent notification to ${recipientData.email}.`);

      } catch (innerError) {
        failureCount++;
        console.error(`[process-and-send] [${notificationId}] Error processing notification:`, innerError.message);
        await supabaseAdmin.from('pending_whatsapp_notifications').update({ status: 'failed', error_message: innerError.message, retry_count: (notification.retry_count || 0) + 1 }).eq('id', notificationId);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: pendingNotifications.length, successes: successCount, failures: failureCount, cancelled: cancelledCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[process-pending-notifications] Top-level function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});