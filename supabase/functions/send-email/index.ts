// @ts-nocheck
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
    const { to, subject, html, text } = await req.json();
    if (!to || !subject || (!html && !text)) {
        throw new Error("Missing required fields: to, subject, and html or text.");
    }

    const emailitApiKey = Deno.env.get("EMAILIT_API_KEY");
    if (!emailitApiKey) {
        throw new Error("Emailit API key is not configured on the server.");
    }

    const response = await fetch("https://api.emailit.com/v1/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${emailitApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") ?? "Betterworks <no-reply@mail.betterworks.id>",
        to, subject, html, text,
      }),
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
    console.error("Send Email Error:", e.message);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});