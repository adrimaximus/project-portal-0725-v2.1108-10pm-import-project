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
    // 1. Authenticate user (the importer)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
    if (!currentUser) throw new Error("User not authenticated.");

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

    // 4. PREPARE EMAILS: Collect creator emails AND attendee emails to look them up
    const creatorEmails = eventsToImport.map((e: any) => e.creator?.email).filter(Boolean);
    const attendeeEmails = eventsToImport.flatMap((e: any) => e.attendees?.map((a: any) => a.email) || []).filter(Boolean);
    const allEmailsToCheck = [...new Set([...creatorEmails, ...attendeeEmails])];

    const emailToIdMap = new Map<string, string>();

    // 5. FETCH USERS: Find IDs for all involved emails
    if (allEmailsToCheck.length > 0) {
        // Fetch in batches if necessary, but for typical calendar usage 1 query is usually fine
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .in('email', allEmailsToCheck);
        
        if (profiles) {
            profiles.forEach((p: any) => {
                if (p.email) emailToIdMap.set(p.email.toLowerCase(), p.id);
            });
        }
    }

    // 6. Prepare project data
    const newProjectsPayload = eventsToImport.map((event: any) => {
        const creatorEmail = event.creator?.email?.toLowerCase();
        
        // LOGIC UTAMA:
        // Cek apakah creator event ini ada di database kita?
        // Jika ada, jadikan dia Owner.
        // Jika tidak ada, jadikan "currentUser" (yang melakukan import) sebagai Owner.
        let projectOwnerId = currentUser.id;
        
        if (creatorEmail && emailToIdMap.has(creatorEmail)) {
            projectOwnerId = emailToIdMap.get(creatorEmail)!;
        }

        return {
            name: event.summary || 'Untitled Event',
            description: event.description,
            start_date: event.start?.dateTime || event.start?.date,
            due_date: event.end?.dateTime || event.end?.date,
            origin_event_id: event.id,
            venue: event.location,
            created_by: projectOwnerId, // Set owner yang benar
            status: 'On Track',
            payment_status: 'Unpaid',
            category: 'Event',
        };
    });

    // 7. Insert new projects
    const { data: createdProjects, error: projectInsertError } = await supabaseAdmin
      .from('projects')
      .insert(newProjectsPayload)
      .select('id, created_by, origin_event_id');
      
    if (projectInsertError) {
      throw new Error(`Failed to insert projects: ${projectInsertError.message}`);
    }

    // 8. Handle members (Attendees)
    const projectMemberships: { project_id: string; user_id: string; role: string }[] = [];
    
    if (createdProjects) {
      createdProjects.forEach((project: any) => {
        const originalEvent = eventsToImport.find((e: any) => e.id === project.origin_event_id);
        
        if (originalEvent && originalEvent.attendees) {
          originalEvent.attendees.forEach((attendee: any) => {
            if (attendee.email) {
                const email = attendee.email.toLowerCase();
                if (emailToIdMap.has(email)) {
                    const userId = emailToIdMap.get(email)!;
                    
                    // Jangan tambahkan Owner sebagai Member (karena Owner sudah otomatis punya akses)
                    // Dan hindari duplikasi
                    if (userId !== project.created_by) {
                         projectMemberships.push({
                            project_id: project.id,
                            user_id: userId,
                            role: 'member'
                        });
                    }
                }
            }
          });
        }
        
        // Tambahan: Jika Project Owner BUKAN orang yang melakukan Import,
        // Maka orang yang melakukan Import harus ditambahkan sebagai ADMIN atau MEMBER agar bisa melihat projectnya.
        // (Tergantung kebijakan, biasanya Admin/Editor). Kita set 'admin' agar aman.
        if (project.created_by !== currentUser.id) {
            projectMemberships.push({
                project_id: project.id,
                user_id: currentUser.id,
                role: 'admin' 
            });
        }
      });
    }

    // Remove duplicates from membership array (same user in same project)
    const uniqueMemberships = projectMemberships.filter((value, index, self) =>
        index === self.findIndex((t) => (
            t.project_id === value.project_id && t.user_id === value.user_id
        ))
    );

    if (uniqueMemberships.length > 0) {
      const { error: memberInsertError } = await supabaseAdmin
        .from('project_members')
        .insert(uniqueMemberships);
        
      if (memberInsertError) {
        console.warn("Failed to add some members to projects:", memberInsertError.message);
      }
    }

    return new Response(JSON.stringify({ message: `Successfully imported ${createdProjects.length} events as projects.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error("Import Google Calendar Events Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});