import { Goal } from '@/data/goals';

/**
 * Simulates calling an AI to generate an icon based on a prompt.
 * In a real application, this would involve a server-side call to a service like DALL-E.
 * For now, it returns a relevant image from Unsplash to simulate the effect.
 * @param prompt The text prompt for the AI.
 * @returns A promise that resolves to an image URL.
 */
export const generateAiIcon = async (prompt: string): Promise<string> => {
  console.log(`Generating AI icon for prompt: "${prompt}"`);

  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Extract a relevant keyword from the prompt to use with the image service.
  // We look for the first word that is reasonably long.
  const keywords = prompt.match(/\b(\w{4,})\b/g);
  const keyword = keywords ? keywords[0] : 'abstract';

  // Simulate a potential failure (e.g., network error, API limit)
  if (Math.random() < 0.1) { // 10% chance of failure
    throw new Error("Simulated AI service failure.");
  }

  // Return a dynamic image URL from Unsplash. 
  // The `sig` parameter with a timestamp ensures we get a different image each time.
  return `https://source.unsplash.com/128x128/?${keyword.toLowerCase()}&sig=${Date.now()}`;
};

const sampleInsights = [
    "Breaking this goal into smaller, daily tasks can make it feel more manageable. Consistency is key!",
    "Remember why you started this goal. Visualizing your success can be a powerful motivator.",
    "Don't forget to celebrate small wins along the way. It helps maintain momentum.",
    "Consider tracking your progress at the same time each day to build a strong habit.",
    "If you miss a day, don't be discouraged. Just get back on track the next day. Progress over perfection!"
];

/**
 * Simulates generating an AI-powered insight for a specific goal.
 * @param goal The goal to generate an insight for.
 * @returns A promise that resolves to a string with the insight.
 */
export const generateAiInsight = async (goal: Goal): Promise<string> => {
    console.log(`Generating AI insight for goal: "${goal.title}"`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, you'd send goal data to an LLM.
    // Here, we'll just pick a random insight.
    const randomIndex = Math.floor(Math.random() * sampleInsights.length);
    return sampleInsights[randomIndex];
};