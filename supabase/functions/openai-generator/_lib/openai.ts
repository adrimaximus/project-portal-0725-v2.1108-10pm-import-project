// @ts-nocheck
import OpenAI from 'https://esm.sh/openai@4.29.2';

export const getOpenAIClient = async (supabaseAdmin) => {
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