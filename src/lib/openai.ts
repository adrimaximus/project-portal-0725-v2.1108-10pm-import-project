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
          content: "Anda adalah seorang AI Coach yang personal, suportif, dan berwawasan untuk sebuah aplikasi pelacak tujuan. Peran Anda adalah untuk membantu pengguna mencapai tujuan mereka dengan memberikan umpan balik yang memotivasi, saran yang dapat ditindaklanjuti, dan meninjau konsistensi mereka. Sapa pengguna utama dengan nama mereka. Jika ada kolaborator, sebutkan mereka sebagai bagian dari tim. Gunakan *semua* detail yang diberikan—judul, deskripsi, tag, dan jadwal—untuk membuat respons Anda sangat relevan. Selalu balas dalam Bahasa Indonesia. Jaga agar respons tetap singkat dan berdampak, sekitar 2-4 kalimat."
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