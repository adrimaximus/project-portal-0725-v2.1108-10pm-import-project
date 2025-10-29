import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage, Goal } from '@/types';
import { FunctionsHttpError } from '@supabase/supabase-js';

export async function analyzeProjects(
  message: string, 
  conversationHistory: ConversationMessage[] | undefined, 
  attachmentUrl?: string | null, 
  attachmentType?: string | null
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-handler', {
    body: { 
      feature: 'analyze-projects',
      payload: {
        request: message,
        attachmentUrl,
        attachmentType,
      }
    },
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

export async function generateAiInsight(goal: Goal, context: any): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-handler', {
    body: { 
      feature: 'generate-insight', 
      payload: { goal, context } 
    },
  });

  if (error) {
    console.error('Edge function invocation error for generateAiInsight:', error);
    if (error instanceof FunctionsHttpError) {
      try {
        const errorData = await error.context.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (e) {
        throw new Error(error.message);
      }
    }
    throw error;
  }

  return data.result;
}

export async function generateAiIcon(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-handler', {
    body: {
      feature: 'generate-icon',
      payload: { prompt },
    },
  });

  if (error) {
    console.error('Edge function invocation error for generateAiIcon:', error);
    if (error instanceof FunctionsHttpError) {
      try {
        const errorData = await error.context.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (e) {
        throw new Error(error.message);
      }
    }
    throw error;
  }

  return data.result;
}