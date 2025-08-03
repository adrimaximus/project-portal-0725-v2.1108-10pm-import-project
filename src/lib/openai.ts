import OpenAI from "openai";
import { Goal } from "@/data/goals";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function getAIInsightForGoal(goal: Goal): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant providing insights on goals. Analyze the provided goal JSON and give a brief, actionable insight or suggestion. Be encouraging and concise. The user is providing the goal details in the next message.`,
        },
        {
          role: "user",
          content: `
            Here is my goal:
            - Title: ${goal.title}
            - Description: ${goal.description || 'Not provided'}
            - Type: ${goal.type}
            - Target: ${goal.targetQuantity || goal.targetValue}${goal.unit || ''} per ${goal.targetPeriod}
            - Tags: ${goal.tags.join(', ')}
            - Status: ${goal.status}
            - Collaborators: ${goal.collaborators.map(c => c.name).join(', ')}
            - Completions so far: ${goal.completions.length}
            
            Please provide a short insight or suggestion based on this.
          `,
        },
      ],
    });
    return completion.choices[0].message.content || "No insight available.";
  } catch (error) {
    console.error("Error fetching AI insight:", error);
    return "Could not fetch AI insight at this time.";
  }
}