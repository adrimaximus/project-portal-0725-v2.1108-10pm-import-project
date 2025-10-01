// @ts-nocheck
/// <reference types="https://unpkg.com/@supabase/functions-js@2/src/edge-runtime.d.ts" />

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
    if (!eventsToImport || !Array.isArray(eventsToImport)) {
      throw new Error("Invalid request body: eventsToImport is required and must be an array.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const creatorEmails = [...new Set(eventsToImport.map(event => event.creator?.email).filter(Boolean))];
    const creatorInfoMap = new Map(eventsToImport
      .map(event => event.creator ? [event.creator.email, { displayName: event.creator.displayName || event.creator.email.split('@')[0] }] : null)
      .filter(Boolean)
    );

    let emailToUserIdMap = new Map<string, string>();
    let emailToPersonIdMap = new Map<string, string>();

    if (creatorEmails.length > 0) {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, email').in('email', creatorEmails);
      if (profiles) profiles.forEach(p => p.email && emailToUserIdMap.set(p.email, p.id));

      const { data: people } = await supabaseAdmin.from('people').select('id, email').in('email', creatorEmails);
      if (people) people.forEach(p => p.email && emailToPersonIdMap.set(p.email, p.id));
    }

    const newPeopleToCreate: any[] = [];
    creatorEmails.forEach(email => {
      if (!emailToUserIdMap.has(email) && !emailToPersonIdMap.has(email)) {
        const info = creatorInfoMap.get(email);
        newPeopleToCreate.push({
          full_name: info?.displayName || email.split('@')[0],
          email: email,
          contact: { emails: [email] },
          user_id: user.id,
        });
      }
    });

    if (newPeopleToCreate.length > 0) {
      const { data: newPeople, error: insertPeopleError } = await supabaseAdmin
        .from('people')
        .insert(newPeopleToCreate)
        .select('id, email');
      if (insertPeopleError) throw new Error(`Failed to create new contacts: ${insertPeopleError.message}`);
      if (newPeople) newPeople.forEach(p => p.email && emailToPersonIdMap.set(p.email, p.id));
    }

    const newProjectsPayload = eventsToImport.map(event => {
      const { summary, description, start, end, id: origin_event_id, location, creator } = event;
      const startDate = start.date ? new Date(start.date).toISOString() : new Date(start.dateTime).toISOString();
      const dueDate = end.date ? new Date(end.date).toISOString() : new Date(end.dateTime).toISOString();
      
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
        _creatorEmail: creator?.email,
      };
    });

    if (newProjectsPayload.length === 0) {
        return new Response(JSON.stringify({ success: true, count: 0, message: "No new projects to import." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: createdProjects, error: projectInsertError } = await supabaseAdmin
      .from('projects')
      .insert(newProjectsPayload.map(({ _creatorEmail, ...rest }) => rest))
      .select('id, origin_event_id');
    
    if (projectInsertError) throw projectInsertError;

    const peopleProjectsLinks: { person_id: string; project_id: string }[] = [];
    createdProjects.forEach(project => {
      const originalPayload = newProjectsPayload.find(p => p.origin_event_id === project.origin_event_id);
      if (originalPayload?._creatorEmail) {
        const personId = emailToPersonIdMap.get(originalPayload._creatorEmail);
        if (personId) {
          peopleProjectsLinks.push({
            person_id: personId,
            project_id: project.id,
          });
        }
      }
    });

    if (peopleProjectsLinks.length > 0) {
      const { error: linkError } = await supabaseAdmin
        .from('people_projects')
        .insert(peopleProjectsLinks);
      if (linkError) {
        console.warn("Failed to link some projects to contacts:", linkError.message);
      }
    }

    return new Response(JSON.stringify({ success: true, count: newProjectsPayload.length }), {
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