// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: authUser } } = await userSupabase.auth.getUser();
    if (!authUser) throw new Error("User not authenticated.");

    // 2. Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Check permissions: ONLY master admins can do this
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'master admin') {
      throw new Error("Forbidden: You do not have permission to impersonate users.");
    }

    // 4. Get target user ID from the request
    const { target_user_id } = await req.json();
    if (!target_user_id) {
      throw new Error("target_user_id is required.");
    }

    // 5. Get target user's email safely
    const { data: targetUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(target_user_id);
    
    if (getUserError) {
      throw new Error(`Could not find target user: ${getUserError.message}`);
    }
    if (!targetUserData || !targetUserData.user || !targetUserData.user.email) {
      throw new Error(`Target user with ID ${target_user_id} does not exist or has no email.`);
    }
    const targetEmail = targetUserData.user.email;

    // 6. Generate magic link for the target user to get tokens
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
    });
    if (linkError) {
      throw new Error(`Could not generate impersonation link: ${linkError.message}`);
    }
    if (!linkData || !linkData.properties || !linkData.properties.access_token) {
        throw new Error('Failed to generate session properties for impersonation.');
    }

    const { access_token, refresh_token } = linkData.properties;

    // 7. Return the new session tokens
    return new Response(JSON.stringify({ access_token, refresh_token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const status = error.message.startsWith('Forbidden') ? 403 : 400;
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
});