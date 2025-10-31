// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRON_SECRET = Deno.env.get('CRON_SECRET');

serve(async (req) => {
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("[send-overdue-task-reminders] Job started. Fetching overdue tasks.");

    const today = new Date().toISOString();

    // Fetch overdue tasks with their project and assignees
    const { data: overdueTasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        project:projects (id, name, slug),
        assignees:task_assignees ( user:profiles (id, notification_preferences) )
      `)
      .lt('due_date', today)
      .eq('completed', false);

    if (tasksError) throw tasksError;

    if (!overdueTasks || overdueTasks.length === 0) {
      console.log("[send-overdue-task-reminders] No overdue tasks found.");
      return new Response(JSON.stringify({ message: "No overdue tasks to process." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[send-overdue-task-reminders] Found ${overdueTasks.length} overdue tasks.`);

    const notificationsToInsert = [];
    let skippedCount = 0;

    for (const task of overdueTasks) {
      const dueDate = new Date(task.due_date);
      const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

      for (const assignee of task.assignees) {
        const userProfile = assignee.user;
        if (!userProfile) continue;

        const prefs = userProfile.notification_preferences || {};
        const isEnabled = prefs.task_overdue !== false;

        if (isEnabled) {
          notificationsToInsert.push({
            recipient_id: userProfile.id,
            send_at: new Date(),
            notification_type: 'task_overdue',
            context_data: {
              task_id: task.id,
              task_title: task.title,
              project_id: task.project.id,
              project_name: task.project.name,
              project_slug: task.project.slug,
              days_overdue: daysOverdue,
            }
          });
        } else {
          skippedCount++;
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('pending_whatsapp_notifications')
        .insert(notificationsToInsert);
      
      if (insertError) {
        throw new Error(`Failed to insert notifications: ${insertError.message}`);
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