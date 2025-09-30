/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { eventsToImport } = await req.json();
    if (!Array.isArray(eventsToImport) || eventsToImport.length === 0) {
      throw new Error("No events to import provided.");
    }

    const projectsToInsert = eventsToImport.map(event => ({
      name: event.summary || 'Untitled Event',
      description: event.description,
      start_date: event.start?.dateTime || event.start?.date,
      due_date: event.end?.dateTime || event.end?.date,
      venue: event.location,
      origin_event_id: event.id,
      created_by: user.id,
      status: 'Not Started',
      payment_status: 'Unpaid',
      category: 'Event',
    }));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseAdmin.from('projects').insert(projectsToInsert);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, count: projectsToInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});