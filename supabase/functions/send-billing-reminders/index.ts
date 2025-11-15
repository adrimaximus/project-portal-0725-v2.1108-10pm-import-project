// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.22.0';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
6.  **Sertakan URL:** Selalu sertakan URL yang diberikan di akhir pesan.
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

    console.log("[send-overdue-reminders] Job started. Fetching projects.");

    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, slug, invoice_number, payment_due_date, payment_status, created_by')
      .in('payment_status', ['Proposed', 'Overdue', 'Pending', 'In Process'])
      .not('payment_due_date', 'is', null);

    if (projectsError) throw projectsError;

    if (!projects || projects.length === 0) {
      console.log("[send-overdue-reminders] No relevant invoices found.");
      return new Response(JSON.stringify({ message: "No relevant invoices to process." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log(`[send-overdue-reminders] Found ${projects.length} relevant invoices.`);

    const projectIds = projects.map(p => p.id);
    const { data: projectAdmins, error: adminsError } = await supabaseAdmin
      .from('project_members')
      .select('project_id, user_id')
      .in('project_id', projectIds)
      .eq('role', 'admin');
    if (adminsError) throw adminsError;

    const userIdsToFetch = new Set<string>();
    projects.forEach(p => userIdsToFetch.add(p.created_by));
    projectAdmins.forEach(m => userIdsToFetch.add(m.user_id));

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email, phone, notification_preferences')
      .in('id', Array.from(userIdsToFetch));
    if (profilesError) throw profilesError;
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    let successCount = 0, failureCount = 0, skippedCount = 0;

    for (const project of projects) {
      const recipients = new Set<string>([project.created_by, ...projectAdmins.filter(m => m.project_id === project.id).map(m => m.user_id)]);
      const dueDate = new Date(project.payment_due_date);
      const today = new Date();
      const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

      let reminderType: string | null = null;
      if (overdueDays === 0) reminderType = 'due_date';
      else if (overdueDays === 3) reminderType = 'overdue_3_days';
      else if (overdueDays > 3 && (overdueDays - 3) % 7 === 0) reminderType = 'overdue_weekly';

      if (!reminderType) continue;

      const { data: existingLog } = await supabaseAdmin
        .from('billing_reminders_log')
        .select('id')
        .eq('project_id', project.id)
        .eq('days_overdue_at_sending', overdueDays)
        .limit(1).single();

      if (existingLog) continue;

      for (const userId of recipients) {
        const profile = profileMap.get(userId);
        if (!profile) continue;

        const prefs = profile.notification_preferences || {};
        const billingPrefs = prefs['billing_reminder'];
        const isEnabled = (typeof billingPrefs === 'object' && billingPrefs !== null) ? billingPrefs.enabled !== false && billingPrefs.whatsapp !== false : billingPrefs !== false;
        const statusesToNotify = (typeof billingPrefs === 'object' && billingPrefs?.statuses) ? billingPrefs.statuses : ['Overdue'];

        if (isEnabled && statusesToNotify.includes(project.payment_status)) {
          const { error: insertError } = await supabaseAdmin
            .from('pending_notifications')
            .insert({
                recipient_id: userId,
                send_at: new Date(),
                notification_type: 'billing_reminder',
                context_data: {
                    project_id: project.id,
                    project_name: project.name,
                    days_overdue: overdueDays,
                }
            });
          if (insertError) {
            console.error(`Failed to insert notification for project ${project.id} to user ${userId}:`, insertError.message);
            failureCount++;
          } else {
            successCount++;
          }
        } else {
          skippedCount++;
        }
      }

      if (successCount > 0) {
        const { error: logInsertError } = await supabaseAdmin
          .from('billing_reminders_log')
          .insert({ project_id: project.id, reminder_type: reminderType, days_overdue_at_sending: overdueDays });
        if (logInsertError) console.error(`Failed to log reminder for project ${project.id}:`, logInsertError.message);
      }
    }

    return new Response(JSON.stringify({ success: true, processed_invoices: projects.length, sent_notifications: successCount, skipped_notifications: skippedCount, failed_notifications: failureCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[send-overdue-reminders] Top-level function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});