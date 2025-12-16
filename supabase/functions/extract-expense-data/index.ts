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
    const { fileUrl } = await req.json()
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAiApiKey) {
      console.error('OPENAI_API_KEY not set')
      throw new Error('Server configuration error: OPENAI_API_KEY is missing')
    }

    if (!fileUrl) {
      throw new Error('fileUrl is required in request body')
    }

    console.log('Analyzing file:', fileUrl)

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
            content: `You are an expert at extracting structured data from receipts, invoices, and bills.
            Analyze the provided image and extract the following fields in strict JSON format:
            
            - amount: number (total amount)
            - date: string (YYYY-MM-DD format)
            - due_date: string (YYYY-MM-DD format, usually for invoices)
            - beneficiary: string (merchant name or person)
            - purpose: string (brief description of items/service)
            - remarks: string (any additional relevant text or full description)
            - location: string (city or venue if available)
            - client_name: string (if the bill is addressed to a specific client/company)
            - bank_details: object (if available) containing:
              - account_number: string
              - bank_name: string
              - account_name: string
              - swift_code: string

            Return ONLY the JSON object. Do not include markdown formatting like \`\`\`json.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract data from this document.' },
              {
                type: 'image_url',
                image_url: {
                  url: fileUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API Error:', errorText)
      throw new Error(`OpenAI API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    // Clean potential markdown code blocks
    const jsonStr = content.replace(/^```json\s*|\s*```$/g, '')
    
    let result
    try {
      result = JSON.parse(jsonStr)
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Failed to parse AI response')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})