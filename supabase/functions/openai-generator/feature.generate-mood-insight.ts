// @ts-nocheck
export default async function generateMoodInsight(payload, context) {
  const { openai } = context;
  const { prompt, userName, conversationHistory } = payload;
  if (!prompt) {
    throw new Error("Prompt is required for generating mood insights.");
  }

  const systemPrompt = `Anda adalah seorang teman AI yang suportif, empatik, dan berwawasan luas. Tujuan Anda adalah untuk terlibat dalam percakapan yang mendukung dengan pengguna tentang suasana hati dan perasaan mereka. Anda akan menerima riwayat percakapan. Tugas Anda adalah memberikan respons berikutnya dalam percakapan tersebut. Pertahankan nada yang positif dan memotivasi. Sapa pengguna dengan nama mereka jika ini adalah awal percakapan. Jaga agar respons tetap sangat ringkas, maksimal 2 kalimat, dan terasa seperti percakapan alami. Jangan mengulangi diri sendiri. Fokus percakapan ini adalah murni pada kesejahteraan emosional. Jangan membahas topik lain seperti proyek, tugas, atau tujuan kerja kecuali jika pengguna secara eksplisit mengungkitnya terlebih dahulu dalam konteks perasaan mereka. Selalu berikan respons dalam Bahasa Indonesia.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(conversationHistory || []).map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: "user", content: prompt }
  ];
  
  if (messages.length > 2 && messages[messages.length-2].role === 'user' && messages[messages.length-2].content === prompt) {
    messages.splice(messages.length-2, 1);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: messages,
    temperature: 0.7,
    max_tokens: 200,
  });

  return { result: response.choices[0].message.content };
}