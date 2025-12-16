import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { fileUrl, fileType } = await req.json()
    
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'No file URL provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiApiKey) {
      console.error('OPENAI_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: API Key missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OpenAI Vision only supports images directly via URL
    if (!fileType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ message: "File type not supported for AI extraction" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      throw new Error(data.error.message)
    }

    console.log('OpenAI Response usage:', data.usage)
    
    const content = data.choices[0].message.content
    const result = JSON.parse(content)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing document:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})