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
    const file = formData.get('image'); // 'image' is the default field name for editorjs-image

    if (!file || !(file instanceof File)) {
      throw new Error('Missing or invalid file in FormData');
    }

    // 3. Upload file using admin client to bypass RLS if needed
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileContent = await file.arrayBuffer();
    const mimeType = file.type;
    const fileExt = mimeType.split('/')[1] || 'png';
    
    const filePath = `editor-images/${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('kb-images') // Using the existing knowledge base images bucket
      .upload(filePath, fileContent, {
        contentType: mimeType,
        upsert: false,
      })
    if (uploadError) throw uploadError

    // 4. Get public URL
    const { data: urlData } = supabaseAdmin.storage.from('kb-images').getPublicUrl(filePath)
    
    // 5. Return response in EditorJS format
    const responsePayload = {
      success: 1,
      file: {
        url: urlData.publicUrl,
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