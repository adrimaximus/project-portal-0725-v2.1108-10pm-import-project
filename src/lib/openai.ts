import OpenAI from 'openai';
import { Goal } from '@/types';
import { Project } from '@/data/projects';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function getAiInsightForGoal(goal: Goal): Promise<string> {
  const prompt = `
    As an expert productivity and wellness coach, provide a concise, actionable, and encouraging insight for the following goal.
    Keep the tone positive and motivational. The response should be a single paragraph, no more than 3-4 sentences.

    Goal Title: ${goal.title}
    Description: ${goal.description}
    Type: ${goal.type === 'quantity' ? `Complete ${goal.target_quantity} times` : `Save ${goal.target_value} ${goal.unit}`}
    
    Coach's Insight:
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });
    return completion.choices[0].message.content || "No insight available at the moment.";
  } catch (error) {
    console.error("Error fetching AI insight:", error);
    return "Could not generate an insight. Please check your setup.";
  }
}

export async function getAiInsightForProject(project: Project): Promise<string> {
    const prompt = `
      As an expert project manager, provide a concise, actionable, and strategic insight for the following project.
      Focus on potential risks, opportunities, or next steps.
      Keep the tone professional and helpful. The response should be a single paragraph, no more than 3-4 sentences.
  
      Project Name: ${project.name}
      Description: ${project.description}
      Status: ${project.status}
      Progress: ${project.progress}%
      Due Date: ${project.dueDate}
      
      Manager's Insight:
    `;
  
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      });
      return completion.choices[0].message.content || "No insight available at the moment.";
    } catch (error) {
      console.error("Error fetching AI insight:", error);
      return "Could not generate an insight. Please check your setup.";
    }
  }