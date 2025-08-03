import OpenAI from 'openai';
import { Goal } from '@/data/goals';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function getAiCoachInsight(goal: Goal, progress: { percentage: number } | null) {
  const progressText = progress
    ? `Current progress is ${progress.percentage}% of the yearly target.`
    : "There is no yearly target set, so progress cannot be calculated.";

  const prompt = `
    You are an encouraging and insightful AI coach.
    Analyze the following goal and its current progress, then provide a brief, actionable, and motivating insight (2-3 sentences).
    Do not greet the user. Be direct and encouraging.
    Use markdown for formatting if needed (e.g., bolding).

    **Goal Details:**
    - Title: ${goal.title}
    - Description: ${goal.description}
    - Type: ${goal.type}
    - Target: ${
      goal.type === 'quantity' ? `${goal.targetQuantity} ${goal.unit || ''}` :
      goal.type === 'value' ? `${goal.targetValue} ${goal.unit || ''}` :
      `${goal.frequency} times`
    } per ${goal.targetPeriod}
    - Collaborators: ${goal.collaborators.join(', ')}

    **Progress:**
    ${progressText}
    There have been ${goal.completions.length} completions logged in total.

    **Your Insight:**
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching AI coach insight:", error);
    return "Sorry, I couldn't generate an insight right now. Keep up the great work!";
  }
}