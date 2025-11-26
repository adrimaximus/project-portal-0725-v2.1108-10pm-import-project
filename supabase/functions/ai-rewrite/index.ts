import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }

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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt }, // Claude 3 puts system prompt in top-level parameter usually, but messages array works for some contexts. Let's use system parameter correctly.
        ]
      }),
    })
    
    // Correct Anthropic API usage for system prompt
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
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
      })

    const data = await anthropicResponse.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    const rewrittenText = data.content[0].text

    return new Response(JSON.stringify({ rewrittenText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})