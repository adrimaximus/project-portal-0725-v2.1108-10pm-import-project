import OpenAI from 'openai';
import { Goal } from '@/data/goals';

function getOpenAIClient() {
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    throw new Error("OpenAI API key not found. Please connect your OpenAI account in the settings.");
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export async function getAiCoachInsight(goal: Goal, progress: { percentage: number } | null) {
  const openai = getOpenAIClient();

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

export async function generateIconWithDalle(prompt: string): Promise<string> {
  const openai = getOpenAIClient();
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A minimalist, vector-style icon for a goal tracking app. The icon should be simple, clean, and on a solid, single-color background. The subject is: "${prompt}"`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("Image generation failed, no URL returned.");
    }
    return imageUrl;
  } catch (error) {
    console.error("Error generating icon with DALL-E:", error);
    throw new Error("Failed to generate icon. Please try again.");
  }
}