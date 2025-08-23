// @ts-nocheck
import { HandlerContext } from '../../_shared/types.ts';

export default async function suggestIcon(payload: any, context: HandlerContext) {
  const { openai } = context;
  const { title, icons } = payload;
  if (!title || !icons || !Array.isArray(icons)) {
    throw new Error("400: Title and a list of icons are required.");
  }

  const systemPrompt = `You are an AI assistant that suggests the best icon for a given title from a list. Your response must be ONLY the name of the icon from the list provided, with no extra text, explanation, or punctuation.`;
  const userPrompt = `Title: "${title}"\n\nIcons: [${icons.join(', ')}]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0,
    max_tokens: 20,
  });

  return { result: response.choices[0].message.content?.trim() };
}