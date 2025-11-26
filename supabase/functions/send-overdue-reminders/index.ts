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

const formatPhoneNumberForApi = (phone: string): string | null => {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '62' + cleaned.substring(1);
    if (cleaned.startsWith('62')) return cleaned;
    if (cleaned.length > 8 && cleaned.startsWith('8')) return '62' + cleaned;
    return null;
};

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
      return new Response(JSON.stringify({ message: "No active invoices to check." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const projectIds = overdueProjects.map(p => p.id);
    const { data: projectAdmins } = await supabaseAdmin.from('project_members').select('project_id, user_id').in('project_id', projectIds).eq('role', 'admin');
    
    const userIdsToFetch = new Set<string>();
    overdueProjects.forEach(p => userIdsToFetch.add(p.created_by));
    projectAdmins?.forEach(m => userIdsToFetch.add(m.user_id));

    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, first_name, last_name, email, phone, notification_preferences').in('id', Array.from(userIdsToFetch));
    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    const { data: config } = await supabaseAdmin.from('app_config').select('key, value').in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID', 'META_PHONE_ID', 'META_ACCESS_TOKEN']);
    
    const metaPhoneId = config?.find(c => c.key === 'META_PHONE_ID')?.value;
    const metaAccessToken = config?.find(c => c.key === 'META_ACCESS_TOKEN')?.value;
    const wbizClientId = config?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const wbizApiKey = config?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const wbizWhatsappClientId = config?.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value;

    const useMeta = metaPhoneId && metaAccessToken;
    if (!useMeta && (!wbizClientId || !wbizApiKey || !wbizWhatsappClientId)) {
        throw new Error("No valid WhatsApp configuration found (Meta or WBIZTOOL).");
    }

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
        if (!profile || !profile.phone) continue;
        
        const prefs = profile.notification_preferences;
        // If preferences exist and billing_reminder is explicitly set to false, skip. Default is true.
        if (prefs && prefs.billing_reminder === false) continue;

        const formattedPhone = formatPhoneNumberForApi(profile.phone);
        if (!formattedPhone) continue;

        const recipientName = getFullName(profile);
        const userPrompt = `**Konteks:**\n- **Jenis:** Pengingat Invoice Jatuh Tempo\n- **Penerima:** ${recipientName}\n- **Proyek:** ${formatMentions(project.name)}\n- **Nomor Invoice:** ${project.invoice_number || 'N/A'}\n- **Jumlah Hari Terlambat:** ${overdueDays} hari\n- **Tingkat Urgensi:** ${urgency}\n- **URL:** ${Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz"}/billing\n\nBuat pesan pengingat yang sopan dan profesional sesuai dengan tingkat urgensi yang diberikan.`;

        try {
          let aiMessage = "";
          if (Deno.env.get('ANTHROPIC_API_KEY')) {
             const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
             const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 200, system: getSystemPrompt(), messages: [{ role: "user", content: userPrompt }] });
             aiMessage = aiResponse.content[0].text;
          } else {
             aiMessage = `Halo ${recipientName}, invoice untuk proyek *${project.name}* telah jatuh tempo selama ${overdueDays} hari. Mohon segera lakukan pembayaran. Terima kasih.`;
          }

          let sent = false;
          let lastError = '';

          // 1. Try Meta
          if (useMeta) {
              try {
                const response = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${metaAccessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: formattedPhone,
                        type: "text",
                        text: { body: aiMessage }
                    }),
                });

                if (response.ok) {
                    sent = true;
                } else {
                    const data = await response.json().catch(() => ({}));
                    const errorObj = data.error || {};
                    lastError = `Meta Error: ${errorObj.message}`;
                    console.warn(`Meta send failed for ${formattedPhone}:`, lastError);
                }
              } catch (e) {
                lastError = `Meta Exception: ${e.message}`;
                console.warn(`Meta exception for ${formattedPhone}:`, e);
              }
          }

          // 2. Fallback to WBIZTOOL
          if (!sent && useWbiz) {
              try {
                  console.log(`Falling back to WBIZTOOL for ${formattedPhone}...`);
                  const response = await fetch('https://wbiztool.com/api/v1/send_msg', { // REMOVED trailing slash
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'X-Client-ID': wbizClientId, 'X-Api-Key': wbizApiKey },
                      body: JSON.stringify({ 
                        client_id: wbizClientId,
                        api_key: wbizApiKey,
                        whatsapp_client: wbizWhatsappClientId,
                        phone: formattedPhone, 
                        message: aiMessage,
                      }),
                  });
                  if (response.ok) {
                      sent = true;
                  } else {
                      const errorText = await response.text();
                      lastError += ` | WBIZTOOL Error: ${response.statusText}`;
                      console.warn(`WBIZTOOL send failed for ${formattedPhone}:`, errorText);
                  }
              } catch (e) {
                  lastError += ` | WBIZTOOL Exception: ${e.message}`;
                  console.warn(`WBIZTOOL exception for ${formattedPhone}:`, e);
              }
          }

          if (sent) {
              successCount++;
              console.log(`[send-overdue-reminders] Sent reminder for project ${project.id} to ${profile.email}.`);
          } else {
              throw new Error(lastError || "All providers failed");
          }

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