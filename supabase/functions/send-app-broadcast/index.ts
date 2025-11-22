// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check permissions (admin only)
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'master admin')) {
        throw new Error("Insufficient permissions. Only admins can send broadcasts.");
    }

    const { title, body, target, targetValue, link, type = 'system' } = await req.json();

    if (!title || !body) {
        throw new Error("Title and body are required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let userIds: string[] = [];

    if (target === 'all') {
        const { data } = await supabaseAdmin.from('profiles').select('id');
        userIds = data?.map(u => u.id) || [];
    } else if (target === 'role') {
        const { data } = await supabaseAdmin.from('profiles').select('id').eq('role', targetValue);
        userIds = data?.map(u => u.id) || [];
    } else if (target === 'specific') {
        userIds = Array.isArray(targetValue) ? targetValue : [targetValue];
    }

    if (userIds.length === 0) {
        return new Response(JSON.stringify({ message: "No recipients found for the selected target." }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
        });
    }

    // 1. Insert the Notification record
    const { data: notification, error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
            type,
            title,
            body,
            actor_id: user.id,
            resource_type: 'system', // Broadcasts are system-level usually
            data: link ? { link } : {}
        })
        .select()
        .single();

    if (notifError) throw notifError;

    // 2. Insert Notification Recipients
    const recipients = userIds.map(uid => ({
        notification_id: notification.id,
        user_id: uid,
        read_at: null // Explicitly unread
    }));

    const { error: recipientError } = await supabaseAdmin
        .from('notification_recipients')
        .insert(recipients);

    if (recipientError) throw recipientError;

    return new Response(JSON.stringify({ success: true, count: userIds.length }), {
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