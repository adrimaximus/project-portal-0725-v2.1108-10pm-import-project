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

    // Use the RPC function that accepts a JSON object for tags
    const { data: newGoalId, error: rpcError } = await supabase
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
        p_tags: tags, // Pass the array of tag objects directly
      })
      .single();

    if (rpcError) throw rpcError;

    // Fetch the full goal object to return to the client
    const { data: newGoal, error: fetchError } = await supabase
      .rpc('get_goal_by_slug', { p_slug: (await supabase.from('goals').select('slug').eq('id', newGoalId).single()).data.slug })
      .single();

    if (fetchError) throw fetchError;

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