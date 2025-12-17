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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileData, fileType, fileUrl, instructions } = await req.json()
    
    // Support both direct base64 data (fileData) or a public URL (fileUrl)
    const imageUrl = fileUrl || fileData;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Check File Type (Strictly allow images only for AI Vision)
    if (!fileType || !fileType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ 
          error: "PDFs cannot be analyzed by AI yet. Please upload an image (screenshot/photo) or enter details manually." 
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Initialize Supabase & Get API Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    let openAiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAiKey) {
      const { data: config, error: dbError } = await supabaseAdmin
        .from('app_config')
        .select('value')
        .eq('key', 'OPENAI_API_KEY')
        .single()
      
      if (!dbError && config) {
        openAiKey = config.value
      }
    }

    if (!openAiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API Key is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openai = new OpenAI({ apiKey: openAiKey })

    console.log(`Processing image analysis...`)

    // 3. Call OpenAI GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts data from receipts and invoices. 
            Analyze the image and return a JSON object with the following fields:
            - amount: The total amount paid (number only, remove currency symbols).
            - beneficiary: The name of the merchant or person paid (string).
            - purpose: A short 3-5 word description of what was purchased or the service provided (string).
            - remarks: A brief summary of the transaction details, including date if visible (string).
            - date: The date of transaction in YYYY-MM-DD format if visible (string).
            - bank_details: If bank account details for payment (transfer destination) are visible, return an object with:
                - bank_name: Name of the bank (e.g., BCA, Mandiri, BRI, BNI).
                - account_number: Account number (string, digits only).
                - account_name: Name on the account (string).
                - swift_code: SWIFT/BIC code if visible (string).
              Look for keywords like "Bank", "Transfer", "No. Rek", "Account No", "A/C", "IBAN", "Swift".
              If not visible, set to null.
            
            ${instructions ? `IMPORTANT ADDITIONAL INSTRUCTIONS: ${instructions}` : ''}

            If a field is not visible or cannot be determined, set it to null.
            Return ONLY raw JSON, no markdown formatting.`
        },
        {
          role: "user",
          content: [
            { type: 'text', text: 'Extract data from this receipt image.' },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

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