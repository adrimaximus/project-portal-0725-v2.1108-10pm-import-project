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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
        auth: { persistSession: false }
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error("User not authenticated.");

    const payload = await req.json();
    const { title, description, icon, color, type, frequency, specific_days, target_quantity, target_period, target_value, unit, tags } = payload;

    if (!title || !icon || !color || !type) {
      throw new Error("Missing required fields: title, icon, color, and type are required.");
    }

    // Memisahkan tag yang sudah ada dan tag baru
    const existingTagIds = tags.filter(t => !t.isNew).map(t => t.id);
    const newCustomTags = tags.filter(t => t.isNew).map(({ name, color }) => ({ name, color }));

    // Memanggil fungsi RPC yang sudah diperbaiki dengan parameter yang benar
    const { data: newGoal, error: rpcError } = await supabase
      .rpc('create_goal_and_link_tags', {
        p_user_id: user.id,
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
        p_existing_tags: existingTagIds,
        p_custom_tags: newCustomTags,
      })
      .single();

    if (rpcError) throw rpcError;
    if (!newGoal || !newGoal.slug) throw new Error("Goal creation failed to return the new goal data.");

    // Mengambil objek goal lengkap untuk dikembalikan ke klien
    const { data: fullGoal, error: fetchError } = await supabase
      .rpc('get_goal_by_slug', { p_slug: newGoal.slug })
      .single();

    if (fetchError) throw fetchError;

    return new Response(JSON.stringify(fullGoal), {
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