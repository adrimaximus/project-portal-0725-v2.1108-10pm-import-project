import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/data/projects";
import { Goal } from "@/types";

const invokeOpenAiGenerator = async (feature: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('openai-generator', {
    body: { feature, payload },
  });

  if (error) {
    throw new Error(error.message);
  }
  if (data.error) {
    throw new Error(data.error);
  }
  return data.result;
};

export const generateProjectBrief = async (project: Project): Promise<string> => {
  return invokeOpenAiGenerator('generate-brief', { project });
};

export const generateTaskSuggestions = async (project: Project, existingTasks: { title: string }[]): Promise<string[]> => {
  const result = await invokeOpenAiGenerator('generate-tasks', { project, existingTasks });
  // The result might be inside a key if the model doesn't return a root array
  if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
    const key = Object.keys(result)[0];
    if (key && Array.isArray(result[key])) {
        return result[key];
    }
  }
  return Array.isArray(result) ? result : [];
};

export const generateAiInsight = async (goal: Goal, context: any): Promise<string> => {
  // Create a summary of the goal without the full completions list to avoid large payloads.
  const { completions, ...goalSummary } = goal;
  const summarizedGoal = {
    ...goalSummary,
    completionCount: completions.length, // Send a count instead of the full array
  };
  return invokeOpenAiGenerator('generate-insight', { goal: summarizedGoal, context });
};

export const generateAiIcon = async (prompt: string): Promise<string> => {
  return invokeOpenAiGenerator('generate-icon', { prompt });
};

export const analyzeProjects = async (request: string): Promise<string> => {
  return invokeOpenAiGenerator('analyze-projects', { request });
};

export const diagnoseProjectVisibility = async (): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('diagnose-projects');
  if (error) throw new Error(error.message);
  if (data.error) throw new Error(data.error);
  return data.result;
};