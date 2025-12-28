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
    const response = await fetch(url)
    
    if (!response.ok) {
        console.error(`Failed to fetch sheet. Status: ${response.status}`)
        return new Response(
            JSON.stringify({ error: `Failed to fetch sheet: ${response.statusText}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const text = await response.text()

    // Basic check to see if we got HTML back (auth wall) instead of CSV
    if (text.trim().startsWith("<!DOCTYPE html") || text.includes("<html")) {
       console.error("Received HTML instead of CSV")
       return new Response(
            JSON.stringify({ error: "Received HTML. Please ensure the sheet is visible to anyone with the link." }),
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