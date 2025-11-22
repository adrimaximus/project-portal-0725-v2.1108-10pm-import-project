// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};

const validateApiKey = async (apiKey) => {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error("Invalid API key format.");
  }
  try {
    const openai = new OpenAI({ apiKey });
    // A lightweight request to validate the key
    await openai.models.list();
    return true;
  } catch (error) {
    console.error("OpenAI API key validation failed:", error.message);
    // Handle specific error status if available
    if (error.status === 401) {
        throw new Error("The provided OpenAI API key is invalid or has been revoked.");
    }
    // Generic fallback
    throw new Error("Could not validate the API key with OpenAI. Please check the key and your OpenAI account status.");
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        // If no auth header is present, return 401 immediately
        throw new Error("Missing Authorization header.");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

      await validateApiKey(apiKey);

      const { error } = await supabaseAdmin.from('app_config').upsert({ key: 'OPENAI_API_KEY', value: apiKey });
      if (error) throw error;
      return new Response(JSON.stringify({ message: "API key saved and validated successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      await checkAdminPermissions();
      const { error } = await supabaseAdmin.from('app_config').delete().eq('key', 'OPENAI_API_KEY');
      if (error) throw error;
      return new Response(JSON.stringify({ message: "API key deleted successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin.from('app_config').select('value').eq('key', 'OPENAI_API_KEY').maybeSingle();
        if (error) throw error;
        
        if (data && data.value) {
            try {
                await validateApiKey(data.value);
                return new Response(JSON.stringify({ connected: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (validationError) {
                console.warn("Stored OpenAI key is no longer valid:", validationError.message);
                return new Response(JSON.stringify({ connected: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        } else {
            return new Response(JSON.stringify({ connected: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});