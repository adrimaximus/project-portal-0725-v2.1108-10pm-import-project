// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Buat klien Supabase dengan token otentikasi pengguna
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
        auth: { persistSession: false }
      }
    )

    // 2. Dapatkan pengguna yang terotentikasi untuk memastikan panggilan diotorisasi
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error("User not authenticated.");

    // 3. Uraikan body permintaan untuk data goal
    const payload = await req.json();
    const { title, description, icon, color, type, frequency, specific_days, target_quantity, target_period, target_value, unit, tags } = payload;

    // 4. Validasi field yang diperlukan
    if (!title || !icon || !color || !type) {
      throw new Error("Missing required fields: title, icon, color, and type are required.");
    }

    // 5. Panggil fungsi RPC untuk membuat goal dan tag-nya secara atomik
    const { data: newGoal, error: rpcError } = await supabase
      .rpc('create_goal_with_tags', {
        p_title: title,
        p_description: description,
        p_icon: icon,
        p_color: color,
        p_type: type,
        p_frequency: frequency,
        p_specific_days: specific_days,
        p_target_quantity: target_quantity,
        p_target_period: target_period,
        p_target_value: target_value,
        p_unit: unit,
        p_tags: tags,
      })
      .single();

    if (rpcError) throw rpcError;

    // 6. Kembalikan goal yang baru dibuat
    return new Response(JSON.stringify(newGoal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})