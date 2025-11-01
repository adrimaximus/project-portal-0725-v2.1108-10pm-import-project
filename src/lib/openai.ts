import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage } from '@/types';

export async function analyzeProjects(
  message: string,
  conversationHistory?: ConversationMessage[],
  pageContext?: { pathname: string; search: string; },
  attachmentUrl?: string | null,
  attachmentType?: string | null,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('analyze-projects', {
    body: { 
      message, 
      conversationHistory,
      pageContext,
      attachmentUrl,
      attachmentType,
    },
  });

  if (error) {
    throw error;
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.reply || "I'm sorry, I couldn't process that request.";
}