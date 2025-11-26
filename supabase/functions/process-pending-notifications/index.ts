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
        case 'goal_progress_update':
             return `Goal Progress: *${context.goal_title}*\n\n${context.updater_name} logged value: ${context.value_logged}.\n\nView goal: ${siteUrl}/goals/${context.goal_slug}`;
        default:
            return `You have a new notification from 7i Portal.`;
    }
};

const constructEmailContent = (type: string, context: any) => {
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz";
    const projectLink = context.project_slug ? `${siteUrl}/projects/${context.project_slug}` : siteUrl;
    // Clean type is removed here because we want to handle the raw type logic in the main loop
    const baseType = type.replace('_email', '');

    let subject = "New Notification";
    let htmlBody = "";

    switch (baseType) {
        case 'discussion_mention':
            subject = `You were mentioned in ${context.project_name}`;
            htmlBody = `<p><strong>${context.mentioner_name}</strong> mentioned you in a comment:</p>
                        <blockquote style="border-left: 4px solid #eee; padding-left: 10px; margin: 10px 0;">${context.comment_text}</blockquote>
                        <p><a href="${projectLink}">View in Project</a></p>`;
            break;
        case 'task_assignment':
            subject = `New Task Assigned: ${context.task_title}`;
            htmlBody = `<p><strong>${context.assigner_name}</strong> assigned you a new task in <strong>${context.project_name}</strong>.</p>
                        <p>Task: ${context.task_title}</p>
                        <p><a href="${projectLink}">View Task</a></p>`;
            break;
        case 'project_invite':
            subject = `Invitation to Project: ${context.project_name}`;
            htmlBody = `<p><strong>${context.inviter_name}</strong> invited you to join the project <strong>${context.project_name}</strong>.</p>
                        <p><a href="${projectLink}">Open Project</a></p>`;
            break;
        case 'billing_reminder':
            subject = `Overdue Invoice: ${context.project_name}`;
            htmlBody = `<p>This is a reminder that the invoice for <strong>${context.project_name}</strong> is overdue by ${context.days_overdue} days.</p>
                        <p>Please follow up immediately.</p>`;
            break;
        default:
            subject = "New Notification from 7i Portal";
            htmlBody = `<p>You have a new notification. Please check the app for details.</p>`;
    }
    
    return { subject, htmlBody };
};

