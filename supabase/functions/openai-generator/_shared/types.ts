// @ts-nocheck
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

export interface HandlerContext {
  req: Request;
  openai: OpenAI;
  supabaseAdmin: SupabaseClient;
  feature: string;
}