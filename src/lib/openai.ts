import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types";
import { Goal } from "@/types";

const invokeAiFunction = async (functionName: string, payload: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("User not authenticated for AI function call.");
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const generateProjectBrief = async (project: Project): Promise<string> => {
  const { result } = await invokeAiFunction('generate-brief', { project });
  return result;
};

export const generateTaskSuggestions = async (project: Project, existingTasks: { title: string }[]): Promise<string[]> => {
  const { result } = await invokeAiFunction('generate-tasks', { project, existingTasks });
  if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
    const key = Object.keys(result)[0];
    if (key && Array.isArray(result[key])) {
        return result[key];
    }
  }
  return Array.isArray(result) ? result : [];
};

export const generateAiInsight = async (goal: Goal, context: any): Promise<string> => {
  const { completions, ...goalSummary } = goal;
  const summarizedGoal = {
    ...goalSummary,
    completionCount: completions.length,
  };
  const { result } = await invokeAiFunction('generate-insight', { goal: summarizedGoal, context });
  return result;
};

export const generateAiIcon = async (prompt: string): Promise<string> => {
  const { result } = await invokeAiFunction('generate-icon', { prompt });
  return result;
};

export const analyzeProjects = async (prompt: string, conversationHistory?: { sender: 'user' | 'ai', content: string }[], attachmentUrl?: string | null, attachmentType?: string | null): Promise<string> => {
  const { result } = await invokeAiFunction('analyze-projects', { prompt, conversationHistory, attachmentUrl, attachmentType });
  return result;
};

export const diagnoseProjectVisibility = async (): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('diagnose-projects');
  if (error) throw new Error(error.message);
  if (data.error) throw new Error(data.error);
  return data.result;
};