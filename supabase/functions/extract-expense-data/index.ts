import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import OpenAI from 'https://esm.sh/openai@4.28.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileData, fileType } = await req.json()

    if (!fileData || !fileType) {
      throw new Error('File data and type are required')
    }

    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Retrieve OpenAI API Key
    // Priority: Edge Secret -> DB Config -> Fail
    let openAiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAiKey) {
      console.log('OpenAI key not found in env, checking app_config...')
      const { data: configData, error: configError } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'openai_api_key')
        .single()

      if (configError || !configData?.value) {
        console.error('Failed to retrieve OpenAI key from app_config:', configError)
        return new Response(
          JSON.stringify({ 
            error: 'OpenAI API key is missing. Please set it in Edge Function Secrets or app_config table.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      openAiKey = configData.value
    }

    // 3. Check File Type Support
    if (fileType === 'application/pdf') {
      return new Response(
        JSON.stringify({ 
          error: 'PDF analysis is currently not supported for auto-extraction. Please convert to an image (JPG/PNG) or enter details manually.' 
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!fileType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Unsupported file type. Please upload an image (JPG/PNG).' 
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Initialize OpenAI
    const openai = new OpenAI({
      apiKey: openAiKey,
    })

    console.log('Sending image to OpenAI for analysis...')

    // 5. Call OpenAI GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expense data extractor. Extract the following fields from the receipt/invoice image: beneficiary (merchant name), amount (total), date (YYYY-MM-DD), and remarks (brief description of items). Return ONLY valid JSON."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this receipt image and extract data in JSON format: { \"beneficiary\": string, \"amount\": number, \"date\": string (ISO format), \"remarks\": string }." },
            {
              type: "image_url",
              image_url: {
                "url": fileData, // Base64 data url passed from frontend
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error("No content received from OpenAI")
    }

    console.log('OpenAI response:', content)
    const result = JSON.parse(content)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})