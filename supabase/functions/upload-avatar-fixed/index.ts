// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from "https://deno.land/std@0.203.0/encoding/base64.ts";

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

    // 2. Get payload
    const { file, targetUserId } = await req.json()
    if (!file || !targetUserId) {
      throw new Error('Missing file or targetUserId')
    }
    
    if (typeof file !== 'string') {
      throw new Error(`File data must be a base64 string. Received type: ${typeof file}`);
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
      throw new Error('Unauthorized: You can only update your own avatar.')
    }

    // 4. Upload file using admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const mimeTypeRegex = /^data:(image\/[a-zA-Z0-9\-\.+]+);base64,/;
    const matches = file.match(mimeTypeRegex);

    if (!matches || matches.length < 2) {
      throw new Error(`Invalid image data URL format. Received: "${file.substring(0, 60)}..."`);
    }

    const mimeType = matches[1];
    const base64Data = file.substring(matches[0].length);
    const fileContent = decode(base64Data);

    const extensionMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
    };
    const fileExt = extensionMap[mimeType] || mimeType.split('/')[1].split('+')[0];

    if (!fileExt) {
        throw new Error(`Unsupported image type: ${mimeType}`);
    }
    
    const filePath = `${targetUserId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, fileContent, {
        contentType: mimeType,
        upsert: true,
      })
    if (uploadError) throw uploadError

    // 5. Get public URL and update person record
    const { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath)
    const avatar_url = `${urlData.publicUrl}?t=${new Date().getTime()}`

    const { error: updateError } = await supabaseAdmin
      .from('people')
      .update({ avatar_url, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
    if (updateError) throw updateError

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