// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, instructions, context } = await req.json()
    
    if (!text) {
      throw new Error('Text is required')
    }

    const systemPrompt = `You are an expert copywriter for WhatsApp business messaging. 
    Your goal is to rewrite messages to be engaging, professional yet friendly, and properly formatted for WhatsApp.
    
    IMPORTANT RULES:
    1. Use WhatsApp Markdown syntax:
       - *bold* for emphasis (e.g. *Important*, *Action Required*)
       - _italics_ for subtle emphasis
       - ~strikethrough~ for corrections (rarely used)
       - \`code\` for codes or numbers (e.g. \`{{ticket_id}}\`)
    2. Use emojis effectively but not excessively. Place them strategically.
    3. PRESERVE ALL VARIABLES exactly as they are (e.g. {{name}}, {{amount}}). Do not change their casing or spelling.
    4. Make the message concise and easy to read on mobile screens. Use line breaks.
    5. If instructions are provided, follow them strictly.
    
    Output ONLY the rewritten message text. Do not include explanations or quotes.`

    const userContent = `Original Message:
    "${text}"
    
    Context: ${context || 'General WhatsApp Broadcast'}
    
    Instructions: ${instructions || 'Improve the tone, formatting, and use emojis.'}
    
    Rewritten Message:`

    // --- 1. TRY ANTHROPIC (Primary) ---
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      try {
        console.log("Attempting rewrite with Anthropic...");
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userContent }
            ]
          }),
        });

        const data = await anthropicResponse.json();
        if (data.error) throw new Error(data.error.message);
        
        const rewrittenText = data.content[0].text;
        return new Response(JSON.stringify({ rewrittenText, provider: 'anthropic' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.warn("Anthropic failed, trying fallback:", e.message);
      }
    } else {
        console.log("Anthropic API key not found, skipping to OpenAI.");
    }

    // --- 2. FALLBACK TO OPENAI ---
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check Env var first, then DB config
    let openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
        const { data: config } = await supabaseAdmin
          .from('app_config')
          .select('value')
          .eq('key', 'OPENAI_API_KEY')
          .maybeSingle();
        openAiKey = config?.value;
    }

    if (!openAiKey) {
        throw new Error("No valid AI provider configured (Anthropic failed/missing, OpenAI missing).");
    }

    console.log("Attempting rewrite with OpenAI...");
    const openai = new OpenAI({ apiKey: openAiKey });
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Fast & cost-effective
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
        ],
        temperature: 0.7,
    });

    const rewrittenText = completion.choices[0].message.content;

    return new Response(JSON.stringify({ rewrittenText, provider: 'openai' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('AI Rewrite Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})