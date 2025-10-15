// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("[process-pending-notifications] Function invoked.");
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { data: pendingNotifications, error } = await supabaseAdmin
      .from('pending_whatsapp_notifications')
      .select('id')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .limit(10);

    if (error) throw error;
    
    console.log(`[process-pending-notifications] Found ${pendingNotifications?.length || 0} pending notifications.`);

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({ message: "No pending notifications to process." }), { headers: corsHeaders });
    }

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
            console.error(`[process-pending-notifications] Error processing notification ${notificationId}:`, reason);
        }
    });

    const responseMessage = `Processed ${results.length} notifications. Success: ${successCount}, Failures: ${failureCount}.`;
    console.log(`[process-pending-notifications] ${responseMessage}`);

    return new Response(JSON.stringify({
      message: responseMessage,
      success: successCount,
      failures: failureCount,
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('[process-pending-notifications] Cron handler error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});