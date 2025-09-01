// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
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
    // 1. Authenticate user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user: authUser } } = await supabaseClient.auth.getUser()
    if (!authUser) throw new Error('User not authenticated')

    // 2. Get payload from FormData
    const formData = await req.formData();
    const file = formData.get('file');
    const targetUserId = formData.get('targetUserId'); // This is the ID of the person or user profile

    if (!file || !targetUserId) {
      throw new Error('Missing file or targetUserId in FormData');
    }
    if (!(file instanceof File)) {
      throw new Error('Uploaded item is not a valid file.');
    }

    // 3. Check permissions
    const { data: authProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()
    if (profileError) throw profileError

    const isSelf = authUser.id === targetUserId
    const isAdmin = authProfile.role === 'admin' || authProfile.role === 'master admin'

    if (!isSelf && !isAdmin) {
      throw new Error('Unauthorized: You can only update your own avatar or you must be an admin.')
    }

    // 4. Upload file using admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileContent = await file.arrayBuffer();
    const mimeType = file.type;
    const fileExt = mimeType.split('/')[1];
    
    const filePath = `${targetUserId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, fileContent, {
        contentType: mimeType,
        upsert: true,
      })
    if (uploadError) throw uploadError

    // 5. Get public URL and return it
    const { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath)
    const avatar_url = `${urlData.publicUrl}?t=${new Date().getTime()}`

    return new Response(JSON.stringify({ avatar_url }), {
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