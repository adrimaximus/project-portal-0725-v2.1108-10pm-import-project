import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { importPKCS8, SignJWT } from 'https://esm.sh/jose@4.14.4'

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
    
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT configuration");
    }

    // 1. Generate JWT for Google Auth
    const alg = 'RS256'
    const pkcs8 = serviceAccount.private_key
    const privateKey = await importPKCS8(pkcs8, alg)

    const jwt = await new SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets'
    })
      .setProtectedHeader({ alg })
      .setIssuer(serviceAccount.client_email)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(privateKey)

    // 2. Exchange JWT for Access Token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Failed to get access token: ${errText}`);
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // 3. Prepare data for writing
    let values: any[][] = [];
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map((obj: any) => headers.map(header => obj[header]));
      values = [headers, ...rows];
    }

    // 4. Get the first sheet's name to target it safely
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!metaRes.ok) {
        const err = await metaRes.text();
        throw new Error(`Failed to fetch spreadsheet metadata: ${err}`);
    }
    
    const meta = await metaRes.json();
    const firstSheetTitle = meta.sheets?.[0]?.properties?.title || 'Sheet1';
    
    // 5. Clear the sheet content first (Important for handling deleted rows)
    const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetTitle)}:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!clearRes.ok) {
        console.error("Failed to clear sheet", await clearRes.text());
        // Continue anyway to try updating, but log the error
    }

    // 6. Update with new data
    if (values.length > 0) {
        const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetTitle)}!A1?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: { 
                Authorization: `Bearer ${accessToken}`,
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