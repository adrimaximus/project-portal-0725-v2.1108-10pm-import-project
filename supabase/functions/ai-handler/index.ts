// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';
import OpenAI from 'npm:openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const createSupabaseAdmin = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
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

const featurePrompts = {
  'generate-caption': `You are an AI that generates a short, inspiring, one-line caption for an image. The caption should be suitable for a professional dashboard related to events, marketing, and project management. Respond with ONLY the caption, no extra text or quotes. Keep it under 12 words.`,
  'analyze-duplicates': `You are a data quality assistant. Here is a list of potential duplicate contacts. Summarize the findings in a friendly, concise paragraph in markdown format. Mention the total number of pairs found and the common reasons (e.g., 'similar names or shared emails'). Then, recommend that the user review and merge them to keep their contact list clean.`,
  'generate-mood-insight': `Anda adalah seorang teman AI yang suportif, empatik, dan berwawasan luas. Tujuan Anda adalah untuk terlibat dalam percakapan yang mendukung dengan pengguna tentang suasana hati dan perasaan mereka. Anda akan menerima riwayat percakapan. Tugas Anda adalah memberikan respons berikutnya dalam percakapan tersebut. Pertahankan nada yang positif dan memotivasi. Sapa pengguna dengan nama mereka jika ini adalah awal percakapan. Jaga agar respons tetap sangat ringkas, maksimal 2 kalimat, dan terasa seperti percakapan alami. Jangan mengulangi diri sendiri. Fokus percakapan ini adalah murni pada kesejahteraan emosional. Jangan membahas topik lain seperti proyek, tugas, atau tujuan kerja kecuali jika pengguna secara eksplisit mengungkitnya terlebih dahulu dalam konteks perasaan mereka. Selalu berikan respons dalam Bahasa Indonesia.`,
  'suggest-icon': `You are an AI assistant that suggests the best icon for a given title from a list. Your response must be ONLY the name of the icon from the list provided, with no extra text, explanation, or punctuation.`,
  'generate-article-from-title': `You are an expert writer. Generate a well-structured article in HTML format based on the user's title. Include an introduction, key points in a list, and a conclusion.`,
  'expand-article-text': `You are an expert writer. Expand upon the following selected text within the context of the full article. Maintain the original tone and seamlessly integrate the new content. Return only the expanded text in HTML format.`,
  'improve-article-content': `You are an expert editor. Improve the clarity, engagement, and structure of the following article content. Return the full revised article in HTML format.`,
  'summarize-article-content': `Summarize the following content into a concise paragraph. Return the summary in HTML format.`
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { feature, payload } = await req.json();
    if (!feature || !featurePrompts[feature]) {
      throw new Error(`Feature "${feature}" is not supported.`);
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);

    let userPrompt = "";
    if (feature === 'generate-caption') userPrompt = `Generate a caption for an image described as: "${payload.altText}"`;
    if (feature === 'analyze-duplicates') userPrompt = `Analyze these potential duplicates:\n${JSON.stringify(payload.duplicates, null, 2)}`;
    if (feature === 'generate-mood-insight') userPrompt = payload.prompt;
    if (feature === 'suggest-icon') userPrompt = `Title: "${payload.title}"\n\nIcons: [${payload.icons.join(', ')}]`;
    if (feature === 'generate-article-from-title') userPrompt = `Title: ${payload.title}`;
    if (feature === 'expand-article-text') userPrompt = `Full Article Context:\n${payload.fullContent}\n\nSelected Text to Expand:\n${payload.selectedText}`;
    if (feature === 'improve-article-content') userPrompt = `Original Content:\n${payload.content}`;
    if (feature === 'summarize-article-content') userPrompt = `Content to Summarize:\n${payload.content}`;

    const messages = [
      { role: "system", content: featurePrompts[feature] },
    ];

    if (feature === 'generate-mood-insight' && payload.conversationHistory) {
      messages.push(...payload.conversationHistory.map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })));
    }
    messages.push({ role: "user", content: userPrompt });

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      temperature: 0.5,
    });

    const result = response.choices[0].message.content?.trim();

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