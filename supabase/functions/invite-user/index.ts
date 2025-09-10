// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const sanitizeUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('https://')) return url;
  if (url.startsWith('http://')) return url.replace('http://', 'https://');
  return `https://${url.replace(/^ttps?:\/\//, '')}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role } = await req.json()
    if (!email || !role) {
      throw new Error("Email and role are required.")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const appUrl = Deno.env.get('VITE_APP_URL') || Deno.env.get('SUPABASE_URL');
    const redirectTo = `${sanitizeUrl(appUrl)}/reset-password`;

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role: role },
      redirectTo: redirectTo
    })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})