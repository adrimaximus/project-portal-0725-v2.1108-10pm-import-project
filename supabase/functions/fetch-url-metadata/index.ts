import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const parseTitle = (html: string): string => {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return match ? match[1] : '';
};

const parseMeta = (html: string, property: string): string => {
  // Regex ini menangani berbagai gaya kutipan dan urutan atribut
  const regex = new RegExp(`<meta[^>]*?(?:name|property)=["']${property}["'][^>]*?content=(["'])(.*?)\\1`, 'i');
  const match = html.match(regex);
  return match ? match[2] : '';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const reqUrl = new URL(req.url);
    const url = reqUrl.searchParams.get('url');

    if (!url) {
      throw new Error('URL query parameter is required');
    }

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

    const response = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: Status ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    const title = parseTitle(html);
    const description = parseMeta(html, 'description') || parseMeta(html, 'og:description');
    const imageUrl = parseMeta(html, 'og:image');

    const meta = {
      title,
      description,
      image: {
        url: imageUrl,
      },
    };

    return new Response(JSON.stringify({
      success: 1,
      link: fullUrl,
      meta,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in fetch-url-metadata:", error.message);
    return new Response(JSON.stringify({
      success: 0,
      meta: {},
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 OK with success: 0 as Editor.js LinkTool expects
    });
  }
})