import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types";
import { Goal } from "@/types";

// Generic helper to invoke Supabase functions with an authentication check
const invokeFunction = async (functionName: string, payload?: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("User not authenticated. Please sign in again.");
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  });

  if (error) {
    throw new Error(error.message);
  }
  // Edge functions might return a structured error within the data object
  if (data && data.error) {
    throw new Error(data.error);
  }
  return data;
};

// Specific helper for the openai-generator function that expects a `result` property
const invokeOpenAiGenerator = async (feature: string, payload: any) => {
  const data = await invokeFunction('openai-generator', { feature, payload });
  return data.result;
};

export const generateProjectBrief = async (project: Project): Promise<string> => {
  return invokeOpenAiGenerator('generate-brief', { project });
};

export const generateTaskSuggestions = async (project: Project, existingTasks: { title: string }[]): Promise<string[]> => {
  const result = await invokeOpenAiGenerator('generate-tasks', { project, existingTasks });
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
  return invokeOpenAiGenerator('generate-insight', { goal: summarizedGoal, context });
};

export const generateAiIcon = async (prompt: string): Promise<string> => {
  return invokeOpenAiGenerator('generate-icon', { prompt });
};

export const analyzeProjects = async (request: string, conversationHistory?: { sender: 'user' | 'ai', content: string }[]): Promise<string> => {
  return invokeOpenAiGenerator('analyze-projects', { request, conversationHistory });
};

export const diagnoseProjectVisibility = async (): Promise<string> => {
  const data = await invokeFunction('diagnose-projects');
  return data.result;
};