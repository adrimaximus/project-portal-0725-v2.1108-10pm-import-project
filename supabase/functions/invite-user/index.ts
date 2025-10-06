import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Diperlukan jika Anda memanggil fungsi dari browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
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

    // Sangat penting untuk menyediakan URL redirectTo untuk tautan undangan.
    // URL ini harus mengarah ke halaman di aplikasi Anda yang menangani konfirmasi pengguna.
    const siteUrl = Deno.env.get('SITE_URL')
    if (!siteUrl) {
      console.error("SITE_URL environment variable is not set.")
      return new Response(JSON.stringify({ error: 'Server configuration error: SITE_URL is not set.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    const redirectTo = `${siteUrl}/set-password`;

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo,
    })

    if (error) {
      console.error(`Error inviting user ${email}:`, error)
      // Mengembalikan pesan error yang lebih spesifik ke klien
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