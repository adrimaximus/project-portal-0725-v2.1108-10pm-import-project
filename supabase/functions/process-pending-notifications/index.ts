// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const formatPhoneNumberForApi = (phone: string): string | null => {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '62' + cleaned.substring(1);
    if (cleaned.startsWith('62')) return cleaned;
    if (cleaned.length > 8 && cleaned.startsWith('8')) return '62' + cleaned;
    return null;
};

const constructMessage = (type: string, context: any): string => {
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz";
    const projectLink = context.project_slug ? `${siteUrl}/projects/${context.project_slug}` : siteUrl;
    
    switch (type) {
        case 'discussion_mention':
            return `You were mentioned by *${context.mentioner_name}* in *${context.project_name}*:\n\n"${context.comment_text}"\n\nView here: ${projectLink}`;
        case 'task_assignment':
            return `You have been assigned a new task in *${context.project_name}*:\n\n*${context.task_title}*\n\nAssigned by: ${context.assigner_name}\nView here: ${projectLink}`;
        case 'project_invite':
            return `You have been invited to join the project *${context.project_name}* by ${context.inviter_name}.\n\nCheck it out: ${projectLink}`;
        case 'kb_invite':
            return `You have been invited to collaborate on the Knowledge Base folder *${context.folder_name}* by ${context.inviter_name}.`;
        case 'goal_invite':
            return `You have been invited to collaborate on the goal *${context.goal_title}* by ${context.inviter_name}.`;
        case 'payment_status_updated':
            return `Payment status updated for *${context.project_name}*.\n\nNew Status: *${context.new_status}*\nUpdated by: ${context.updater_name}\n\nView project: ${projectLink}`;
        case 'project_status_updated':
            return `Project status updated for *${context.project_name}*.\n\n*${context.old_status}* ➔ *${context.new_status}*\nUpdated by: ${context.updater_name}\n\nView project: ${projectLink}`;
        case 'billing_reminder':
             return `Billing Reminder for *${context.project_name}*.\n\nThe invoice is overdue by ${context.days_overdue} days. Please follow up.`;
        case 'task_overdue':
             return `Task Overdue: *${context.task_title}* in *${context.project_name}*.\n\nPlease check your tasks.`;
        default:
            return `You have a new notification from 7i Portal.`;
    }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get Config (Meta & WBIZTOOL)
    const { data: config } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID', 'META_PHONE_ID', 'META_ACCESS_TOKEN']);
    
    const metaPhoneId = config?.find(c => c.key === 'META_PHONE_ID')?.value;
    const metaAccessToken = config?.find(c => c.key === 'META_ACCESS_TOKEN')?.value;
    const wbizClientId = config?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const wbizApiKey = config?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const wbizWhatsappClientId = config?.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value;

    const useMeta = !!(metaPhoneId && metaAccessToken);
    const useWbiz = !!(wbizClientId && wbizApiKey && wbizWhatsappClientId);

    if (!useMeta && !useWbiz) {
        console.log("No WhatsApp provider configured. Skipping notification processing.");
        return new Response(JSON.stringify({ message: 'No provider configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Fetch pending notifications
    // We call the SQL function `pop_pending_notifications` to atomically get and lock rows
    const { data: notifications, error: popError } = await supabaseAdmin.rpc('pop_pending_notifications', { p_limit: 10 });

    if (popError) throw popError;
    if (!notifications || notifications.length === 0) {
        return new Response(JSON.stringify({ message: 'No pending notifications' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = [];

    // 3. Process each notification
    for (const notification of notifications) {
        try {
            // Check if it's an email type (suffixed with _email)
            if (notification.notification_type.endsWith('_email')) {
                // Email logic skipped for now, mark as processed or implement Emailit later
                // For now we just mark as success to clear queue
                await supabaseAdmin.from('pending_notifications').update({ status: 'completed', sent_at: new Date() }).eq('id', notification.id);
                continue;
            }

            // Get recipient phone
            const { data: recipient } = await supabaseAdmin.from('profiles').select('phone').eq('id', notification.recipient_id).single();
            
            if (!recipient?.phone) {
                await supabaseAdmin.from('pending_notifications').update({ status: 'failed', error_message: 'No phone number' }).eq('id', notification.id);
                continue;
            }

            const formattedPhone = formatPhoneNumberForApi(recipient.phone);
            if (!formattedPhone) {
                await supabaseAdmin.from('pending_notifications').update({ status: 'failed', error_message: 'Invalid phone number' }).eq('id', notification.id);
                continue;
            }

            const messageText = constructMessage(notification.notification_type, notification.context_data);

            let response;
            if (useMeta) {
                // Send via Meta
                response = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${metaAccessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: formattedPhone,
                        type: "text",
                        text: { body: messageText }
                    }),
                });
            } else {
                // Send via WBIZTOOL
                response = await fetch('https://wbiztool.com/api/v1/send_msg/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Client-ID': wbizClientId, 'X-Api-Key': wbizApiKey },
                    body: JSON.stringify({ client_id: wbizClientId, api_key: wbizApiKey, whatsapp_client: wbizWhatsappClientId, phone: formattedPhone, message: messageText }),
                });
            }

            if (response.ok) {
                await supabaseAdmin.from('pending_notifications').update({ status: 'completed', sent_at: new Date() }).eq('id', notification.id);
                results.push({ id: notification.id, status: 'sent' });
            } else {
                const errData = await response.text();
                console.error(`Failed to send notification ${notification.id}:`, errData);
                await supabaseAdmin.from('pending_notifications').update({ 
                    status: 'failed', 
                    error_message: `Provider Error: ${errData.substring(0, 200)}`,
                    retry_count: notification.retry_count + 1 
                }).eq('id', notification.id);
                results.push({ id: notification.id, status: 'failed' });
            }

        } catch (e) {
            console.error(`Exception processing notification ${notification.id}:`, e);
            await supabaseAdmin.from('pending_notifications').update({ 
                status: 'failed', 
                error_message: e.message,
                retry_count: notification.retry_count + 1 
            }).eq('id', notification.id);
        }
    }

    return new Response(JSON.stringify({ processed: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})