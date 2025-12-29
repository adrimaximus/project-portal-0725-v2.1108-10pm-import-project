import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Try getting from Env (Secret)
    let openAiKey = Deno.env.get('OPENAI_API_KEY')

    // 2. If not found, try getting from Database (app_config)
    if (!openAiKey) {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const { data: config } = await supabaseAdmin
            .from('app_config')
            .select('value')
            .eq('key', 'OPENAI_API_KEY')
            .maybeSingle()
            
        if (config?.value) {
            openAiKey = config.value
        }
    }

    if (!openAiKey) {
      // Return 200 with error field to bypass generic client error handling
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is missing. Please configure it in Settings > Integrations.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { title, currentDescription } = await req.json()

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Goal title is required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that writes inspiring and clear goal descriptions. Keep it concise (1-2 sentences) and motivating.' },
          { role: 'user', content: `Write a description for a goal titled "${title}". ${currentDescription ? `Current description draft: "${currentDescription}". Improve or expand upon it.` : ''}` },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API Error:', errorData)
      return new Response(
        JSON.stringify({ error: `OpenAI Error: ${errorData.error?.message || 'Unknown error'}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const generatedText = data.choices[0].message.content.trim()

    return new Response(
      JSON.stringify({ description: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // Return 200 to pass message to client
    )
  }
})