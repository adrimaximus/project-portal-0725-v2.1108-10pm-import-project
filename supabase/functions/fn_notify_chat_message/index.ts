// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function is being deprecated. The logic has been moved to the main 
// `schedule_new_message_notification` trigger to handle all cases (mentions and general messages)
// in one place, preventing conflicts and ensuring all users are notified correctly.
// Returning a successful response to ensure the trigger chain doesn't break.

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return new Response(JSON.stringify({ message: "This function is deprecated and performs no action." }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})