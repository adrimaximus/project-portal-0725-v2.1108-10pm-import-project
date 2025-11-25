// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not found')

    // Check admin permissions
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'master admin'].includes(profile.role)) {
        throw new Error("Unauthorized");
    }

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { phoneId, businessAccountId, accessToken } = await req.json()

      if (!phoneId || !accessToken) {
        throw new Error('Phone ID and Access Token are required.')
      }

      // Trim inputs to avoid whitespace issues
      const cleanPhoneId = String(phoneId).trim();
      const cleanToken = String(accessToken).trim();
      const cleanAccountId = businessAccountId ? String(businessAccountId).trim() : null;

      const upserts = [
          { key: 'META_PHONE_ID', value: cleanPhoneId },
          { key: 'META_ACCESS_TOKEN', value: cleanToken }
      ];
      
      if (cleanAccountId) {
          upserts.push({ key: 'META_BUSINESS_ACCOUNT_ID', value: cleanAccountId });
      }

      const { error: upsertError } = await supabaseAdmin
        .from('app_config')
        .upsert(upserts, { onConflict: 'key' });

      if (upsertError) throw upsertError

      return new Response(JSON.stringify({ connected: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin
        .from('app_config')
        .delete()
        .in('key', ['META_PHONE_ID', 'META_ACCESS_TOKEN', 'META_BUSINESS_ACCOUNT_ID']);
      
      if (error) throw error

      return new Response(JSON.stringify({ connected: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (req.method === 'GET') {
      const { data: creds, error } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', ['META_PHONE_ID', 'META_ACCESS_TOKEN', 'META_BUSINESS_ACCOUNT_ID']);

      if (error) throw error;

      const hasPhoneId = creds?.some(c => c.key === 'META_PHONE_ID');
      const hasToken = creds?.some(c => c.key === 'META_ACCESS_TOKEN');
      const businessId = creds?.find(c => c.key === 'META_BUSINESS_ACCOUNT_ID')?.value || '';
      const phoneId = creds?.find(c => c.key === 'META_PHONE_ID')?.value || '';

      return new Response(JSON.stringify({ 
          connected: hasPhoneId && hasToken,
          businessAccountId: businessId,
          phoneId: phoneId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})