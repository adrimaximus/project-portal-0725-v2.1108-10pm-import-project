// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Moved permission check inside methods that require it
    const checkAdminPermissions = async () => {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || !['admin', 'master admin'].includes(profile.role)) {
        throw new Error("You do not have permission to perform this action.");
      }
    };

    if (req.method === 'POST') {
      await checkAdminPermissions();
      const { apiKey } = await req.json();
      if (!apiKey || apiKey.trim() === '') throw new Error("A valid API key is required.");

      const { error } = await supabaseAdmin.from('app_config').upsert({ key: 'OPENAI_API_KEY', value: apiKey });
      if (error) throw error;
      return new Response(JSON.stringify({ message: "API key saved successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      await checkAdminPermissions();
      const { error } = await supabaseAdmin.from('app_config').delete().eq('key', 'OPENAI_API_KEY');
      if (error) throw error;
      return new Response(JSON.stringify({ message: "API key deleted successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (req.method === 'GET') {
        // This part is now accessible to all authenticated users
        const { data, error } = await supabaseAdmin.from('app_config').select('value').eq('key', 'OPENAI_API_KEY').maybeSingle();
        if (error) throw error;
        return new Response(JSON.stringify({ connected: !!data && !!data.value }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});