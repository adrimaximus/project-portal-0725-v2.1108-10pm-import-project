import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Get secrets
    const serviceAccountStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
    if (!serviceAccountStr) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT secret is not set")
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountStr)
    } catch (e) {
      console.error("JSON Parse Error:", e.message);
      throw new Error("Invalid JSON in GOOGLE_SERVICE_ACCOUNT secret.");
    }

    // 2. Parse Request
    const { spreadsheetId, data } = await req.json()
    if (!spreadsheetId) throw new Error("Missing spreadsheetId")
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("Data must be a non-empty array")
    }

    // 3. Authenticate with Google
    const accessToken = await getGoogleAccessToken(serviceAccount)

    // 4. Prepare Data for Sheets API
    // Use keys from the first object as headers
    const headers = Object.keys(data[0])
    const values = [headers] // First row is headers

    data.forEach(row => {
      const rowValues = headers.map(header => {
        const val = row[header]
        return val === null || val === undefined ? "" : String(val)
      })
      values.push(rowValues)
    })

    // 5. Get the Sheet Name (Title) of the first sheet
    const sheetTitle = await getFirstSheetTitle(spreadsheetId, accessToken)
    const updateRange = `'${sheetTitle}'!A1`

    // 6. Update the Sheet
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: updateRange,
        majorDimension: "ROWS",
        values: values
      })
    })

    const resJson = await res.json()

    if (!res.ok) {
      console.error("Google Sheets API Error:", resJson)
      const errorMessage = resJson.error?.message || "Failed to update sheet";
      // Give a specific hint for permission errors
      if (res.status === 403) {
         throw new Error(`Permission denied. Please share the Google Sheet with: ${serviceAccount.client_email}`);
      }
      throw new Error(errorMessage)
    }

    return new Response(JSON.stringify({ success: true, updatedCells: resJson.updatedCells }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Function Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// Helper: Get Access Token from Service Account
async function getGoogleAccessToken(serviceAccount: any) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // 1 hour

  // Handle private key formatting issues (replace literal \n with actual newlines)
  const privateKeyStr = serviceAccount.private_key.replace(/\\n/g, '\n');

  const privateKey = await jose.importPKCS8(privateKeyStr, 'RS256');

  const jwt = await new jose.SignJWT({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token"
  })
  .setProtectedHeader({ alg: 'RS256' })
  .setIssuedAt(iat)
  .setExpirationTime(exp)
  .sign(privateKey);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to get access token: ${err.error_description || err.error}`)
  }

  const data = await res.json();
  return data.access_token;
}

// Helper: Get title of the first sheet
async function getFirstSheetTitle(spreadsheetId: string, accessToken: string) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  
  if (!res.ok) {
    const err = await res.json()
    if (res.status === 403) {
        throw new Error("Permission denied. Did you share the sheet with the service account email?");
    }
    throw new Error(err.error?.message || "Failed to fetch spreadsheet metadata")
  }

  const data = await res.json()
  if (!data.sheets || data.sheets.length === 0) {
    throw new Error("No sheets found in spreadsheet")
  }
  
  return data.sheets[0].properties.title
}