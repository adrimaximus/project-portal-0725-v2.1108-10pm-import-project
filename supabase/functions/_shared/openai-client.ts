// @ts-nocheck
import OpenAI from 'npm:openai@4.29.2';
import { SupabaseClient } from 'npm:@supabase/supabase-js@2.54.0';

export const getOpenAIClient = async (supabaseAdmin: SupabaseClient) => {
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    throw new Error("OpenAI API key is not configured by an administrator.");
  }
  return new OpenAI({ apiKey: config.value });
};