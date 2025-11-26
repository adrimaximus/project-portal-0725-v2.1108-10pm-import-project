// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.22.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const formatMentions = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
};

const getSystemPrompt = () => `Anda adalah asisten keuangan yang profesional, sopan, dan proaktif. Tugas Anda adalah membuat pesan pengingat WhatsApp tentang invoice yang telah jatuh tempo.

**Aturan Penting:**
1.  **Nada Berdasarkan Urgensi:** Sesuaikan nada pesan Anda berdasarkan jumlah hari keterlambatan yang diberikan dalam konteks.
    *   **Sedikit Mendesak (1-7 hari):** Gunakan bahasa yang ramah dan bersifat pengingat lembut.
    *   **Cukup Mendesak (8-30 hari):** Gunakan bahasa yang lebih tegas namun tetap sopan, menekankan perlunya perhatian.
    *   **Sangat Mendesak (>30 hari):** Gunakan bahasa yang jelas dan lugas, mendesak untuk segera ditindaklanjuti dan diselesaikan, sambil tetap menjaga profesionalisme.
2.  **Sertakan Semua Detail:** Pastikan pesan Anda mencakup nama proyek, nomor invoice, dan jumlah hari keterlambatan.
3.  **Format:** Gunakan format tebal WhatsApp (*kata*) untuk detail penting seperti nama proyek dan jumlah hari.
4.  **Profesional dan Sopan:** Jaga agar bahasa tetap sopan dan profesional dalam segala situasi.
5.  **Singkat dan Jelas:** Buat pesan yang langsung ke intinya.
6.  **Sertakan URL:** Selalu sertakan URL yang diberikan di akhir pesan. Ini adalah satu-satunya URL yang harus ada di pesan. Jangan menambah teks lain setelah URL.
7.  **Variasi:** Jangan gunakan kalimat yang sama persis setiap saat.`;

const getFullName = (profile: any) => `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userAgent = req.headers.get('user-agent');
    const cronHeader = req.headers.get('X-Cron-Secret');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (userAgent !== 'pg_net/0.19.5' && cronHeader !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { 'Accept': 'application/json' } } }
    );

    console.log("[send-overdue-reminders] Job started. Fetching overdue invoices.");

    const { data: overdueProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, slug, invoice_number, payment_due_date, created_by, payment_status')
      .in('payment_status', ['Proposed', 'Overdue', 'Pending', 'In Process'])
      .not('payment_due_date', 'is', null);

    if (projectsError) throw projectsError;

    if (!overdueProjects || overdueProjects.length === 0) {
      console.log("[send-overdue-reminders] No relevant invoices found.");
      return new Response(JSON.stringify({ message: "No relevant invoices to process." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log(`[send-overdue-reminders] Found ${overdueProjects.length} invoices to check.`);

    const projectIds = overdueProjects.map(p => p.id);

    const { data: projectAdmins, error: adminsError } = await supabaseAdmin
      .from('project_members')
      .select('project_id, user_id')
      .in('project_id', projectIds)
      .eq('role', 'admin');

    if (adminsError) throw adminsError;

    const userIdsToFetch = new Set<string>();
    overdueProjects.forEach(p => userIdsToFetch.add(p.created_by));
    projectAdmins.forEach(m => userIdsToFetch.add(m.user_id));

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email, phone, notification_preferences')
      .in('id', Array.from(userIdsToFetch));

    if (profilesError) throw profilesError;
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (const project of overdueProjects) {
      const recipients = new Set<string>();
      recipients.add(project.created_by);
      projectAdmins
        .filter(m => m.project_id === project.id)
        .forEach(m => recipients.add(m.user_id));

      const dueDate = new Date(project.payment_due_date);
      const today = new Date();
      // Calculate overdue days. Positive means overdue.
      const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

      // Logic for "when to send"
      let reminderType: string | null = null;
      if (overdueDays === 0) reminderType = 'due_date';
      else if (overdueDays === 3) reminderType = 'overdue_3_days';
      else if (overdueDays > 3 && (overdueDays - 3) % 7 === 0) reminderType = 'overdue_weekly';

      // Skip if not a designated reminder day or if it's not actually overdue/due
      if (!reminderType || overdueDays < 0) continue;

      // Check if we already sent this specific reminder type for this project
      const { data: existingLog } = await supabaseAdmin
        .from('billing_reminders_log')
        .select('id')
        .eq('project_id', project.id)
        .eq('reminder_type', reminderType)
        .eq('days_overdue_at_sending', overdueDays) // Strict check to allow retries on different days if needed
        .limit(1).maybeSingle();

      if (existingLog) {
          continue;
      }

      for (const userId of recipients) {
        const profile = profileMap.get(userId);
        if (!profile) continue;

        const prefs = profile.notification_preferences || {};
        const billingPrefs = prefs['billing_reminder'];
        
        const isFeatureEnabled = (typeof billingPrefs === 'object' && billingPrefs !== null) 
            ? billingPrefs.enabled !== false 
            : billingPrefs !== false;
        
        const statusesToNotify = (typeof billingPrefs === 'object' && billingPrefs?.statuses) 
            ? billingPrefs.statuses 
            : ['Overdue'];

        if (isFeatureEnabled && statusesToNotify.includes(project.payment_status)) {
            const notificationsToQueue = [];
            const contextData = {
                project_id: project.id,
                project_name: project.name,
                project_slug: project.slug, // Added slug for links
                days_overdue: overdueDays,
            };

            // 1. Check WhatsApp
            const isWaEnabled = (typeof billingPrefs === 'object' && billingPrefs !== null) 
                ? billingPrefs.whatsapp !== false 
                : true;
            
            if (isWaEnabled && profile.phone) {
                 notificationsToQueue.push({
                    recipient_id: userId,
                    send_at: new Date(),
                    notification_type: 'billing_reminder',
                    context_data: contextData
                 });
            }

            // 2. Check Email
            const isEmailEnabled = (typeof billingPrefs === 'object' && billingPrefs !== null) 
                ? billingPrefs.email !== false 
                : true;

            if (isEmailEnabled && profile.email) {
                 notificationsToQueue.push({
                    recipient_id: userId,
                    send_at: new Date(),
                    notification_type: 'billing_reminder_email',
                    context_data: contextData
                 });
            }

            if (notificationsToQueue.length > 0) {
                const { error: insertError } = await supabaseAdmin.from('pending_notifications').insert(notificationsToQueue);
                if (insertError) {
                    console.error(`Failed to queue notifications for user ${userId}:`, insertError.message);
                    failureCount++;
                } else {
                    successCount += notificationsToQueue.length;
                }
            } else {
                skippedCount++;
            }
        } else {
            skippedCount++;
        }
      }

      // Log the reminder attempt for the project so we don't spam
      // Only log if we attempted to send to at least one person (or would have if they had enabled it)
      // We log it even if skipped to prevent re-processing the same project for the same condition repeatedly today
      const { error: logInsertError } = await supabaseAdmin
          .from('billing_reminders_log')
          .insert({ 
              project_id: project.id, 
              reminder_type: reminderType, 
              days_overdue_at_sending: overdueDays 
          });
      
      if (logInsertError) console.error(`Failed to log reminder for project ${project.id}:`, logInsertError.message);
    }

    return new Response(JSON.stringify({ 
        success: true, 
        processed_invoices: overdueProjects.length, 
        queued_notifications: successCount, 
        skipped_notifications: skippedCount, 
        failed_queues: failureCount 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[send-overdue-reminders] Top-level function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});