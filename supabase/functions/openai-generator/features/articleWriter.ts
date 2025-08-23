// @ts-nocheck
import { HandlerContext } from '../types.ts';
import { articleWriterFeaturePrompts } from '../prompts.ts';

export default async function articleWriter(payload: any, context: HandlerContext) {
  const { openai, feature } = context;
  const promptConfig = articleWriterFeaturePrompts[feature];

  if (!promptConfig) {
    throw new Error(`400: Unknown article writer feature: ${feature}`);
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