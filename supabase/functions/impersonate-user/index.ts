// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Buat klien Supabase menggunakan header otorisasi pemohon untuk verifikasi
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: authUser } } = await userSupabase.auth.getUser();
    if (!authUser) throw new Error("User not authenticated.");

    // 2. Buat klien admin untuk melakukan operasi yang memerlukan hak istimewa
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Periksa izin: HANYA master admin yang dapat melakukan ini
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile || profile.role !== 'master admin') {
      throw new Error("Forbidden: You do not have permission to impersonate users.");
    }

    // 4. Dapatkan ID pengguna target dari permintaan
    const { target_user_id } = await req.json();
    if (!target_user_id) {
      throw new Error("target_user_id is required.");
    }

    // 5. Buat tautan masuk ajaib untuk pengguna target untuk mendapatkan token
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: (await supabaseAdmin.auth.admin.getUserById(target_user_id)).data.user.email,
    });
    if (linkError) throw linkError;

    const { access_token, refresh_token } = data.properties;

    // 6. Kembalikan token sesi baru
    return new Response(JSON.stringify({ access_token, refresh_token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const status = error.message.startsWith('Forbidden') ? 403 : 400;
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
});