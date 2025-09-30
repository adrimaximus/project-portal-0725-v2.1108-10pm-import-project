// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Otentikasi pengguna
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terotentikasi.");

    // 2. Dapatkan pengaturan Google Kalender pengguna dari profil mereka
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_settings')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const settings = profile.google_calendar_settings;
    const token = settings?.token;
    const selectedCalendars = settings?.selectedCalendars;

    if (!token || !token.access_token || !selectedCalendars || selectedCalendars.length === 0) {
      return new Response(JSON.stringify({ events: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Ambil acara dari Google Calendar API
    const today = new Date();
    const timeMin = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const timeMax = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const eventPromises = selectedCalendars.map(async (calendarId: string) => {
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
      url.searchParams.append('timeMin', timeMin);
      url.searchParams.append('timeMax', timeMax);
      url.searchParams.append('singleEvents', 'true');
      url.searchParams.append('orderBy', 'startTime');

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      if (!response.ok) {
        console.error(`Gagal mengambil acara untuk kalender ${calendarId}: ${response.statusText}`);
        if (response.status === 401) {
            // Token tidak valid.
        }
        return []; // Kembalikan array kosong untuk kalender ini saat terjadi kesalahan
      }

      const data = await response.json();
      return data.items.map((event: any) => ({
        ...event,
        calendarId: calendarId, // Tambahkan calendarId untuk mengidentifikasi sumber
      }));
    });

    const allEventsNested = await Promise.all(eventPromises);
    const allEvents = allEventsNested.flat();

    // 4. Urutkan semua acara berdasarkan waktu mulai
    allEvents.sort((a, b) => {
      const aTime = new Date(a.start.dateTime || a.start.date).getTime();
      const bTime = new Date(b.start.dateTime || b.start.date).getTime();
      return aTime - bTime;
    });

    // 5. Kembalikan acara
    return new Response(JSON.stringify({ events: allEvents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});