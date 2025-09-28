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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      event_type, 
      email, 
      success, 
      error_message, 
      user_agent, 
      ip_address,
      additional_data 
    } = await req.json();

    if (!event_type || !email) {
      throw new Error('event_type and email are required');
    }

    // Log the authentication event
    const logData = {
      event_type, // 'login_attempt', 'signup_attempt', 'magic_link_sent', etc.
      email,
      success: success || false,
      error_message: error_message || null,
      user_agent: user_agent || req.headers.get('user-agent'),
      ip_address: ip_address || req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString(),
      additional_data: additional_data || {},
    };

    console.log(`[AUTH LOG] ${event_type.toUpperCase()}:`, {
      email,
      success,
      error: error_message,
      timestamp: logData.timestamp,
    });

    // Store in a simple log table (we'll create this)
    const { error: insertError } = await supabaseAdmin
      .from('auth_logs')
      .insert(logData);

    if (insertError) {
      console.error('Failed to insert auth log:', insertError);
      // Don't throw error - logging failure shouldn't break auth flow
    }

    // For failed login attempts, we might want to track them
    if (!success && event_type === 'login_attempt') {
      console.warn(`[SECURITY] Failed login attempt for ${email} from ${logData.ip_address}`);
    }

    // For successful events, log success
    if (success) {
      console.log(`[SUCCESS] ${event_type} successful for ${email}`);
    }

    return new Response(JSON.stringify({ 
      logged: true, 
      timestamp: logData.timestamp 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Auth logger error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      logged: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});