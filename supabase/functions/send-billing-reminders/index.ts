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

const getSystemPrompt = () => `Anda adalah asisten keuangan yang profesional, sopan, dan proaktif. Tugas Anda adalah membuat pesan pengingat WhatsApp tentang invoice yang akan segera jatuh tempo atau baru saja jatuh tempo.

**Aturan Penting:**
1.  **Nada:** Gunakan bahasa yang ramah, sopan, dan mengingatkan. Jangan terdengar menuduh.
2.  **Detail:** Sertakan nama proyek, nomor invoice, dan tanggal jatuh tempo.
3.  **Format:** Gunakan format tebal WhatsApp (*kata*) untuk detail penting.
4.  **Singkat:** Buat pesan yang langsung ke intinya.
5.  **URL:** Sertakan URL yang diberikan di akhir pesan.`;

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

    console.log("[send-billing-reminders] Job started.");

    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, slug, invoice_number, payment_due_date, payment_status, created_by')
      .not('payment_status', 'in', '("Paid","Cancelled","Bid Lost")')
      .not('payment_due_date', 'is', null);

    if (projectsError) throw projectsError;

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ message: "No active invoices to check." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const projectIds = projects.map(p => p.id);
    const { data: projectAdmins } = await supabaseAdmin.from('project_members').select('project_id, user_id').in('project_id', projectIds).eq('role', 'admin');
    
    const userIdsToFetch = new Set<string>();
    projects.forEach(p => userIdsToFetch.add(p.created_by));
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

    for (const project of projects) {
      const dueDate = new Date(project.payment_due_date);
      const today = new Date();
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      const shouldSend = [7, 3, 1, 0].includes(diffDays);

      if (!shouldSend) continue;

      let statusContext = '';
      if (diffDays === 0) statusContext = 'Jatuh tempo HARI INI';
      else statusContext = `Akan jatuh tempo dalam ${diffDays} hari`;

      const recipients = new Set<string>([project.created_by]);
      projectAdmins?.filter(m => m.project_id === project.id).forEach(m => recipients.add(m.user_id));

      for (const userId of recipients) {
        const profile = profileMap.get(userId);
        if (!profile || !profile.phone) continue;
        
        const prefs = profile.notification_preferences;
        if (prefs && prefs.billing_reminder === false) continue;

        const formattedPhone = formatPhoneNumberForApi(profile.phone);
        if (!formattedPhone) continue;

        const recipientName = getFullName(profile);
        const userPrompt = `**Konteks:**\n- **Penerima:** ${recipientName}\n- **Proyek:** ${formatMentions(project.name)}\n- **Invoice:** ${project.invoice_number || 'N/A'}\n- **Status Waktu:** ${statusContext}\n- **Tanggal Jatuh Tempo:** ${dueDate.toLocaleDateString('id-ID')}\n- **URL:** ${Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz"}/billing\n\nBuat pesan pengingat pembayaran yang ramah.`;

        try {
          let aiMessage = `Halo ${recipientName}, ini pengingat ramah bahwa pembayaran untuk proyek *${project.name}* (${project.invoice_number || 'Invoice'}) ${statusContext}. Mohon cek di dashboard: ${Deno.env.get("SITE_URL") ?? "https://7inked.ahensi.xyz"}/billing`;
          
          if (Deno.env.get('ANTHROPIC_API_KEY')) {
              const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
              const aiResponse = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 200, system: getSystemPrompt(), messages: [{ role: "user", content: userPrompt }] });
              aiMessage = aiResponse.content[0].text;
          }

          if (useMeta) {
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
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const errorObj = data.error || {};
                const message = errorObj.message || 'Unknown Meta API error';
                const code = errorObj.code || '';
                
                throw new Error(`Meta API Error ${code}: ${message}`);
            }
          } else {
            const response = await fetch('https://wbiztool.com/api/v1/send_msg/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Client-ID': wbizClientId, 'X-Api-Key': wbizApiKey },
                body: JSON.stringify({ client_id: wbizClientId, api_key: wbizApiKey, whatsapp_client: wbizWhatsappClientId, phone: formattedPhone, message: aiMessage }),
            });
            if (!response.ok) throw new Error(`WBIZTOOL API Error: ${response.statusText}`);
          }
          successCount++;
          console.log(`[send-billing-reminders] Sent reminder for project ${project.id} to ${profile.email}.`);
        } catch (e) {
          console.error(`Failed to send reminder to ${profile.email}:`, e.message);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sent_notifications: successCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});