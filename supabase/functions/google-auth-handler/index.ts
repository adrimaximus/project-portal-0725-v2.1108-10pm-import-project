// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'
import { OAuth2Client } from 'https://esm.sh/google-auth-library@9.11.0'

// --- Konfigurasi & Helper ---

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
}

const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
};

// --- Validasi Variabel Lingkungan ---

const getEnv = () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Variabel lingkungan yang diperlukan tidak ada.");
  }

  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET };
};

// --- Penangan Metode ---

const handleExchangeCode = async (payload, { oAuth2Client, supabaseAdmin, user }) => {
  const { tokens } = await oAuth2Client.getToken({
    code: payload.code,
    redirect_uri: 'postmessage'
  });
  const { access_token, refresh_token, expiry_date, scope } = tokens;
  if (!access_token) throw new Error("Gagal mendapatkan token akses.");

  const { error } = await supabaseAdmin.from('user_google_tokens').upsert({
    user_id: user.id,
    access_token,
    refresh_token,
    expires_at: new Date(expiry_date).toISOString(),
    scope,
  });
  if (error) throw error;
  return { success: true };
};

const handleGetStatus = async (_, { supabaseAdmin, user }) => {
  const { data, error } = await supabaseAdmin.from('user_google_tokens').select('user_id').eq('user_id', user.id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return { connected: !!data };
};

const handleDisconnect = async (_, { supabaseAdmin, user }) => {
  await supabaseAdmin.from('user_calendar_selections').delete().eq('user_id', user.id);
  await supabaseAdmin.from('user_google_tokens').delete().eq('user_id', user.id);
  return { success: true };
};

const handleGetSelections = async (_, { supabase, user }) => {
  const { data, error } = await supabase.from('user_calendar_selections').select('calendar_id').eq('user_id', user.id);
  if (error) throw error;
  return { selections: data.map(s => s.calendar_id) };
};

const handleSaveSelections = async (payload, { supabaseAdmin, user }) => {
  await supabaseAdmin.from('user_calendar_selections').delete().eq('user_id', user.id);
  if (payload.selections && payload.selections.length > 0) {
    const toInsert = payload.selections.map(s => ({
      user_id: user.id,
      calendar_id: s.id,
      calendar_summary: s.summary,
    }));
    const { error } = await supabaseAdmin.from('user_calendar_selections').insert(toInsert);
    if (error) throw error;
  }
  return { success: true };
};

const getAuthenticatedOAuth2Client = async (supabaseAdmin, user, oAuth2Client) => {
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('user_google_tokens')
    .select('refresh_token')
    .eq('user_id', user.id)
    .single();
  if (tokenError || !tokenData?.refresh_token) {
    throw new Error("Tidak ada token penyegaran yang ditemukan untuk pengguna. Harap hubungkan kembali.");
  }

  oAuth2Client.setCredentials({ refresh_token: tokenData.refresh_token });
  const { token: accessToken } = await oAuth2Client.getAccessToken();
  if (!accessToken) throw new Error("Gagal menyegarkan token akses.");
  
  return oAuth2Client;
};

const handleListCalendars = async (_, { supabaseAdmin, user, oAuth2Client }) => {
  const authClient = await getAuthenticatedOAuth2Client(supabaseAdmin, user, oAuth2Client);
  const accessToken = authClient.credentials.access_token;

  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(`Kesalahan API Google: ${errorBody.error.message}`);
  }
  
  const calendarData = await response.json();
  return calendarData.items || [];
};

const handleListEvents = async (payload, { supabaseAdmin, user, oAuth2Client }) => {
  const authClient = await getAuthenticatedOAuth2Client(supabaseAdmin, user, oAuth2Client);
  const accessToken = authClient.credentials.access_token;

  const { calendarIds, timeMin, timeMax } = payload;
  if (!calendarIds || !Array.isArray(calendarIds) || !timeMin || !timeMax) {
      throw new Error("Array calendarIds, timeMin, dan timeMax diperlukan.");
  }

  const allEvents = [];
  for (const calendarId of calendarIds) {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
          console.warn(`Tidak dapat mengambil acara untuk kalender ${calendarId}. Status: ${response.status}`);
          continue;
      }
      const data = await response.json();
      if (data.items) allEvents.push(...data.items);
  }

  allEvents.sort((a, b) => {
      const dateA = new Date(a.start.dateTime || a.start.date);
      const dateB = new Date(b.start.dateTime || b.start.date);
      return dateA.getTime() - dateB.getTime();
  });

  return allEvents;
};

// --- Server Utama ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const env = getEnv();

    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const supabase = createClient(
      env.SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Pengguna tidak diautentikasi.");

    const oAuth2Client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);

    let body = {};
    if (req.body) {
      try {
        const raw = await req.text();
        if (raw) body = JSON.parse(raw);
      } catch (e) {
        throw new Error("Body JSON tidak valid");
      }
    }
    const { method, ...payload } = body;

    const context = { supabase, supabaseAdmin, user, oAuth2Client };
    let result;

    switch (method) {
      case 'health-check': result = { status: 'ok' }; break;
      case 'exchange-code': result = await handleExchangeCode(payload, context); break;
      case 'get-status': result = await handleGetStatus(payload, context); break;
      case 'disconnect': result = await handleDisconnect(payload, context); break;
      case 'get-selections': result = await handleGetSelections(payload, context); break;
      case 'save-selections': result = await handleSaveSelections(payload, context); break;
      case 'list-calendars': result = await handleListCalendars(payload, context); break;
      case 'list-events': result = await handleListEvents(payload, context); break;
      default: throw new Error("Metode tidak valid");
    }

    return jsonResponse(result);

  } catch (error) {
    console.error("Kesalahan Edge Function:", error.message);
    return jsonResponse({ error: error.message }, 400);
  }
});