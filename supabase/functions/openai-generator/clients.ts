// @ts-nocheck
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

export const createSupabaseAdmin = (): SupabaseClient => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

export const createSupabaseUserClient = (req: Request): SupabaseClient => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error("401: Missing Authorization header.");
  }
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
};

export const getOpenAIClient = async (supabaseAdmin: SupabaseClient): Promise<OpenAI> => {
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    throw new Error("400: OpenAI API key is not configured. Please ask an administrator to set it up in the integration settings.");
  }

  return new OpenAI({ apiKey: config.value });
};