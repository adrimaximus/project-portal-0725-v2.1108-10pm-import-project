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
    // 1. Create a Supabase client with the user's auth token
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated.");
    }

    // 2. Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file'); // 'file' is the key Editor.js uses

    if (!file || !(file instanceof File)) {
      throw new Error('File not provided or is invalid.');
    }

    // 3. Create an admin client to upload to storage (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Upload the file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = `editorjs-attachments/${user.id}/${Date.now()}-${sanitizedFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('project-files') // Using the existing bucket for simplicity
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    // 5. Get the public URL of the uploaded file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('project-files')
      .getPublicUrl(filePath);

    // 6. Return the response in the format expected by @editorjs/attaches
    const responsePayload = {
      success: 1,
      file: {
        url: publicUrlData.publicUrl,
        name: file.name,
        size: file.size,
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: 0, error: { message: error.message } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})