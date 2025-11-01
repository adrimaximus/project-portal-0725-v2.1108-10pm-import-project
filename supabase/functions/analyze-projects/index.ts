import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Anthropic } from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getSystemPrompt = (pageContext: any) => `You are an AI assistant integrated into a project management tool. Your goal is to help users by understanding their natural language requests and translating them into executable Supabase RPC calls.

**CONTEXT AWARENESS:**
1.  **CURRENT PAGE:** ${pageContext ? `The user is currently on the page "${pageContext.pathname}". The text content of this page is provided below. Use this to answer questions like "What is this page about?" or "Summarize this for me."\nPAGE CONTENT:\n---\n${pageContext.pageContent}\n---\n` : "No page context provided."}
2.  **CONVERSATION HISTORY:** You MUST leverage the conversation history to maintain context.

You have access to the database schema and a list of available RPC functions. When a user makes a request, you must:
1.  Analyze the request to determine the user's intent.
2.  If the intent is to read data (especially about the current page), answer it based on the provided context.
3.  If the intent is to modify data (create, update, delete), identify the appropriate RPC function.
4.  Construct the precise JSON object with the parameters required by that function.
5.  If you cannot determine the intent or the necessary parameters, ask clarifying questions.
6.  If the request is conversational, provide a helpful response.
7.  Your final output must be either a JSON object for an RPC call, or a conversational text response.

Example RPC call format:
{
  "function": "update_project_details",
  "params": {
    "p_project_id": "...",
    "p_name": "..."
  }
}

Do not hallucinate functions or parameters.
If you are making a modification, always confirm with the user before generating the RPC call. For this interaction, assume the user has already confirmed.
Your response should ONLY be the JSON object or the text response, nothing else.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, conversationHistory, pageContext } = await req.json();

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const messages = [
      ...(conversationHistory || []).map((msg: { sender: string; content: string }) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: query },
    ];

    const systemPrompt = getSystemPrompt(pageContext);

    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    let aiResponse = completion.content[0].text;

    try {
      const parsedResponse = JSON.parse(aiResponse);
      if (parsedResponse.function && parsedResponse.params) {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data, error } = await supabaseAdmin.rpc(parsedResponse.function, parsedResponse.params);

        if (error) {
          console.error('Supabase RPC Error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        aiResponse = `I've made the changes for you. Is there anything else?`;
      }
    } catch (e) {
      // Not a JSON RPC call, treat as a text response.
    }

    return new Response(JSON.stringify({ result: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in analyze-projects function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});