// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Check for POST method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Please use POST.');
    }

    // 2. Check for secret key
    const url = new URL(req.url);
    const providedSecret = url.searchParams.get('secret');
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');

    if (!expectedSecret || providedSecret !== expectedSecret) {
      throw new Error('Unauthorized. Invalid or missing secret.');
    }

    // 3. Parse and validate the incoming JSON payload
    const {
      name,
      description,
      budget,
      startDate,
      dueDate,
      clientEmail,
      category = 'Webhook Event', // Default category
      status = 'Requested' // Default status
    } = await req.json();

    if (!name || !clientEmail) {
      throw new Error('Missing required fields: name and clientEmail are required.');
    }

    // 4. Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 5. Find the user ID for the client's email
    const { data: clientProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', clientEmail)
      .single();

    if (profileError || !clientProfile) {
      throw new Error(`Client with email "${clientEmail}" not found.`);
    }

    // 6. Insert the new project into the database
    const projectData = {
      name,
      description,
      budget,
      start_date: startDate,
      due_date: dueDate,
      category,
      status,
      created_by: clientProfile.id,
    };

    const { data: newProject, error: insertError } = await supabaseAdmin
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 7. Return a success response
    return new Response(JSON.stringify({
      message: 'Project created successfully',
      project: newProject
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201, // 201 Created
    });

  } catch (error) {
    console.error('Webhook Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message.includes('Unauthorized') ? 401 : 400,
    });
  }
})