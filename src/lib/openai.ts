import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage, Goal } from '@/types';

export async function analyzeProjects(
  message: string,
  conversationHistory?: ConversationMessage[],
  pageContext?: { pathname: string; search: string; pageContent?: string },
  attachmentUrl?: string | null,
  attachmentType?: string | null,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-handler', {
    body: { 
      feature: 'analyze-projects',
      payload: {
        request: message,
        pageContext,
        attachmentUrl,
        attachmentType,
      }
    },
  });

  if (error) {
    throw error;
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result || "I'm sorry, I couldn't process that request.";
}

export async function generateAiInsight(
  goal: Goal,
  context: { 
    yearly?: { percentage: number }; 
    month?: { name: string; percentage: number; completedCount: number; possibleCount: number; };
  }
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-handler', {
    body: { 
      feature: 'generate-goal-insight',
      payload: { goal, context }
    },
  });

  if (error) {
    throw error;
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result || "I'm sorry, I couldn't generate an insight right now.";
}

export async function generateAiIcon(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-handler', {
    body: {
      feature: 'generate-icon',
      payload: { prompt },
    },
  });

  if (error) {
    throw error;
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.result || !data.result.startsWith('http')) {
    throw new Error("AI did not return a valid image URL.");
  }

  return data.result;
}