// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};

const validateCredentials = async (apiKey, senderEmail, fromName) => {
  if (!apiKey || !senderEmail || !fromName) {
    throw new Error("Invalid credentials format.");
  }
  
  try {
    const response = await fetch("https://api.emailit.io/v1/send", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: { email: senderEmail, name: fromName },
        to: [{ email: 'test@example.com' }], // Dummy email for validation
        subject: 'Validation',
        text: 'Validation',
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    // EmailIt returns 401 for bad API key. It might return other errors for bad sender, etc.
    // A 400 for "to.0.email" is invalid means the API key is likely correct.
    if (response.status === 401) {
      throw new Error(responseData.message || "The provided EmailIt API key is invalid.");
    }

    if (response.ok || response.status === 400) {
        return true;
    }

    throw new Error(`EmailIt API returned an unexpected status: ${response.status}. ${responseData.message || ''}`);

  } catch (error) {
    console.error("EmailIt API validation failed:", error.message);
    if (error.message.includes("invalid")) {
        throw error;
    }
    throw new Error("Could not connect to EmailIt to validate credentials.");
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
      const { apiKey, senderEmail, fromName } = await req.json();
      if (!apiKey || !senderEmail || !fromName) throw new Error("API Key, Sender Email, and From Name are required.");

      await validateCredentials(apiKey, senderEmail, fromName);

      const { error: upsertError } = await supabaseAdmin.from('app_config').upsert([
        { key: 'EMAILIT_API_KEY', value: apiKey },
        { key: 'EMAILIT_SENDER', value: senderEmail },
        { key: 'EMAILIT_FROM_NAME', value: fromName },
      ]);
      if (upsertError) throw upsertError;
      
      return new Response(JSON.stringify({ message: "EmailIt credentials saved successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      await checkAdminPermissions();
      const { error } = await supabaseAdmin.from('app_config').delete().in('key', ['EMAILIT_API_KEY', 'EMAILIT_SENDER', 'EMAILIT_FROM_NAME']);
      if (error) throw error;

      return new Response(JSON.stringify({ message: "EmailIt credentials deleted successfully." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin.from('app_config').select('key, value').in('key', ['EMAILIT_API_KEY', 'EMAILIT_SENDER', 'EMAILIT_FROM_NAME']);
        if (error) throw error;
        
        const config = (data || []).reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
        
        if (config.EMAILIT_API_KEY && config.EMAILIT_SENDER && config.EMAILIT_FROM_NAME) {
            try {
                await validateCredentials(config.EMAILIT_API_KEY, config.EMAILIT_SENDER, config.EMAILIT_FROM_NAME);
                return new Response(JSON.stringify({ connected: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (validationError) {
                console.warn("Stored EmailIt credentials are no longer valid:", validationError.message);
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