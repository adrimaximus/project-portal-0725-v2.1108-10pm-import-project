// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");
    const jwt = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) throw new Error(`User not authenticated: ${userError?.message || 'Auth session missing!'}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || !['admin', 'master admin'].includes(profile.role)) {
        throw new Error("You do not have permission to perform this action.");
      }
      const { apiKey } = await req.json();
      if (!apiKey) throw new Error("API key is required.");

      const { error } = await supabaseAdmin.from('app_config').upsert({ key: 'OPENAI_API_KEY', value: apiKey });
      if (error) throw error;
      return new Response(JSON.stringify({ message: "API key saved successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || !['admin', 'master admin'].includes(profile.role)) {
        throw new Error("You do not have permission to perform this action.");
      }
      const { error } = await supabaseAdmin.from('app_config').delete().eq('key', 'OPENAI_API_KEY');
      if (error) throw error;
      return new Response(JSON.stringify({ message: "API key deleted successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin.from('app_config').select('key').eq('key', 'OPENAI_API_KEY').maybeSingle();
        if (error) throw error;
        return new Response(JSON.stringify({ connected: !!data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});