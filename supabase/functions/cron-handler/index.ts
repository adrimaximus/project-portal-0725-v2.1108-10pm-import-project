import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the cron job request
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[cron-handler] Unauthorized cron request.');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    console.log('[cron-handler] Cron job authorized. Starting process.');

    // 2. Create an admin client to interact with the database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Fetch pending notifications
    const { data: pendingNotifications, error } = await supabaseAdmin
      .from('pending_whatsapp_notifications')
      .select('id')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .limit(10); // Process in batches of 10 to avoid timeouts

    if (error) throw error;

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('[cron-handler] No pending notifications to process.');
      return new Response(JSON.stringify({ message: "No pending notifications to process." }), { headers: corsHeaders });
    }

    console.log(`[cron-handler] Found ${pendingNotifications.length} pending notifications to process.`);

    // 4. Invoke the processing function for each notification
    const processingPromises = pendingNotifications.map(notification =>
      supabaseAdmin.functions.invoke('process-and-send-whatsapp-notification', {
        body: { pending_notification_id: notification.id },
      })
    );

    const results = await Promise.allSettled(processingPromises);

    const successCount = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
    const failureCount = results.length - successCount;

    results.forEach((result, index) => {
        if (result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error)) {
            const notificationId = pendingNotifications[index].id;
            const reason = result.status === 'rejected' ? result.reason : result.value.error;
            console.error(`[cron-handler] Error processing notification ${notificationId}:`, reason);
        }
    });

    const responseMessage = `Processed ${results.length} notifications. Success: ${successCount}, Failures: ${failureCount}.`;
    console.log(`[cron-handler] ${responseMessage}`);

    return new Response(JSON.stringify({
      message: responseMessage,
      success: successCount,
      failures: failureCount,
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('[cron-handler] Critical error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});