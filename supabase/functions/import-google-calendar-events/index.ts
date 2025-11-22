import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    // 2. Get events from request body
    const { eventsToImport } = await req.json();
    if (!eventsToImport || !Array.isArray(eventsToImport) || eventsToImport.length === 0) {
      throw new Error("No events provided for import.");
    }

    // 3. Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Prepare project data from events
    const newProjectsPayload = eventsToImport.map(event => ({
      name: event.summary || 'Untitled Event',
      description: event.description,
      start_date: event.start?.dateTime || event.start?.date,
      due_date: event.end?.dateTime || event.end?.date,
      origin_event_id: event.id,
      venue: event.location,
      created_by: user.id,
      status: 'On Track', // Default status
      payment_status: 'Unpaid', // Default payment status
      category: 'Event', // Default category
    }));

    // 5. Insert new projects
    const { data: createdProjects, error: projectInsertError } = await supabaseAdmin
      .from('projects')
      .insert(newProjectsPayload)
      .select('id, created_by, origin_event_id');
      
    if (projectInsertError) {
      throw new Error(`Failed to insert projects: ${projectInsertError.message}`);
    }

    // 6. Handle attendees
    const allAttendeeEmails = [...new Set(eventsToImport.flatMap(event => event.attendees?.map((att: any) => att.email) || []).filter(Boolean))];
    const emailToIdMap = new Map<string, string>();

    if (allAttendeeEmails.length > 0) {
      const { data: attendeeProfiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .in('email', allAttendeeEmails);
      if (profileError) {
        console.warn(`Could not fetch attendee profiles:`, profileError.message);
      } else if (attendeeProfiles) {
        attendeeProfiles.forEach(p => {
          if (p.email) emailToIdMap.set(p.email, p.id);
        });
      }
    }

    const projectMemberships: { project_id: string; user_id: string; role: string }[] = [];
    if (createdProjects) {
      createdProjects.forEach(project => {
        // The creator is already added as a member with 'owner' role by a trigger, so we don't need to add them here.
        
        const originalEvent = eventsToImport.find(e => e.id === project.origin_event_id);
        if (originalEvent && originalEvent.attendees) {
          originalEvent.attendees.forEach((attendee: any) => {
            if (attendee.email && emailToIdMap.has(attendee.email)) {
              const attendeeUserId = emailToIdMap.get(attendee.email)!;
              // Don't re-add the project creator
              if (attendeeUserId !== project.created_by) {
                // Avoid duplicates if an attendee is in multiple events that create the same project (unlikely but safe)
                if (!projectMemberships.some(m => m.project_id === project.id && m.user_id === attendeeUserId)) {
                  projectMemberships.push({
                    project_id: project.id,
                    user_id: attendeeUserId,
                    role: 'member'
                  });
                }
              }
            }
          });
        }
      });
    }

    if (projectMemberships.length > 0) {
      const { error: memberInsertError } = await supabaseAdmin
        .from('project_members')
        .insert(projectMemberships);
      if (memberInsertError) {
        // Don't throw, just warn, as the main project creation was successful.
        console.warn("Failed to add some members to projects:", memberInsertError.message);
      }
    }

    return new Response(JSON.stringify({ message: `Successfully imported ${createdProjects.length} events as projects.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Import Google Calendar Events Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});