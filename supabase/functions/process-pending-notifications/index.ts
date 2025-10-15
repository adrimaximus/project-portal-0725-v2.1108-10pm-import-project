// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { data: pendingNotifications, error } = await supabaseAdmin
      .from('pending_whatsapp_notifications')
      .select('id')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .limit(10);

    if (error) throw error;
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

    results.forEach(result => {
        if (result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error)) {
            console.error("Error processing notification:", result.status === 'rejected' ? result.reason : result.value.error);
        }
    });

    return new Response(JSON.stringify({
      message: `Processed ${results.length} notifications.`,
      success: successCount,
      failures: failureCount,
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('Cron handler error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});