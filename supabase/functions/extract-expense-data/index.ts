import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import pdf from 'https://esm.sh/pdf-parse@1.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    let openAiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAiKey) {
      const { data: configData, error: configError } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'OPENAI_API_KEY')
        .single()

      if (configError || !configData?.value) {
        return new Response(
          JSON.stringify({ 
            error: 'OpenAI API key is missing. Please set it in Settings > Integrations.' 
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      openAiKey = configData.value
    }

    const openai = new OpenAI({ apiKey: openAiKey })
    
    let userContent = [];
    let systemPrompt = "You are an expense data extractor. Return ONLY valid JSON with keys: beneficiary, amount (number), date (YYYY-MM-DD), remarks.";

    // 3. Handle PDF (Text Extraction) vs Image (Vision)
    if (fileType === 'application/pdf') {
      console.log('Processing PDF...');
      
      // Extract base64 data (remove header if present)
      const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      
      // Convert Base64 to Buffer (Uint8Array)
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Extract text from PDF
      try {
        const data = await pdf(bytes);
        const textContent = data.text;
        
        if (!textContent || textContent.trim().length === 0) {
           throw new Error("Could not extract text from PDF. It might be a scanned image-only PDF.");
        }

        console.log("PDF Text Extracted (first 100 chars):", textContent.substring(0, 100));
        
        userContent.push({ 
          type: "text", 
          text: `Extract expense data from this PDF content: \n\n${textContent}` 
        });

      } catch (pdfError) {
        console.error("PDF Parsing Error:", pdfError);
        return new Response(
          JSON.stringify({ error: "Failed to read PDF text. If this is a scanned document, please convert it to an image (JPG/PNG) first." }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } else if (fileType.startsWith('image/')) {
      console.log('Processing Image...');
      userContent.push({ type: "text", text: "Analyze this receipt image." });
      userContent.push({
        type: "image_url",
        image_url: { "url": fileData }
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload Image or PDF.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Call OpenAI GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expense data extractor. Extract the following fields from the input: 
          - beneficiary (merchant/person name)
          - amount (total value as number)
          - date (YYYY-MM-DD)
          - remarks (brief description of items/service)
          - due_date (YYYY-MM-DD, optional)
          - bank_details (object with bank_name, account_number, account_name, swift_code if visible).
          
          Return ONLY valid JSON. If fields are missing, use null.`
        },
        {
          role: "user",
          content: userContent
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content
    if (!content) throw new Error("No content received from OpenAI")

    const result = JSON.parse(content)
    console.log("Analysis Result:", result);

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