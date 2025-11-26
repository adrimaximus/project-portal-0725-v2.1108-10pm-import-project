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
    const { name, email, projectName, description, services, date, budget, venue } = await req.json();

    if (!email || !name || !projectName) {
      throw new Error("Name, Email, and Project Name are required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Check if user exists, or create one
    const { data: existingUsers } = await supabaseAdmin.from('profiles').select('id').eq('email', email);
    let userId = existingUsers && existingUsers.length > 0 ? existingUsers[0].id : null;

    if (!userId) {
      // Create new user
      // Using a random password as they will likely use magic link or reset password later
      const password = crypto.randomUUID() + "Aa1!";
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for lead generation ease
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: name,
        },
      });

      if (createUserError) throw createUserError;
      userId = newUser.user.id;
    }

    // 2. Create Project
    const { data: newProject, error: createProjectError } = await supabaseAdmin
      .from('projects')
      .insert({
        name: projectName,
        description: description,
        created_by: userId,
        category: 'Requested Event',
        status: 'Requested',
        budget: budget,
        start_date: date?.from,
        due_date: date?.to,
        venue: venue,
      })
      .select()
      .single();

    if (createProjectError) throw createProjectError;

    // 3. Link Services
    if (services && services.length > 0) {
      const servicesToInsert = services.map((serviceTitle: string) => ({
        project_id: newProject.id,
        service_title: serviceTitle,
      }));
      await supabaseAdmin.from('project_services').insert(servicesToInsert);
    }

    // 4. Send Notification (Optional - e.g., to admin)
    // You could add logic here to notify admins about a new public request

    return new Response(JSON.stringify({ success: true, projectId: newProject.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});