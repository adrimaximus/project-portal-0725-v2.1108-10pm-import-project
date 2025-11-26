// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRON_SECRET = Deno.env.get('CRON_SECRET');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userAgent = req.headers.get('user-agent');
    const cronHeader = req.headers.get('X-Cron-Secret');
    const isCron = userAgent?.startsWith('pg_net');
    const isAuthorized = cronHeader && cronHeader === CRON_SECRET;

    if (!isCron && !isAuthorized) {
      console.error('Unauthorized cron attempt:', { userAgent, hasCronHeader: !!cronHeader });
      throw new Error('Unauthorized');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { 'Accept': 'application/json' } } }
    );

    console.log("[send-overdue-task-reminders] Job started. Fetching overdue tasks via RPC.");

    const { data: overdueTasks, error: rpcError } = await supabaseAdmin
      .rpc('get_overdue_tasks_for_reminders');

    if (rpcError) throw rpcError;

    if (!overdueTasks || overdueTasks.length === 0) {
      console.log("[send-overdue-task-reminders] No overdue tasks found.");
      return new Response(JSON.stringify({ message: "No overdue tasks to process." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[send-overdue-task-reminders] Found ${overdueTasks.length} overdue task assignments.`);

    const notificationsToInsert = [];
    let skippedCount = 0;

    for (const task of overdueTasks) {
      const prefs = task.assignee_prefs || {};
      
      // Check if 'task_overdue' main toggle is enabled (defaults to true)
      const isEnabled = (typeof prefs.task_overdue === 'object' && prefs.task_overdue !== null) 
          ? prefs.task_overdue.enabled !== false 
          : prefs.task_overdue !== false;

      if (isEnabled) {
        const dueDate = new Date(task.due_date);
        const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        
        const debounceKey = `task_overdue:${task.task_id}:${daysOverdue}`; // Include days to allow re-sending daily if strictly needed, or remove for once-per-task.
        // Better debounce: Just task ID + type. Re-sending logic should be handled by a log table ideally, 
        // but here we rely on 'pending_notifications' unique constraint (recipient, type, debounce_key).
        // We'll use task_id and date to allow one reminder per day.
        const dailyDebounceKey = `task_overdue:${task.task_id}:${new Date().toISOString().split('T')[0]}`;

        const contextData = {
            task_id: task.task_id,
            task_title: task.task_title,
            project_id: task.project_id,
            project_name: task.project_name,
            project_slug: task.project_slug,
            days_overdue: daysOverdue,
            debounce_key: dailyDebounceKey,
        };

        const taskOverduePrefs = (typeof prefs.task_overdue === 'object' && prefs.task_overdue !== null) ? prefs.task_overdue : {};

        // 1. Queue WhatsApp Notification
        if (taskOverduePrefs.whatsapp !== false) {
            notificationsToInsert.push({
              recipient_id: task.assignee_id,
              send_at: new Date(),
              notification_type: 'task_overdue', // Base type for WA
              context_data: contextData,
              debounce_key: dailyDebounceKey,
            });
        }

        // 2. Queue Email Notification
        if (taskOverduePrefs.email !== false) {
            notificationsToInsert.push({
              recipient_id: task.assignee_id,
              send_at: new Date(),
              notification_type: 'task_overdue_email', // Email type
              context_data: contextData,
              debounce_key: dailyDebounceKey,
            });
        }

      } else {
        skippedCount++;
      }
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('pending_notifications')
        .insert(notificationsToInsert);
      
      if (insertError) {
        // The unique index will cause an error if there's a conflict. We can ignore duplicate key violations.
        if (insertError.code !== '23505') { 
          console.error("Error inserting task reminders:", insertError);
          throw new Error(`Failed to insert notifications: ${insertError.message}`);
        } else {
          console.log("Some task reminders were skipped due to duplicates (already queued for today).");
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed_tasks: overdueTasks.length, 
      notifications_created: notificationsToInsert.length,
      skipped_notifications: skippedCount,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[send-overdue-task-reminders] Top-level function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});