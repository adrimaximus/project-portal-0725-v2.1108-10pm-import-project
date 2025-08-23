// @ts-nocheck
import { createSupabaseUserClient } from '../_lib/supabase.ts';
import { buildContext } from '../_lib/context.ts';
import { getAnalyzeProjectsSystemPrompt } from '../_lib/prompts.ts';
import { executeAction } from '../_lib/actions.ts';

export default async function analyzeProjects(payload, context) {
  const { req, openai } = context;
  const { request, conversationHistory } = payload;
  if (!request) {
    throw new Error("An analysis request type is required.");
  }

  const userSupabase = createSupabaseUserClient(req);
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) throw new Error("User not authenticated.");

  const actionContext = await buildContext(userSupabase, user);
  const systemPrompt = getAnalyzeProjectsSystemPrompt(actionContext);

  const messages = [
    { role: "system", content: systemPrompt },
    ...(conversationHistory || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
    { role: "user", content: request }
  ];

  const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages,
      temperature: 0.1,
      max_tokens: 1000,
  });

  const responseText = response.choices[0].message.content;
  
  try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
      if (!jsonMatch) {
          return { result: responseText };
      }
      const jsonString = jsonMatch[1] || jsonMatch[2];
      const actionData = JSON.parse(jsonString);

      const actionResult = await executeAction(actionData, { ...actionContext, userSupabase, user });
      return { result: actionResult };

  } catch (e) {
      return { result: responseText };
  }
}