// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';
import OpenAI from 'npm:openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Function to get OpenAI client, ensuring API key is configured
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

// Prompts for different features
const prompts = {
  'generate-mood-insight': `Anda adalah seorang teman AI yang suportif, empatik, dan berwawasan luas. Tujuan Anda adalah untuk terlibat dalam percakapan yang mendukung dengan pengguna tentang suasana hati dan perasaan mereka. Anda akan menerima riwayat percakapan. Tugas Anda adalah memberikan respons berikutnya dalam percakapan tersebut. Pertahankan nada yang positif dan memotivasi. Sapa pengguna dengan nama mereka jika ini adalah awal percakapan. Jaga agar respons tetap sangat ringkas, maksimal 2 kalimat, dan terasa seperti percakapan alami. Jangan mengulangi diri sendiri. Fokus percakapan ini adalah murni pada kesejahteraan emosional. Jangan membahas topik lain seperti proyek, tugas, atau tujuan kerja kecuali jika pengguna secara eksplisit mengungkitnya terlebih dahulu dalam konteks perasaan mereka. Selalu berikan respons dalam Bahasa Indonesia.`,
  'analyze-duplicates': `You are a data quality assistant. Here is a list of potential duplicate contacts. Summarize the findings in a friendly, concise paragraph in markdown format. Mention the total number of pairs found and the common reasons (e.g., 'similar names or shared emails'). Then, recommend that the user review and merge them to keep their contact list clean.`,
  'generate-article-from-title': `You are an expert writer. Generate a well-structured, high-quality article in HTML format based on the provided title. The article should have an introduction, several paragraphs with valuable insights, and a conclusion. Use headings (h2, h3) and lists (ul, ol) where appropriate.`,
  'expand-article-text': `You are an expert writer. The user has provided an entire article and a selected piece of text from it. Your task is to expand upon the selected text, adding more detail, examples, or depth, while maintaining the tone and context of the full article. Return only the new, expanded HTML content for the selected portion.`,
  'improve-article-content': `You are an expert writer and editor. Review the following article content (in HTML format) and improve it. Focus on clarity, engagement, grammar, and structure. Return the improved article content in the same HTML format.`,
  'summarize-article-content': `You are an expert writer. Summarize the following article content (in HTML format) into a concise paragraph or a short bulleted list. Return the summary in HTML format.`,
  'suggest-icon': `You are an AI assistant that suggests the best icon for a given title from a list. Your response must be ONLY the name of the icon from the list provided, with no extra text, explanation, or punctuation.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { feature, payload } = await req.json();
    if (!feature || !prompts[feature]) {
      throw new Error(`Invalid or missing feature: ${feature}`);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const openai = await getOpenAIClient(supabaseAdmin);

    let userPrompt = "";
    let messages = [{ role: "system", content: prompts[feature] }];

    switch (feature) {
      case 'generate-mood-insight':
        userPrompt = payload.prompt;
        messages = [
          ...messages,
          ...(payload.conversationHistory || []).map(msg => ({
            role: msg.sender === 'ai' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: "user", content: userPrompt }
        ];
        break;
      case 'analyze-duplicates':
        userPrompt = `Analyze these potential duplicates:\n${JSON.stringify(payload.duplicates, null, 2)}`;
        messages.push({ role: "user", content: userPrompt });
        break;
      case 'generate-article-from-title':
        userPrompt = `Title: "${payload.title}"`;
        messages.push({ role: "user", content: userPrompt });
        break;
      case 'expand-article-text':
        userPrompt = `Full Article Context:\n\n${payload.fullContent}\n\nExpand this selected text:\n\n"${payload.selectedText}"`;
        messages.push({ role: "user", content: userPrompt });
        break;
      case 'improve-article-content':
        userPrompt = `Improve this content:\n\n${payload.content}`;
        messages.push({ role: "user", content: userPrompt });
        break;
      case 'summarize-article-content':
        userPrompt = `Summarize this content:\n\n${payload.content}`;
        messages.push({ role: "user", content: userPrompt });
        break;
      case 'suggest-icon':
        userPrompt = `Title: "${payload.title}"\n\nIcons: [${payload.icons.join(', ')}]`;
        messages.push({ role: "user", content: userPrompt });
        break;
      default:
        throw new Error(`Unhandled feature: ${feature}`);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      temperature: 0.5,
    });

    const result = response.choices[0].message.content;

    return new Response(JSON.stringify({ result }), {
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