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
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // 2. Get file from FormData
    const formData = await req.formData();
    const file = formData.get('file'); // 'file' is the field name for editorjs-attaches

    if (!file || !(file instanceof File)) {
      throw new Error('Missing or invalid file in FormData');
    }

    // 3. Upload file using admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileContent = await file.arrayBuffer();
    const fileExt = file.name.split('.').pop() || '';
    
    const filePath = `editor-attaches/${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('kb-images') // Re-using the kb-images bucket for simplicity
      .upload(filePath, fileContent, {
        contentType: file.type,
        upsert: false,
      })
    if (uploadError) throw uploadError

    // 4. Get public URL
    const { data: urlData } = supabaseAdmin.storage.from('kb-images').getPublicUrl(filePath)
    
    // 5. Return response in EditorJS Attaches format
    const responsePayload = {
      success: 1,
      file: {
        url: urlData.publicUrl,
        size: file.size,
        name: file.name,
        extension: fileExt,
      }
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: 0, error: { message: error.message } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})