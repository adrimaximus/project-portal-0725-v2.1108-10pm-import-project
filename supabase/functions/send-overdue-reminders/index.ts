// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.22.0';

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
      .select('id, name, slug, invoice_number, payment_due_date, created_by')
      .eq('payment_status', 'Overdue');

    if (projectsError) throw projectsError;

    if (!overdueProjects || overdueProjects.length === 0) {
      console.log("[send-overdue-reminders] No overdue invoices found.");
      return new Response(JSON.stringify({ message: "No overdue invoices to process." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log(`[send-overdue-reminders] Found ${overdueProjects.length} overdue invoices.`);

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
      .select('id, first_name, last_name, email, phone')
      .in('id', Array.from(userIdsToFetch));

    if (profilesError) throw profilesError;
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    let successCount = 0;
    let failureCount = 0;

    for (const project of overdueProjects) {
      const recipients = new Set<string>();
      recipients.add(project.created_by);
      projectAdmins
        .filter(m => m.project_id === project.id)
        .forEach(m => recipients.add(m.user_id));

      const dueDate = new Date(project.payment_due_date);
      const today = new Date();
      const overdueDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));

      let urgency = 'sedikit mendesak';
      if (overdueDays > 30) {
        urgency = 'sangat mendesak dan perlu segera ditindaklanjuti';
      } else if (overdueDays > 7) {
        urgency = 'cukup mendesak';
      }

      for (const userId of recipients) {
        const profile = profileMap.get(userId);
        if (!profile || !profile.phone) {
          console.warn(`[send-overdue-reminders] No phone for ${profile?.email || userId}. Skipping.`);
          continue;
        }

        const recipientName = getFullName(profile);

        const userPrompt = `**Konteks:**
- **Jenis:** Pengingat Invoice Jatuh Tempo
- **Penerima:** ${recipientName}
- **Proyek:** ${formatMentions(project.name)}
- **Nomor Invoice:** ${project.invoice_number || 'N/A'}
- **Jumlah Hari Terlambat:** ${overdueDays} hari
- **Tingkat Urgensi:** ${urgency}
- **URL:** ${Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz"}/billing

Buat pesan pengingat yang sopan dan profesional sesuai dengan tingkat urgensi yang diberikan.`;

        try {
          const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
          const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 200, system: getSystemPrompt(), messages: [{ role: "user", content: userPrompt }] });
          const aiMessage = aiResponse.content[0].text;

          const { data: wbizConfig } = await supabaseAdmin.from('app_config').select('key, value').in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY']);
          const clientId = wbizConfig?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
          const apiKey = wbizConfig?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
          const whatsappClientId = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');

          if (!clientId || !apiKey || !whatsappClientId) throw new Error("WBIZTOOL credentials not fully configured.");

          const wbizResponse = await fetch('https://wbiztool.com/api/v1/send_msg/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Client-ID': clientId, 'X-Api-Key': apiKey },
            body: JSON.stringify({ 
              client_id: clientId,
              api_key: apiKey,
              whatsapp_client: whatsappClientId,
              phone: profile.phone, 
              message: aiMessage,
            }),
          });

          if (!wbizResponse.ok) {
            const status = wbizResponse.status;
            const errorText = await wbizResponse.text();
            let errorMessage = `Failed to send message (Status: ${status}).`;

            // Enhanced Error Handling for HTML/Cloudflare pages
            if (errorText.includes("Cloudflare") || errorText.includes("524") || errorText.includes("502")) {
                 if (status === 524) errorMessage = "WBIZTOOL API Timeout (Cloudflare 524). The service is taking too long to respond.";
                 else if (status === 502) errorMessage = "WBIZTOOL API Bad Gateway (Cloudflare 502). The service is down.";
                 else errorMessage = `WBIZTOOL API Error (Status: ${status}). Service might be experiencing issues.`;
            } else {
                try {
                  const errorJson = JSON.parse(errorText);
                  errorMessage = errorJson.message || JSON.stringify(errorJson);
                } catch (e) {
                  // Clean up HTML tags and truncate
                  const cleanText = errorText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
                  errorMessage = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
                }
            }
            throw new Error(errorMessage);
          }
          successCount++;
          console.log(`[send-overdue-reminders] Sent reminder for project ${project.id} to ${profile.email}.`);
        } catch (error) {
          failureCount++;
          console.error(`[send-overdue-reminders] Failed to send reminder for project ${project.id} to ${profile.email}:`, error.message);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed_invoices: overdueProjects.length, sent_notifications: successCount, failed_notifications: failureCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[send-overdue-reminders] Top-level function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});