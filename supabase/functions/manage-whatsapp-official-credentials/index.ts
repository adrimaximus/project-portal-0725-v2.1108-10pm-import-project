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

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { phoneId, businessAccountId, appId, accessToken } = await req.json()

      if (!phoneId || !accessToken) {
        throw new Error('Phone ID and Access Token are required.')
      }

      // Sanitize
      const cleanPhoneId = String(phoneId).trim();
      const cleanToken = String(accessToken).trim();
      const cleanAccountId = businessAccountId ? String(businessAccountId).trim() : null;
      const cleanAppId = appId ? String(appId).trim() : null;

      const updates = [
          { key: 'META_PHONE_ID', value: cleanPhoneId },
          { key: 'META_ACCESS_TOKEN', value: cleanToken }
      ];
      if (cleanAccountId) updates.push({ key: 'META_BUSINESS_ACCOUNT_ID', value: cleanAccountId });
      if (cleanAppId) updates.push({ key: 'META_APP_ID', value: cleanAppId });

      const { error: upsertError } = await supabaseAdmin
        .from('app_config')
        .upsert(updates, { onConflict: 'key' });

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
        .in('key', ['META_PHONE_ID', 'META_BUSINESS_ACCOUNT_ID', 'META_APP_ID', 'META_ACCESS_TOKEN']);
      
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
        .in('key', ['META_PHONE_ID', 'META_BUSINESS_ACCOUNT_ID', 'META_APP_ID', 'META_ACCESS_TOKEN']);

      if (error) throw error;

      const phoneIdObj = creds?.find(c => c.key === 'META_PHONE_ID');
      const accountIdObj = creds?.find(c => c.key === 'META_BUSINESS_ACCOUNT_ID');
      const appIdObj = creds?.find(c => c.key === 'META_APP_ID');
      const tokenObj = creds?.find(c => c.key === 'META_ACCESS_TOKEN');

      return new Response(JSON.stringify({ 
          connected: !!(phoneIdObj && tokenObj),
          phoneId: phoneIdObj?.value || '',
          businessAccountId: accountIdObj?.value || '',
          appId: appIdObj?.value || ''
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