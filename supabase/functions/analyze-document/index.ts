import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileUrl, fileType } = await req.json()
    
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'No file URL provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Try to get API Key from Environment
    let openAiApiKey = Deno.env.get('OPENAI_API_KEY')

    // 2. If not found, try to get from Database (app_config)
    if (!openAiApiKey) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const { data: config, error: dbError } = await supabaseAdmin
        .from('app_config')
        .select('value')
        .eq('key', 'OPENAI_API_KEY')
        .single()
      
      if (!dbError && config) {
        openAiApiKey = config.value
      }
    }

    if (!openAiApiKey) {
      console.error('OPENAI_API_KEY is not set in Env or DB')
      return new Response(
        JSON.stringify({ error: 'OpenAI API Key is not configured. Please add it in Settings > Integrations.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OpenAI Vision only supports images directly via URL
    if (!fileType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ message: "File type not supported for AI extraction. Please upload an image." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Processing file: ${fileUrl} (${fileType})`)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that extracts data from receipts and invoices. 
            Analyze the image and return a JSON object with the following fields:
            - amount: The total amount paid (number only, remove currency symbols).
            - beneficiary: The name of the merchant or person paid (string).
            - purpose: A short 3-5 word description of what was purchased or the service provided (string).
            - remarks: A brief summary of the transaction details, including date if visible (string).
            - date: The date of transaction in YYYY-MM-DD format if visible (string).
            - bank_details: If bank account details for payment (transfer destination) are visible, return an object with:
                - bank_name: Name of the bank (string).
                - account_number: Account number (string, digits only).
                - account_name: Name on the account (string).
              If not visible, set to null.
            
            If a field is not visible or cannot be determined, set it to null.
            Return ONLY raw JSON, no markdown formatting.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract data from this receipt image.' },
              {
                type: 'image_url',
                image_url: {
                  url: fileUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('OpenAI API Error:', data.error)
      throw new Error(`OpenAI Error: ${data.error.message}`)
    }

    console.log('OpenAI Response usage:', data.usage)
    
    const content = data.choices[0].message.content
    let result
    try {
      result = JSON.parse(content)
    } catch (e) {
      console.error("Failed to parse JSON", content)
      throw new Error("AI returned invalid JSON")
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error processing document:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})