const sendEmail = async (supabaseAdmin, to, subject, html) => {
    // Fetch API Key
    const { data: config } = await supabaseAdmin
        .from('app_config')
        .select('value')
        .eq('key', 'EMAILIT_API_KEY')
        .maybeSingle();

    if (!config?.value) {
        throw new Error("Emailit API key not configured.");
    }

    const emailFrom = Deno.env.get("EMAIL_FROM") ?? "7i Portal <no-reply@mail.ahensi.com>";
    
    const response = await fetch("https://api.emailit.com/v1/emails", {
        method: "POST",
        headers: { 
            "Authorization": `Bearer ${config.value}`, 
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({
            from: emailFrom,
            to,
            subject,
            html,
        }),
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Emailit Error: ${txt}`);
    }
    return true;
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
    
    // Sanitize credentials
    const metaPhoneId = config?.find(c => c.key === 'META_PHONE_ID')?.value?.trim();
    const metaAccessToken = config?.find(c => c.key === 'META_ACCESS_TOKEN')?.value?.trim();
    const wbizClientId = config?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value?.trim();
    const wbizApiKey = config?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value?.trim();
    const wbizWhatsappClientId = config?.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value?.trim();

    const useMeta = !!(metaPhoneId && metaAccessToken);
    const useWbiz = !!(wbizClientId && wbizApiKey && wbizWhatsappClientId);

    // 2. Fetch pending notifications
    const { data: notifications, error: popError } = await supabaseAdmin.rpc('pop_pending_notifications', { p_limit: 10 });

    if (popError) throw popError;
    if (!notifications || notifications.length === 0) {
        return new Response(JSON.stringify({ message: 'No pending notifications' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = [];

    // 3. Process each notification
    for (const notification of notifications) {
        try {
            // --- EMAIL HANDLING ---
            if (notification.notification_type.endsWith('_email')) {
                const { data: recipient } = await supabaseAdmin.from('profiles').select('email').eq('id', notification.recipient_id).single();
                
                if (!recipient?.email) {
                    await supabaseAdmin.from('pending_notifications').update({ status: 'failed', error_message: 'No email address linked to profile' }).eq('id', notification.id);
                    continue;
                }

                const { subject, htmlBody } = constructEmailContent(notification.notification_type, notification.context_data);
                
                try {
                    await sendEmail(supabaseAdmin, recipient.email, subject, htmlBody);
                    await supabaseAdmin.from('pending_notifications').update({ status: 'completed', processed_at: new Date() }).eq('id', notification.id);
                    results.push({ id: notification.id, status: 'sent_email' });
                } catch (e) {
                    console.error(`Email send failed: ${e.message}`);
                    await supabaseAdmin.from('pending_notifications').update({ 
                        status: 'failed', 
                        error_message: e.message,
                        retry_count: notification.retry_count + 1 
                    }).eq('id', notification.id);
                    results.push({ id: notification.id, status: 'failed_email', error: e.message });
                }
                continue; // Ensure we don't process as WhatsApp
            }

            // --- WHATSAPP HANDLING ---
            if (!useMeta && !useWbiz) {
                await supabaseAdmin.from('pending_notifications').update({ 
                    status: 'failed', 
                    error_message: 'No WhatsApp provider configured',
                }).eq('id', notification.id);
                results.push({ id: notification.id, status: 'failed', error: 'No provider' });
                continue;
            }

            // Get recipient phone
            const { data: recipient } = await supabaseAdmin.from('profiles').select('phone').eq('id', notification.recipient_id).single();
            
            if (!recipient?.phone) {
                await supabaseAdmin.from('pending_notifications').update({ status: 'failed', error_message: 'No phone number linked to profile' }).eq('id', notification.id);
                continue;
            }

            const formattedPhone = formatPhoneNumberForApi(recipient.phone);
            if (!formattedPhone) {
                await supabaseAdmin.from('pending_notifications').update({ status: 'failed', error_message: `Invalid phone number format: ${recipient.phone}` }).eq('id', notification.id);
                continue;
            }

            const messageText = constructMessage(notification.notification_type, notification.context_data);
            
            let sent = false;
            let lastError = '';

            // --- STRATEGY: Try Meta First ---
            if (useMeta) {
                try {
                    const response = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${metaAccessToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messaging_product: "whatsapp",
                            to: formattedPhone,
                            type: "text",
                            text: { body: messageText }
                        }),
                    });

                    const respData = await response.json();

                    if (response.ok) {
                        sent = true;
                    } else {
                        const errorMsg = respData.error?.message || JSON.stringify(respData);
                        lastError = `Meta Failed: ${errorMsg}`;
                        console.warn(`Meta send failed for ${formattedPhone}: ${errorMsg}`);
                    }
                } catch (e) {
                    lastError = `Meta Exception: ${e.message}`;
                    console.warn(`Meta exception for ${formattedPhone}:`, e);
                }
            }

            // --- FALLBACK: Try WBIZTOOL if Meta Failed or Not Configured ---
            if (!sent && useWbiz) {
                try {
                    console.log(`Trying WBIZTOOL fallback for ${formattedPhone}...`);
                    // REMOVED trailing slash
                    const response = await fetch('https://wbiztool.com/api/v1/send_msg', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Client-ID': wbizClientId, 'X-Api-Key': wbizApiKey },
                        body: JSON.stringify({ client_id: wbizClientId, api_key: wbizApiKey, whatsapp_client: wbizWhatsappClientId, phone: formattedPhone, message: messageText }),
                    });

                    if (response.ok) {
                        sent = true;
                    } else {
                        const errorText = await response.text();
                        lastError += ` | WBIZTOOL Failed: ${errorText.substring(0, 100)}`;
                    }
                } catch (e) {
                    lastError += ` | WBIZTOOL Exception: ${e.message}`;
                }
            } else if (!sent && !useWbiz) {
                lastError += " | WBIZTOOL not configured for fallback";
            }

            if (sent) {
                await supabaseAdmin.from('pending_notifications').update({ status: 'completed', processed_at: new Date() }).eq('id', notification.id);
                results.push({ id: notification.id, status: 'sent' });
            } else {
                console.error(`All providers failed for notification ${notification.id}: ${lastError}`);
                await supabaseAdmin.from('pending_notifications').update({ 
                    status: 'failed', 
                    error_message: lastError || 'Unknown error',
                    retry_count: notification.retry_count + 1 
                }).eq('id', notification.id);
                results.push({ id: notification.id, status: 'failed', error: lastError });
            }

        } catch (e) {
            console.error(`Exception processing notification ${notification.id}:`, e);
            await supabaseAdmin.from('pending_notifications').update({ 
                status: 'failed', 
                error_message: `Critical Error: ${e.message}`,
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