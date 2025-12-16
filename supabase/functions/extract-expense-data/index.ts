import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to fetch file content as base64
async function fetchFileAsBase64(url: string): Promise<{ base64: string, mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return { base64, mimeType: contentType };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();

    if (!fileUrl) {
      return new Response(JSON.stringify({ error: 'Missing fileUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    // Check for OpenAI Key (Env or DB)
    let openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        const { data: config } = await supabaseAdmin
            .from('app_config')
            .select('value')
            .eq('key', 'OPENAI_API_KEY')
            .maybeSingle();
        if (config) openaiApiKey = config.value;
    }

    if (!anthropicApiKey && !openaiApiKey) {
      throw new Error('No AI provider configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
    }

    const { base64, mimeType } = await fetchFileAsBase64(fileUrl);

    const promptText = `You are an expert expense data extractor. Analyze the provided document (invoice, bill, or receipt) and extract the following information. Respond ONLY with a JSON object matching the schema provided below. Do not include any other text, explanation, or markdown formatting outside the JSON object.

Schema:
{
  "amount": number, // The total amount of the expense/bill, in IDR if currency is specified, otherwise just the number. Use the largest, most prominent total amount.
  "purpose": string, // A brief description of the expense (e.g., "Payment for graphic design services").
  "beneficiary": string, // The name of the company or person who issued the invoice/bill (Vendor).
  "client_name": string, // The name of the entity being billed (Client/Brand/Company name found in "Bill To" or similar).
  "location": string, // Any venue, location, or address mentioned in the description or line items (not the addresses of the vendor/client).
  "remarks": string, // Any important notes found on the document.
  "date": string, // The invoice/transaction date in YYYY-MM-DD format.
  "due_date": string, // The payment due date in YYYY-MM-DD format, if specified.
  "bank_details": {
    "bank_name": string, // Name of the bank (e.g., BCA, Mandiri, BRI, BNI).
    "account_number": string, // Account number (digits only).
    "account_name": string, // Name on the account.
    "swift_code": string // SWIFT/BIC code if visible.
  }
}

Document Name: ${fileName}
`;

    let extractedData;

    // Try Anthropic first if available
    if (anthropicApiKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicApiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mimeType,
                                    data: base64,
                                },
                            },
                            {
                                type: 'text',
                                text: promptText,
                            },
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API Error:', errorText);
            // If Anthropic fails and we have OpenAI, try OpenAI? 
            // For now let's throw, unless we want complex fallback logic.
            // If only Anthropic key was present, this is fatal.
            if (!openaiApiKey) throw new Error(`Anthropic API failed: ${response.status}`);
        } else {
            const data = await response.json();
            const extractedText = data.content[0].text.trim();
            const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
            extractedData = JSON.parse(jsonMatch ? jsonMatch[0] : extractedText);
        }
    }
    
    // Fallback to OpenAI if Anthropic didn't run or failed (and we caught it/didn't throw)
    if (!extractedData && openaiApiKey) {
         const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: promptText },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 1000,
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API Error:', errorText);
            throw new Error(`OpenAI API failed: ${response.status}`);
        }
        
        const data = await response.json();
        extractedData = JSON.parse(data.choices[0].message.content);
    }

    if (!extractedData) {
        throw new Error("Failed to extract data from AI provider.");
    }

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});