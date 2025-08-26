// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shared-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Check authorization
    const sharedSecret = req.headers.get('x-shared-secret');
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');

    if (!webhookSecret || sharedSecret !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse the body
    const body = await req.json();
    const { id: event_id, title, start, end, location, syncTime } = body;

    if (!event_id || !title || !start || !end) {
        throw new Error('Missing required fields in the request body.');
    }

    // 3. Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Insert data into the table
    const { error } = await supabaseAdmin
      .from("calendar_events")
      .insert({
        event_id: event_id,
        title: title,
        start_time: start,
        end_time: end,
        location: location,
        sync_time: syncTime
      });

    if (error) {
      // Handle potential duplicate event_id gracefully
      if (error.code === '23505') { // unique_violation
        return new Response(JSON.stringify({ message: 'Event already exists, skipping.', event_id }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }

    // 5. Return success response
    return new Response(JSON.stringify({ ok: true, id: event_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})