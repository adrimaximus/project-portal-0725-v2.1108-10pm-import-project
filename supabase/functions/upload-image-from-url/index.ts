// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { v2 as cloudinary } from 'https://esm.sh/cloudinary@1.32.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Menangani permintaan preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    // Pemeriksaan eksplisit untuk environment variables
    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary environment variables are not set.");
      return new Response(JSON.stringify({ error: "Konfigurasi Cloudinary tidak lengkap di server." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Konfigurasi Cloudinary di dalam handler
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      throw new Error('imageUrl diperlukan dalam body permintaan');
    }

    // Mengunggah gambar ke Cloudinary ke folder yang ditentukan
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'portal client',
    });

    return new Response(JSON.stringify({ secure_url: result.secure_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error dalam fungsi unggah Cloudinary:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});