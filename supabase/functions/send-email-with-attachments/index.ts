import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, attachments } = await req.json();
    if (!to || !subject || (!html && !text)) {
        throw new Error("Missing required fields: to, subject, and html or text.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: config, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'EMAILIT_API_KEY')
      .single();

    if (configError || !config?.value) {
      throw new Error("Emailit API key not configured.");
    }
    const emailitApiKey = config.value;

    const emailPayload = {
      from: Deno.env.get("EMAIL_FROM") ?? "7i Portal <no-reply@mail.ahensi.com>",
      to, subject, html, text,
      // Emailit API supports 'attachments' as an array of objects { filename, content_url }
      attachments: (attachments || []).map((att: any) => ({
        filename: att.file_name || 'attachment',
        content_url: att.file_url,
      })),
    };

    const response = await fetch("https://api.emailit.com/v1/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${emailitApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
        const status = response.status;
        const errorText = await response.text();
        let errorMessage = `Failed to send email (Status: ${status}).`;
        
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
        } catch (e) {
             const cleanText = errorText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
             errorMessage = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
        }
        
        throw new Error(`Emailit API Error: ${errorMessage}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ ok: true, data }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e) {
    console.error("Send Email Attachment Error:", e.message);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});