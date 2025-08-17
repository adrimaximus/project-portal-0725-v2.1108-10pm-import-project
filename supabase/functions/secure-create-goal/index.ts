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
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
        auth: { persistSession: false }
      }
    )

    // 2. Dapatkan pengguna yang terotentikasi
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    if (userError || !user) throw new Error("User not authenticated.");

    // 3. Uraikan body permintaan untuk data goal
    const payload = await req.json();
    const { tags = [], ...goalData } = payload;
    const { title, icon, color, type } = goalData;

    // 4. Validasi field yang diperlukan
    if (!title || !icon || !color || !type) {
      throw new Error("Missing required fields: title, icon, color, and type are required.");
    }

    // 5. Buat klien admin Supabase untuk melakukan penyisipan
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 6. Sisipkan goal baru, dengan secara eksplisit mengatur user_id
    const { data: newGoal, error: insertError } = await supabaseAdmin
      .from('goals')
      .insert({ ...goalData, user_id: user.id })
      .select()
      .single();

    if (insertError) throw insertError;

    // 7. Tangani tag jika ada
    if (tags.length > 0) {
      const tagsToUpsert = tags.map(tag => ({
        user_id: user.id,
        name: tag.name,
        color: tag.color,
      }));
      
      await supabaseAdmin.from('tags').upsert(tagsToUpsert, { onConflict: 'user_id, name' });

      const tagNames = tags.map(t => t.name);
      const { data: relevantTags } = await supabaseAdmin
        .from('tags')
        .select('id, name')
        .eq('user_id', user.id)
        .in('name', tagNames);

      if (relevantTags && relevantTags.length > 0) {
        const goalTagsToInsert = relevantTags.map(tag => ({
          goal_id: newGoal.id,
          tag_id: tag.id,
        }));
        await supabaseAdmin.from('goal_tags').insert(goalTagsToInsert);
      }
    }

    // 8. Kembalikan goal yang baru dibuat
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