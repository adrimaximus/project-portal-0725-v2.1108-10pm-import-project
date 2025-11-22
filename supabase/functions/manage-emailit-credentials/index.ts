// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};

const validateApiKey = async (apiKey: string) => {
  if (!apiKey) {
    throw new Error("Invalid API key format.");
  }
  try {
    // A lightweight request to a non-existent endpoint to validate the key.
    // A valid key will return 404 Not Found, an invalid key will return 401 Unauthorized.
    const response = await fetch("https://api.emailit.com/v1/validate-key-test", {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.status === 401) {
      throw new Error("The provided Emailit API key is invalid.");
    }
    
    // Any other status (like 404) means the key is likely valid.
    return true;
  } catch (error) {
    console.error("Emailit API key validation failed:", error.message);
    if (error.message.includes("invalid")) {
        throw error;
    }
    throw new Error("Could not connect to Emailit to validate credentials.");
  }
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

    const checkAdminPermissions = async () => {
      // Use maybeSingle to prevent 500 errors if profile is missing
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!profile || !['admin', 'master admin'].includes(profile.role)) {
        throw new Error("You do not have permission to perform this action.");
      }
    };

    if (req.method === 'POST') {
      await checkAdminPermissions();
      const { apiKey } = await req.json();
      if (!apiKey || apiKey.trim() === '') throw new Error("A valid API key is required.");

      await validateApiKey(apiKey);

      const { error } = await supabaseAdmin.from('app_config').upsert({ key: 'EMAILIT_API_KEY', value: apiKey });
      if (error) throw error;
      return new Response(JSON.stringify({ message: "API key saved and validated successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      await checkAdminPermissions();
      const { error } = await supabaseAdmin.from('app_config').delete().eq('key', 'EMAILIT_API_KEY');
      if (error) throw error;
      return new Response(JSON.stringify({ message: "API key deleted successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin.from('app_config').select('value').eq('key', 'EMAILIT_API_KEY').maybeSingle();
        if (error) throw error;
        
        if (data && data.value) {
            try {
                await validateApiKey(data.value);
                return new Response(JSON.stringify({ connected: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (validationError) {
                console.warn("Stored Emailit key is no longer valid:", validationError.message);
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