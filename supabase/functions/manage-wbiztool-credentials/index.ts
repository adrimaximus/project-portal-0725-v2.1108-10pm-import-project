// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};

const validateCredentials = async (clientId, apiKey) => {
  if (!clientId || !apiKey) {
    throw new Error("Invalid credentials format.");
  }
  
  const whatsappClientIdStr = Deno.env.get('WBIZTOOL_WHATSAPP_CLIENT_ID');
  if (!whatsappClientIdStr) {
    throw new Error("WBIZTOOL WhatsApp Client ID is not configured on the server for validation.");
  }
  const whatsappClientId = parseInt(whatsappClientIdStr, 10);

  try {
    const response = await fetch("https://wbiztool.com/api/v1/send_msg/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId,
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        client_id: parseInt(clientId, 10),
        api_key: apiKey,
        whatsapp_client: whatsappClientId,
      }),
    });

    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "The provided WBIZTOOL credentials are invalid.");
    }

    if (response.status === 400) {
        return true;
    }

    if (response.ok) {
        return true;
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(`WBIZTOOL API returned an unexpected status: ${response.status}. ${errorData.message || ''}`);

  } catch (error) {
    console.error("WBIZTOOL API validation failed:", error.message);
    if (error.message.includes("invalid")) {
        throw error;
    }
    throw new Error("Could not connect to WBIZTOOL to validate credentials. Please check your network and try again.");
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
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || !['admin', 'master admin'].includes(profile.role)) {
        throw new Error("You do not have permission to perform this action.");
      }
    };

    if (req.method === 'POST') {
      await checkAdminPermissions();
      const { clientId, apiKey } = await req.json();
      if (!clientId || !apiKey) throw new Error("Client ID and API Key are required.");

      await validateCredentials(clientId, apiKey);

      const { error: clientError } = await supabaseAdmin.from('app_config').upsert({ key: 'WBIZTOOL_CLIENT_ID', value: clientId });
      if (clientError) throw clientError;
      
      const { error: keyError } = await supabaseAdmin.from('app_config').upsert({ key: 'WBIZTOOL_API_KEY', value: apiKey });
      if (keyError) throw keyError;

      return new Response(JSON.stringify({ message: "WBIZTOOL credentials saved successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      await checkAdminPermissions();
      const { error: clientError } = await supabaseAdmin.from('app_config').delete().eq('key', 'WBIZTOOL_CLIENT_ID');
      if (clientError) throw clientError;
      const { error: keyError } = await supabaseAdmin.from('app_config').delete().eq('key', 'WBIZTOOL_API_KEY');
      if (keyError) throw keyError;

      return new Response(JSON.stringify({ message: "WBIZTOOL credentials deleted successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (req.method === 'GET') {
        const { data: clientData, error: clientError } = await supabaseAdmin.from('app_config').select('value').eq('key', 'WBIZTOOL_CLIENT_ID').maybeSingle();
        if (clientError) throw clientError;
        
        const { data: keyData, error: keyError } = await supabaseAdmin.from('app_config').select('value').eq('key', 'WBIZTOOL_API_KEY').maybeSingle();
        if (keyError) throw keyError;
        
        if (clientData?.value && keyData?.value) {
            try {
                await validateCredentials(clientData.value, keyData.value);
                return new Response(JSON.stringify({ connected: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (validationError) {
                console.warn("Stored WBIZTOOL credentials are no longer valid:", validationError.message);
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