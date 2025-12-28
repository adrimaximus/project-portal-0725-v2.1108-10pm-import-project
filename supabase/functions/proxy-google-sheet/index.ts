import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Fetching from: ${url}`)
    
    // Add User-Agent to mimic a browser/legitimate client
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
        console.error(`Failed to fetch sheet. Status: ${response.status}`)
        return new Response(
            JSON.stringify({ error: `Failed to fetch sheet: ${response.statusText}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const text = await response.text()

    // Check if we got HTML (likely a login page or error page) instead of CSV
    if (text.trim().startsWith("<!DOCTYPE html") || text.includes("<html")) {
       console.error("Received HTML instead of CSV")
       return new Response(
            JSON.stringify({ error: "Received HTML instead of data. Ensure the Google Sheet is set to 'Anyone with the link can View'." }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       ) 
    }

    return new Response(text, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error("Proxy error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})