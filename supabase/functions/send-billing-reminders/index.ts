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

    console.log("[send-overdue-reminders] Job started.");

    const { data: overdueProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, slug, invoice_number, payment_due_date, created_by')
      .eq('payment_status', 'Overdue');

    if (projectsError) throw projectsError;

    if (!overdueProjects || overdueProjects.length === 0) {
      return new Response(JSON.stringify({ message: "No overdue invoices." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Fetch users and configs
    const projectIds = overdueProjects.map(p => p.id);
    const { data: projectAdmins } = await supabaseAdmin.from('project_members').select('project_id, user_id').in('project_id', projectIds).eq('role', 'admin');
    const userIdsToFetch = new Set<string>();
    overdueProjects.forEach(p => userIdsToFetch.add(p.created_by));
    projectAdmins?.forEach(m => userIdsToFetch.add(m.user_id));

    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, first_name, last_name, email, phone').in('id', Array.from(userIdsToFetch));
    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    // Fetch Messaging Config
    const { data: config } = await supabaseAdmin.from('app_config').select('key, value').in('key', ['WBIZTOOL_CLIENT_ID', 'WBIZTOOL_API_KEY', 'WBIZTOOL_WHATSAPP_CLIENT_ID', 'META_PHONE_ID', 'META_ACCESS_TOKEN']);
    
    const metaPhoneId = config?.find(c => c.key === 'META_PHONE_ID')?.value;
    const metaAccessToken = config?.find(c => c.key === 'META_ACCESS_TOKEN')?.value;
    const wbizClientId = config?.find(c => c.key === 'WBIZTOOL_CLIENT_ID')?.value;
    const wbizApiKey = config?.find(c => c.key === 'WBIZTOOL_API_KEY')?.value;
    const wbizWhatsappClientId = config?.find(c => c.key === 'WBIZTOOL_WHATSAPP_CLIENT_ID')?.value;

    const useMeta = metaPhoneId && metaAccessToken;
    if (!useMeta && (!wbizClientId || !wbizApiKey || !wbizWhatsappClientId)) {
        throw new Error("No valid WhatsApp configuration found.");
    }

    let successCount = 0;

    for (const project of overdueProjects) {
      const recipients = new Set<string>([project.created_by]);
      projectAdmins?.filter(m => m.project_id === project.id).forEach(m => recipients.add(m.user_id));

      const dueDate = new Date(project.payment_due_date);
      const today = new Date();
      const overdueDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
      let urgency = overdueDays > 30 ? 'sangat mendesak' : overdueDays > 7 ? 'cukup mendesak' : 'sedikit mendesak';

      for (const userId of recipients) {
        const profile = profileMap.get(userId);
        if (!profile || !profile.phone) continue;
        
        const formattedPhone = formatPhoneNumberForApi(profile.phone);
        if (!formattedPhone) continue;

        const recipientName = getFullName(profile);
        const userPrompt = `**Konteks:**\n- **Penerima:** ${recipientName}\n- **Proyek:** ${formatMentions(project.name)}\n- **Invoice:** ${project.invoice_number || 'N/A'}\n- **Terlambat:** ${overdueDays} hari\n- **Urgensi:** ${urgency}\n- **URL:** ${Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz"}/billing\n\nBuat pesan pengingat.`;

        try {
          const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
          const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 200, system: getSystemPrompt(), messages: [{ role: "user", content: userPrompt }] });
          const aiMessage = aiResponse.content[0].text;

          if (useMeta) {
            await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${metaAccessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: formattedPhone,
                    type: "text",
                    text: { body: aiMessage }
                }),
            });
          } else {
            await fetch('https://wbiztool.com/api/v1/send_msg/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Client-ID': wbizClientId, 'X-Api-Key': wbizApiKey },
                body: JSON.stringify({ client_id: wbizClientId, api_key: wbizApiKey, whatsapp_client: wbizWhatsappClientId, phone: formattedPhone, message: aiMessage }),
            });
          }
          successCount++;
        } catch (e) {
          console.error(`Failed to send reminder to ${profile.email}:`, e.message);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, count: successCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});