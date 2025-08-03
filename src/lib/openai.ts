import OpenAI from 'openai';

// Fungsi ini sekarang membuat dan mengembalikan instance OpenAI baru setiap kali dipanggil.
// Ini memastikan bahwa kunci API terbaru dari localStorage selalu digunakan.
const getOpenAIClient = (): OpenAI | null => {
  try {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      return null;
    }
    return new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
  } catch (error) {
    console.warn('Tidak dapat mengakses localStorage atau menginisialisasi klien OpenAI.');
    return null;
  }
};

export const generateAiInsight = async (prompt: string): Promise<string> => {
  const openai = getOpenAIClient();

  if (!openai) {
    return "Kunci OpenAI API tidak dikonfigurasi. Silakan tambahkan kunci Anda di pengaturan aplikasi.";
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: "Anda adalah seorang AI Coach untuk aplikasi pelacak tujuan. Nada Anda suportif, memotivasi, dan penuh wawasan. Anda memberikan umpan balik untuk membantu pengguna dan kolaborator mereka tetap terlibat dan tekun. Gunakan data yang diberikan untuk memberikan saran yang spesifik, memberi semangat, dan dapat ditindaklanjuti. Jaga agar respons Anda singkat, sekitar 2-4 kalimat."
        },
        {
          role: 'user',
          content: prompt,
        }
      ],
      max_tokens: 150,
    });
    return completion.choices[0]?.message?.content || "Maaf, saya tidak dapat menghasilkan wawasan saat ini.";
  } catch (error) {
    console.error("Error fetching AI insight:", error);
    if (error instanceof OpenAI.APIError && error.status === 401) {
        return "Kunci OpenAI API tidak valid. Silakan periksa kembali kunci Anda di pengaturan.";
    }
    return "Terjadi kesalahan saat terhubung dengan AI Coach. Silakan coba lagi nanti.";
  }
};