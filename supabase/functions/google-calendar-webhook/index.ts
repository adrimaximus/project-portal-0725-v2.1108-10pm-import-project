// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-resource-id, x-goog-resource-state, x-goog-message-number, x-goog-resource-uri',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Google mengirimkan notifikasi sinkronisasi saat webhook pertama kali didaftarkan
    const resourceState = req.headers.get('x-goog-resource-state');
    if (resourceState === 'sync') {
      console.log('Webhook successfully registered with Google Calendar.');
      return new Response('Webhook registered', { status: 200, headers: corsHeaders });
    }

    // Hanya proses notifikasi 'exists' (acara dibuat atau diperbarui)
    if (resourceState !== 'exists') {
      console.log(`Ignoring event with state: ${resourceState}`);
      return new Response('Notification ignored', { status: 200, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Ambil detail acara dari Google Calendar API
    // Ini memerlukan token akses yang valid. Untuk webhook, Anda perlu menyiapkan alur otentikasi sisi server.
    // Kode di bawah ini adalah placeholder dan memerlukan implementasi otentikasi yang sebenarnya.
    // Untuk saat ini, kita akan mengasumsikan kita bisa mendapatkan detail acara.
    // Dalam implementasi nyata, Anda akan menggunakan 'x-goog-resource-uri' untuk mengambil acara.
    
    // Placeholder: Log header untuk debugging
    console.log('Received webhook from Google Calendar:');
    for (const [key, value] of req.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    // Di sini Anda akan menambahkan logika untuk mengambil detail acara menggunakan Google Calendar API
    // dan kemudian memanggil fungsi RPC. Karena otentikasi tidak dapat ditangani di sini,
    // saya akan meninggalkan placeholder.

    // Contoh pemanggilan RPC (setelah Anda mendapatkan detail acara)
    /*
    const eventDetails = {
      event_id: 'some_event_id',
      summary: 'New Event from Webhook',
      description: 'This was created automatically.',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      event_location: 'Online',
      creator_email: 'user@example.com'
    };

    const { error } = await supabaseAdmin.rpc('upsert_project_from_gcal_event', eventDetails);

    if (error) {
      throw new Error(`Failed to upsert project: ${error.message}`);
    }
    */

    return new Response(JSON.stringify({ message: "Webhook received, processing placeholder." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})