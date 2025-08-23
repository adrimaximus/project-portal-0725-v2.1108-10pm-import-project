// @ts-nocheck
import { HandlerContext } from '../lib/types.ts';
import { createSupabaseUserClient } from '../lib/clients.ts';
import { buildContext } from '../lib/context.ts';
import { getAnalyzeProjectsSystemPrompt } from '../lib/prompts.ts';
import { executeAction } from '../actions/index.ts';

export default async function analyzeProjects(payload: any, context: HandlerContext) {
  const { req, openai } = context;
  const { request, conversationHistory } = payload;
  if (!request) {
    throw new Error("400: An analysis request type is required.");
  }

  const userSupabase = createSupabaseUserClient(req);
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) throw new Error("401: User not authenticated.");

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

      const actionResult = await executeAction(actionData, { ...actionContext, supabaseAdmin: context.supabaseAdmin, user });
      return { result: actionResult };

  } catch (e) {
      return { result: responseText };
  }
}