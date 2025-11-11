// @ts-nocheck
/// <reference types="https://unpkg.com/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

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

    const { data: { user: importer } } = await supabaseClient.auth.getUser();
    if (!importer) throw new Error("Unauthorized");

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

    const emailToUserIdMap = new Map<string, string>();

    if (creatorEmails.length > 0) {
      const { data: existingProfiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .in('email', creatorEmails);

      if (profileError) {
        console.warn("Could not fetch existing profiles:", profileError.message);
      } else if (existingProfiles) {
        existingProfiles.forEach(p => {
          if (p.email) {
            emailToUserIdMap.set(p.email, p.id);
          }
        });
      }

      const emailsToInvite = creatorEmails.filter(email => !emailToUserIdMap.has(email));
      
      for (const email of emailsToInvite) {
        const info = creatorInfoMap.get(email);
        const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                first_name: info?.displayName?.split(' ')[0] || '',
                last_name: info?.displayName?.split(' ').slice(1).join(' ') || '',
            }
        });

        if (inviteError) {
          console.warn(`Failed to invite user ${email}:`, inviteError.message);
        } else if (data && data.user) {
          emailToUserIdMap.set(email, data.user.id);
        }
      }
    }

    const newProjectsPayload = eventsToImport.map(event => {
      const { summary, description, start, end, id: origin_event_id, location, creator } = event;
      const startDate = start.date ? new Date(start.date).toISOString() : new Date(start.dateTime).toISOString();
      const dueDate = end.date ? new Date(end.date).toISOString() : new Date(end.dateTime).toISOString();
      
      const ownerId = creator?.email ? emailToUserIdMap.get(creator.email) : undefined;

      return {
        name: summary || 'Untitled Event',
        description: description,
        start_date: startDate,
        due_date: dueDate,
        origin_event_id: origin_event_id,
        venue: location,
        created_by: ownerId || importer.id,
        status: 'On Track',
        payment_status: 'Unpaid',
        category: 'Event',
      };
    });

    if (newProjectsPayload.length === 0) {
        return new Response(JSON.stringify({ success: true, count: 0, message: "No new projects to import." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: createdProjects, error: projectInsertError } = await supabaseAdmin
      .from('projects')
      .insert(newProjectsPayload)
      .select('id, created_by');
    
    if (projectInsertError) throw projectInsertError;

    const projectMemberships: { project_id: string; user_id: string; role: string }[] = [];
    if (createdProjects) {
      createdProjects.forEach(project => {
          if (project.created_by !== importer.id) {
              projectMemberships.push({
                  project_id: project.id,
                  user_id: importer.id,
                  role: 'admin'
              });
          }
      });
    }

    if (projectMemberships.length > 0) {
        const { error: memberInsertError } = await supabaseAdmin
            .from('project_members')
            .insert(projectMemberships);
        if (memberInsertError) {
            console.warn("Failed to add importer as project member for some projects:", memberInsertError.message);
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