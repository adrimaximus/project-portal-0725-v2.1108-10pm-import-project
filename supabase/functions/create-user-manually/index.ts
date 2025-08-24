// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // 1. Dapatkan data dari permintaan
    const { email, password, first_name, last_name, role } = await req.json()
    if (!email || !password || !role) {
      throw { status: 400, message: "Email, password, dan peran diperlukan." };
    }

    // 2. Periksa variabel lingkungan
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        throw { status: 500, message: "Kesalahan konfigurasi server: Kredensial Supabase hilang." };
    }

    // 3. Buat klien Admin Supabase
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 4. Buat pengguna
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Konfirmasi email secara otomatis
      user_metadata: {
        first_name: first_name,
        last_name: last_name,
      },
      app_metadata: {
        role: role,
      }
    })

    if (error) {
      // Periksa kesalahan umum yang spesifik
      if (error.message.includes('User already registered')) {
        throw { status: 409, message: `Pengguna dengan email ${email} sudah ada.` };
      }
      if (error.message.includes('Password should be at least 6 characters')) {
        throw { status: 400, message: 'Password terlalu pendek. Harus terdiri dari minimal 6 karakter.' };
      }
      // Lemparkan kesalahan asli untuk kasus lain
      throw { status: 500, message: error.message };
    }

    // Trigger handle_new_user akan secara otomatis membuat profil.

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Kesalahan fungsi buat pengguna:", error);
    const status = error.status || 400;
    const message = error.message || "Terjadi kesalahan tak terduga.";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    })
  }
})