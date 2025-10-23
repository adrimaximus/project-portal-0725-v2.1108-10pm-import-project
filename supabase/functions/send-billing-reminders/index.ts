import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Use the SERVICE_ROLE_KEY for admin-level access
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // 1. Security Check: Ensure this is a trusted request (e.g., from pg_cron)
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('CRON_SECRET mismatch or Authorization header missing.');
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  try {
    // 2. Get all projects with unpaid invoices and a due date
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, payment_due_date, created_by')
      .neq('payment_status', 'Paid')
      .not('payment_due_date', 'is', null);

    if (projectsError) throw projectsError;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Use UTC for consistency

    let remindersSent = 0;

    for (const project of projects) {
      const dueDate = new Date(project.payment_due_date);
      dueDate.setUTCHours(0, 0, 0, 0); // Use UTC for consistency

      const timeDiff = today.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(timeDiff / (1000 * 3600 * 24));

      let reminderType: string | null = null;

      if (daysOverdue === 0) {
        reminderType = 'due_date';
      } else if (daysOverdue === 3) {
        reminderType = 'overdue_3_days';
      } else if (daysOverdue > 3 && (daysOverdue - 3) % 7 === 0) {
        reminderType = 'overdue_weekly';
      }

      if (reminderType) {
        // 3. Check if this specific reminder has already been sent for this number of days
        const { data: existingLog, error: logError } = await supabaseAdmin
          .from('billing_reminders_log')
          .select('id')
          .eq('project_id', project.id)
          .eq('days_overdue_at_sending', daysOverdue) 
          .limit(1)
          .single();

        if (logError && logError.code !== 'PGRST116') { // Ignore 'not found' error
            console.error(`Error checking log for project ${project.id}:`, logError.message);
            continue;
        }

        if (!existingLog) {
          // 4. Send notification if not already sent
          const recipientId = project.created_by;
          if (!recipientId) continue;

          // Check user's notification preferences
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('notification_preferences')
            .eq('id', recipientId)
            .single();

          if (profileError) {
            console.error(`Could not fetch profile for user ${recipientId}: ${profileError.message}`);
            continue;
          }

          const prefs = profile.notification_preferences || {};
          const prefSetting = prefs['billing_reminder'];
          
          // Check if enabled overall and if whatsapp channel is enabled
          const isBillingEnabled = (typeof prefSetting === 'object' && prefSetting !== null)
            ? prefSetting.enabled !== false && prefSetting.whatsapp !== false
            : prefSetting !== false;


          if (isBillingEnabled) {
             const { error: insertError } = await supabaseAdmin
                .from('pending_whatsapp_notifications')
                .insert({
                    recipient_id: recipientId,
                    send_at: new Date(),
                    notification_type: 'billing_reminder',
                    context_data: {
                        project_id: project.id,
                        project_name: project.name,
                        days_overdue: daysOverdue,
                    }
                });

             if (insertError) {
                console.error(`Failed to insert notification for project ${project.id}:`, insertError.message);
                continue;
             }

             const { error: logInsertError } = await supabaseAdmin
                .from('billing_reminders_log')
                .insert({
                    project_id: project.id,
                    reminder_type: reminderType,
                    days_overdue_at_sending: daysOverdue,
                });

             if (logInsertError) {
                console.error(`Failed to log reminder for project ${project.id}:`, logInsertError.message);
             } else {
                remindersSent++;
             }
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: `Billing reminders processed. ${remindersSent} reminders sent.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing billing reminders:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});