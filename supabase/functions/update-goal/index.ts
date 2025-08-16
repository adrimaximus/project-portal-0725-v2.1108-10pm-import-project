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
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
        auth: { persistSession: false }
      }
    )

    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    if (userError || !user) throw new Error("User not authenticated.");

    const { goalId, tags = [], ...goalData } = await req.json();
    if (!goalId) throw new Error("Goal ID is required.");

    const { data: goalOwner, error: accessError } = await userSupabase
      .from('goals')
      .select('user_id')
      .eq('id', goalId)
      .single();

    if (accessError || !goalOwner || goalOwner.user_id !== user.id) {
        throw new Error("You do not have permission to edit this goal.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: updatedGoal, error: updateError } = await supabaseAdmin
      .from('goals')
      .update(goalData)
      .eq('id', goalId)
      .select()
      .single();
    
    if (updateError) throw updateError;

    if (tags.length > 0) {
        const tagsToUpsert = tags.map(tag => ({
            user_id: user.id,
            name: tag.name,
            color: tag.color,
        }));
        await supabaseAdmin.from('tags').upsert(tagsToUpsert, { onConflict: 'user_id, name' });
    }

    const tagNames = tags.map(t => t.name);
    const { data: relevantTags } = await supabaseAdmin
        .from('tags')
        .select('id')
        .eq('user_id', user.id)
        .in('name', tagNames);
    
    const newTagIds = relevantTags ? relevantTags.map(t => t.id) : [];

    await supabaseAdmin.from('goal_tags').delete().eq('goal_id', goalId);

    if (newTagIds.length > 0) {
        const goalTagsToInsert = newTagIds.map(tagId => ({
            goal_id: goalId,
            tag_id: tagId,
        }));
        await supabaseAdmin.from('goal_tags').insert(goalTagsToInsert);
    }

    return new Response(JSON.stringify(updatedGoal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Update goal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})