import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage } from '@/types';
import { FunctionsHttpError } from '@supabase/supabase-js';

export async function analyzeProjects(message: string, conversationHistory: ConversationMessage[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke('analyze-projects', {
    body: { query: message, conversationHistory },
  });

  if (error) {
    console.error('Edge function invocation error:', error);
    if (error instanceof FunctionsHttpError) {
      try {
        const errorData = await error.context.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (e) {
        // If parsing fails, fall back to the original error message
        throw new Error(error.message);
      }
    }
    throw error;
  }

  return data.result;
}