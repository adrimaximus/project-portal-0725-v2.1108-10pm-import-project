import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { JWT } from "https://googleapis.deno.dev/v1/sheets:v4.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { spreadsheetId, data } = await req.json()

    if (!spreadsheetId || !data || !Array.isArray(data)) {
      throw new Error("Missing spreadsheetId or data array")
    }

    const serviceAccount = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT') || '{}')
    
    const client = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // 1. Prepare data for writing
    // Assume all objects in data have the same keys (headers)
    // If data is empty, we can't infer headers easily unless passed, but we can assume clearing is fine.
    
    let values: any[][] = [];
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(obj => headers.map(header => obj[header]));
      values = [headers, ...rows];
    } else {
        // If data is empty, we effectively just want to clear the sheet.
        // values remains empty
    }

    // 2. Get the first sheet's name to target it safely
    // We use a raw fetch here because the lightweight library might not cover all metadata methods easily,
    // or we can try to use the clear/update directly if we assume 'Sheet1'.
    // But better to get the actual sheet name.
    
    // Using the client to fetch spreadsheet metadata
    const token = await client.getAccessToken();
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!metaRes.ok) {
        const err = await metaRes.text();
        throw new Error(`Failed to fetch spreadsheet metadata: ${err}`);
    }
    
    const meta = await metaRes.json();
    const firstSheetTitle = meta.sheets?.[0]?.properties?.title || 'Sheet1';
    
    // 3. Clear the sheet content first
    const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetTitle)}:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!clearRes.ok) {
        console.error("Failed to clear sheet", await clearRes.text());
        // Continue anyway to try updating
    }

    // 4. Update with new data
    if (values.length > 0) {
        const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetTitle)}!A1?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values })
        });

        if (!updateRes.ok) {
            const err = await updateRes.text();
            throw new Error(`Failed to update sheet values: ${err}`);
        }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error updating sheet:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})