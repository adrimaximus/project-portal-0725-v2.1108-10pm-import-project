// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Please use POST.');
    }

    const url = new URL(req.url);
    const providedSecret = url.searchParams.get('secret');
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');

    if (!expectedSecret || providedSecret !== expectedSecret) {
      throw new Error('Unauthorized. Invalid or missing secret.');
    }

    const {
      name,
      description,
      budget,
      startDate,
      dueDate,
      clientEmail,
      category = 'Webhook Event',
      status = 'Requested'
    } = await req.json();

    if (!name || !clientEmail) {
      throw new Error('Missing required fields: name and clientEmail are required.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: clientProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', clientEmail)
      .maybeSingle();

    if (profileError) throw new Error(`Database error finding profile: ${profileError.message}`);

    if (!clientProfile) {
      throw new Error(`Client with email "${clientEmail}" not found.`);
    }

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

    return new Response(JSON.stringify({
      message: 'Project created successfully',
      project: newProject
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Webhook Error:', error.message);
    const status = error.message.includes('Unauthorized') ? 401 : 400;
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
})