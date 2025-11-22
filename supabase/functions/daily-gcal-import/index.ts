// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { global: { headers: { 'Accept': 'application/json' } } }
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userAgent = req.headers.get('user-agent');
    const cronHeader = req.headers.get('X-Cron-Secret');
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Allow if it's a cron job (from pg_net) OR if it has the correct secret
    const isCron = userAgent && userAgent.startsWith('pg_net');
    const isAuthorized = cronHeader && cronHeader === cronSecret;

    if (!isCron && !isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // 1. Get all Google Calendar tokens
    // Avoid complex joins to prevent 400/500 errors if foreign keys aren't perfect
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('*');

    if (tokenError) throw new Error(`Token fetch error: ${tokenError.message}`);
    
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No users with Google Calendar integration." }), { headers: corsHeaders });
    }

    // 2. Get profiles for these tokens
    const userIds = tokens.map(t => t.user_id);
    const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, google_calendar_settings')
        .in('id', userIds);

    if (profileError) throw new Error(`Profile fetch error: ${profileError.message}`);

    const profilesMap = new Map(profiles.map(p => [p.id, p]));

    let totalImported = 0;

    // 3. Get all existing event IDs to avoid duplicates
    const { data: existingProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('origin_event_id')
      .not('origin_event_id', 'is', null);
      
    if (projectsError) throw new Error(`Existing projects fetch error: ${projectsError.message}`);
    
    const existingEventIds = new Set(existingProjects.map(p => p.origin_event_id));

    for (const token of tokens) {
      const user = profilesMap.get(token.user_id);
      if (!user || !user.google_calendar_settings?.selected_calendars) {
        continue;
      }

      let { access_token, refresh_token, expiry_date } = token;

      // Refresh token if needed
      if (new Date(expiry_date) < new Date()) {
        console.log(`Access token for user ${user.id} expired, refreshing...`);
        const clientId = Deno.env.get("VITE_GOOGLE_CLIENT_ID");
        const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refresh_token,
                grant_type: 'refresh_token',
            }),
            });

            const newTokens = await response.json();
            if (newTokens.error) {
            console.error(`Error refreshing token for user ${user.id}:`, newTokens.error_description);
            // Optional: Delete invalid token to stop retrying
            // await supabaseAdmin.from('google_calendar_tokens').delete().eq('user_id', user.id);
            continue; 
            }

            access_token = newTokens.access_token;
            const newExpiryDate = new Date(new Date().getTime() + newTokens.expires_in * 1000);

            await supabaseAdmin
            .from('google_calendar_tokens')
            .update({
                access_token: access_token,
                expiry_date: newExpiryDate.toISOString(),
            })
            .eq('user_id', user.id);
        } catch (refreshErr) {
            console.error(`Exception refreshing token for user ${user.id}:`, refreshErr);
            continue;
        }
      }

      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days

      const eventsToImport = [];

      for (const calendarId of user.google_calendar_settings.selected_calendars) {
        try {
          const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`, {
            headers: { Authorization: `Bearer ${access_token}` },
          }).then(res => res.json());

          if (res.items) {
            const newEvents = res.items.filter((event: any) =>
              event.id && !existingEventIds.has(event.id) && event.status !== 'cancelled'
            );
            eventsToImport.push(...newEvents);
          }
        } catch (e) {
          console.error(`Failed to fetch events for user ${user.id} and calendar ${calendarId}:`, e.message);
        }
      }

      if (eventsToImport.length > 0) {
        const newProjectsPayload = eventsToImport.map(event => ({
          name: event.summary || 'Untitled Event',
          description: event.description,
          start_date: event.start?.dateTime || event.start?.date,
          due_date: event.end?.dateTime || event.end?.date,
          origin_event_id: event.id,
          venue: event.location,
          created_by: user.id,
          status: 'On Track',
          payment_status: 'Unpaid',
          category: 'Event',
        }));

        const { data: createdProjects, error: projectInsertError } = await supabaseAdmin
          .from('projects')
          .insert(newProjectsPayload)
          .select('id, created_by, origin_event_id');
        
        if (projectInsertError) {
          console.error(`Failed to import projects for user ${user.id}:`, projectInsertError.message);
          continue;
        }

        // Handle Attendees
        const allAttendeeEmails = [...new Set(eventsToImport.flatMap(event => event.attendees?.map((att: any) => att.email) || []).filter(Boolean))];
        const emailToIdMap = new Map<string, string>();

        if (allAttendeeEmails.length > 0) {
          const { data: attendeeProfiles } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .in('email', allAttendeeEmails);
            
          if (attendeeProfiles) {
            attendeeProfiles.forEach(p => {
              if (p.email) emailToIdMap.set(p.email, p.id);
            });
          }
        }

        const projectMemberships: { project_id: string; user_id: string; role: string }[] = [];
        if (createdProjects) {
          createdProjects.forEach(project => {
            // Ensure creator is added as owner if trigger failed (redundancy)
            if (project.created_by !== user.id) {
                 // Logic mismatch? created_by IS user.id above.
                 // But if we support shared calendars later, this might change.
                 // For now, creator is owner.
            }

            const originalEvent = eventsToImport.find(e => e.id === project.origin_event_id);
            if (originalEvent && originalEvent.attendees) {
              originalEvent.attendees.forEach((attendee: any) => {
                if (attendee.email && emailToIdMap.has(attendee.email)) {
                  const attendeeUserId = emailToIdMap.get(attendee.email)!;
                  if (attendeeUserId !== project.created_by && attendeeUserId !== user.id) {
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
          await supabaseAdmin.from('project_members').insert(projectMemberships).catch(e => console.error("Member insert error:", e));
        }

        totalImported += newProjectsPayload.length;
      }
    }

    return new Response(JSON.stringify({ message: `Daily import complete. Imported ${totalImported} new events as projects.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Daily GCal Import Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});