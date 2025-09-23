// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';
import OpenAI from 'npm:openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const getOpenAIClient = async (supabaseAdmin) => {
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    throw new Error("OpenAI API key is not configured by an administrator.");
  }
  return new OpenAI({ apiKey: config.value });
};

const systemPrompt = `You are a powerful and helpful AI assistant integrated into a project management application. Your primary role is to assist users by answering questions and performing actions using the tools available to you.

- **Be Conversational and Helpful**: Maintain a friendly and professional tone.
- **Use Your Tools**: When a user asks you to perform an action (like creating something), use the appropriate tool. You MUST generate the necessary content (like an article body) BEFORE calling the tool.
- **Confirm Actions**: After successfully using a tool, confirm the action to the user. For example, "I've created the article for you. You can view it here."
- **Seek Clarification**: If a request is ambiguous, ask for more details.
- **Default to Chat**: If you cannot fulfill a request with a tool, or if it's a general question, respond as a helpful chatbot.
- **Language**: Respond in the user's language. The default is Indonesian.
- **Article Creation**: When creating an article, you MUST also provide relevant 'unsplash_search_terms' for finding a header image.`;

const tools = [
  {
    type: "function",
    function: {
      name: "create_kb_article",
      description: "Creates a new knowledge base article. The AI should generate the content for the article itself.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the article.",
          },
          content_html: {
            type: "string",
            description: "The full content of the article, formatted as a single HTML string.",
          },
          unsplash_search_terms: {
            type: "array",
            items: { type: "string" },
            description: "An array of 2-3 relevant keywords to search for a header image on Unsplash."
          }
        },
        required: ["title", "content_html", "unsplash_search_terms"],
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { payload } = await req.json();
    const { prompt, conversationHistory } = payload;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const openai = await getOpenAIClient(supabaseAdmin);

    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: "user", content: prompt }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      const availableFunctions = { create_kb_article: createKbArticle };
      messages.push(responseMessage);

      const toolCall = toolCalls[0]; // Assuming one tool call for now
      const functionName = toolCall.function.name;
      const functionToCall = availableFunctions[functionName];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      const functionResponse = await functionToCall({
        ...functionArgs,
        supabaseAdmin,
        user,
      });

      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: functionName,
        content: JSON.stringify(functionResponse),
      });

      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: messages,
      });

      return new Response(JSON.stringify({
        type: 'article_created',
        content: secondResponse.choices[0].message.content,
        articleSlug: functionResponse.slug,
        unsplashSearchTerms: functionArgs.unsplash_search_terms,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ type: 'chat', content: responseMessage.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function createKbArticle({ title, content_html, supabaseAdmin, user }) {
  try {
    const { data: folderId, error: folderError } = await supabaseAdmin.rpc('create_default_kb_folder', { p_user_id: user.id });
    if (folderError) throw new Error(`Failed to get default folder: ${folderError.message}`);

    const { data: newArticle, error: articleError } = await supabaseAdmin
      .rpc('upsert_article_with_tags', {
        p_id: null,
        p_title: title,
        p_content: { html: content_html },
        p_folder_id: folderId,
        p_header_image_url: null,
        p_tags: null,
        p_custom_tags: null,
        p_user_id: user.id,
      })
      .select('id, slug')
      .single();

    if (articleError) throw new Error(`Failed to create article in DB: ${articleError.message}`);
    
    return { success: true, id: newArticle.id, slug: newArticle.slug };
  } catch (e) {
    return { success: false, error: e.message };
  }
}