// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { v2 as cloudinary } from 'https://esm.sh/cloudinary@1.32.0';

// Konfigurasi Cloudinary menggunakan environment variables (secrets)
// Pastikan Anda telah mengatur ini di dasbor Supabase Anda
cloudinary.config({
  cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME'),
  api_key: Deno.env.get('CLOUDINARY_API_KEY'),
  api_secret: Deno.env.get('CLOUDINARY_API_SECRET'),
  secure: true,
});

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
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      throw new Error('imageUrl is required');
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
    console.error('Error uploading to Cloudinary:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});