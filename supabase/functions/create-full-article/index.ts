// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createApi } from 'https://esm.sh/unsplash-js@7.0.19';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user and create Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create a service role client for admin tasks
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { prompt, folder_name } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Invoke generate-article function
    const { data: articleData, error: articleError } = await supabase.functions.invoke('generate-article', {
      body: { prompt },
    });
    if (articleError) throw articleError;
    const { title, content, unsplash_keywords } = articleData;

    // 3. Search for a relevant image using Unsplash
    let imageUrl = null;
    const unsplashApiKey = Deno.env.get('VITE_UNSPLASH_ACCESS_KEY');
    if (unsplashApiKey && unsplash_keywords && unsplash_keywords.length > 0) {
      try {
        const unsplash = createApi({ accessKey: unsplashApiKey });
        const query = unsplash_keywords.join(' ');
        const result = await unsplash.search.getPhotos({ query, perPage: 1, orientation: 'landscape' });
        if (result.type === 'success' && result.response.results.length > 0) {
          imageUrl = result.response.results[0].urls.regular;
        }
      } catch (e) {
        console.error("Failed to fetch image from Unsplash:", e.message);
      }
    }

    // 4. Find or create the folder
    const folderName = folder_name || 'Uncategorized';
    let { data: existingFolder } = await supabaseAdmin
      .from('kb_folders')
      .select('id')
      .eq('name', folderName)
      .eq('user_id', user.id)
      .single();

    let folderId;
    if (existingFolder) {
      folderId = existingFolder.id;
    } else {
      const { data: newFolder, error: newFolderError } = await supabaseAdmin
        .from('kb_folders')
        .insert({ name: folderName, user_id: user.id })
        .select('id')
        .single();
      if (newFolderError) throw newFolderError;
      folderId = newFolder.id;
    }

    // 5. Create the article in the database
    const { data: newArticle, error: upsertError } = await supabase.rpc('upsert_article_with_tags', {
      p_id: null,
      p_title: title,
      p_content: { "html": content },
      p_folder_id: folderId,
      p_header_image_url: imageUrl,
      p_tags: [],
      p_custom_tags: []
    });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify(newArticle), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-full-article:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});