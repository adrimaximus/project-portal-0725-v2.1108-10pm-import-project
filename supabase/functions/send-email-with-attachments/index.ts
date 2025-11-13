import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
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

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
        console.error("Emailit API Error:", response.status, data);
        throw new Error(data.message || `Emailit API failed with status ${response.status}`);
    }

    return new Response(JSON.stringify({ ok: true, data }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});