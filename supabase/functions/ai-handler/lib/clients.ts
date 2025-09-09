// @ts-nocheck
import { createClient as createSupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import OpenAI from 'https://esm.sh/openai@4.29.2';

export const createSupabaseUserClient = (req) => {
  return createSupabaseClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );
};

export const createSupabaseAdmin = () => {
  return createSupabaseClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

export const getOpenAIClient = async (supabaseAdmin) => {
  console.log("Attempting to fetch OpenAI API key from app_config...");
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .maybeSingle();

  if (configError) {
    console.error("Error fetching OpenAI key from DB:", configError.message);
    throw new Error("Database error while fetching API key.");
  }

  if (!config?.value) {
    console.error("OpenAI API key not found in app_config table.");
    throw new Error("OpenAI API key is not configured by an administrator.");
  }
  
  console.log("Successfully fetched OpenAI API key.");
  return new OpenAI({ apiKey: config.value });
};