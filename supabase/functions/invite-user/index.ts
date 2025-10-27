/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const sanitizeUrl = (url: string | undefined) => {
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
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const siteUrl = Deno.env.get('SITE_URL')
    if (!siteUrl) {
      console.error("SITE_URL environment variable is not set.")
      return new Response(JSON.stringify({ error: 'Server configuration error: SITE_URL is not set.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    const redirectTo = `${sanitizeUrl(siteUrl)}/reset-password`;

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo,
      data: { role: role } // Pass role to user_metadata on invite
    })

    if (error) {
      console.error(`Error inviting user ${email}:`, error)
      if (error.message.includes('User already registered')) {
        return new Response(JSON.stringify({ message: `User ${email} is already a member.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      // Check for SMTP configuration error
      if (error.status === 500 && (error.message.includes('Unexpected failure') || error.message.includes('Error sending invite email'))) {
        return new Response(JSON.stringify({ error: 'Failed to send invite. The email service (SMTP) may not be configured in your Supabase project settings.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      // For other errors, return a proper error response.
      return new Response(JSON.stringify({ error: `Failed to invite user. Supabase error: ${error.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Unhandled error in invite-user function:', error)
    return new Response(JSON.stringify({ error: `An unexpected error occurred in the function: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})