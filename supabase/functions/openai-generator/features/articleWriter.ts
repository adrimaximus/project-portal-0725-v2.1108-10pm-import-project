// @ts-nocheck
import { articleWriterFeaturePrompts } from '../prompts/articleWriter.ts';

export async function articleWriter(payload, context) {
  const { openai, feature } = context;
  const promptConfig = articleWriterFeaturePrompts[feature];

  if (!promptConfig) {
    throw new Error(`Unknown article writer feature: ${feature}`);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: promptConfig.system },
      { role: "user", content: promptConfig.user(payload) }
    ],
    temperature: 0.7,
    max_tokens: promptConfig.max_tokens,
  });

  return { result: response.choices[0].message.content?.trim() };
}