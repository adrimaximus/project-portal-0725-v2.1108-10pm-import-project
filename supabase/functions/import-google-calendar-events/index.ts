// @ts-nocheck
/// <reference types="https://unpkg.com/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { subDays, endOfDay } from 'npm:date-fns';
import { zonedTimeToUtc } from 'npm:date-fns-tz';

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
    if (!eventsToImport || !Array.isArray(eventsToImport)) {
      throw new Error("Invalid request body: eventsToImport is required and must be an array.");
    }

    const timeZone = 'Asia/Jakarta';

    const newProjects = eventsToImport.map(event => {
      const { summary, description, start, end, id: origin_event_id, location } = event;

      let startDate, dueDate;

      if (start.date) { // All-day event
        const startDateObj = zonedTimeToUtc(`${start.date}T00:00:00`, timeZone);
        
        const endDateExclusive = new Date(end.date);
        const endDateInclusive = subDays(endDateExclusive, 1);
        
        const dueDateObj = zonedTimeToUtc(endOfDay(endDateInclusive), timeZone);

        startDate = startDateObj.toISOString();
        dueDate = dueDateObj.toISOString();
      } else { // Timed event
        startDate = new Date(start.dateTime).toISOString();
        dueDate = new Date(end.dateTime).toISOString();
      }

      return {
        name: summary || 'Untitled Event',
        description: description,
        start_date: startDate,
        due_date: dueDate,
        origin_event_id: origin_event_id,
        venue: location,
        created_by: user.id,
        status: 'On Track',
        payment_status: 'Unpaid',
        category: 'Event',
      };
    });

    if (newProjects.length > 0) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const { error } = await supabaseAdmin.from('projects').insert(newProjects);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true, count: newProjects.length }), {
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