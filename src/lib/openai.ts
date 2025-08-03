import OpenAI from 'openai';

// PERINGATAN: Ini tidak aman untuk produksi.
// Di aplikasi sungguhan, logika ini harus berada di server.
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Diperlukan untuk penggunaan di sisi klien
});

interface InsightParams {
    goalTitle: string;
    goalDescription: string;
    goalTags: string[];
    collaboratorText: string;
    timePeriod: string;
    percentage: number;
    completedCount: number;
    possibleCount: number;
}

export async function generateCoachInsight({
    goalTitle,
    goalDescription,
    goalTags,
    collaboratorText,
    timePeriod,
    percentage,
    completedCount,
    possibleCount,
}: InsightParams): Promise<string> {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
        return "Kunci API OpenAI belum dikonfigurasi. Silakan tambahkan VITE_OPENAI_API_KEY ke file .env.local Anda.";
    }

    const prompt = `
Anda adalah Pelatih AI, mitra yang suportif dan memotivasi bagi pengguna yang mengerjakan tujuan pribadi mereka. Nada Anda memberi semangat, berwawasan, dan tidak pernah menghakimi. Anda membantu pengguna (atau tim) dengan tujuan mereka.

Berikut konteksnya:
- Judul Tujuan: "${goalTitle}"
- Alasan Tujuan ("Why"): "${goalDescription}"
- Tag Tujuan: ${goalTags.join(', ')}
- Pengguna: ${collaboratorText}
- Periode Waktu: ${timePeriod}
- Data Kinerja:
  - Tingkat Penyelesaian: ${percentage}%
  - Selesai: ${completedCount} kali
  - Kemungkinan: ${possibleCount} kali

Berdasarkan data ini, berikan wawasan yang ringkas, personal, dan memberi semangat dalam Bahasa Indonesia (2-4 kalimat, maks 60 kata).
- Jika kinerja tinggi (>=80%), rayakan kesuksesan mereka dan hubungkan dengan "Why" atau tag mereka.
- Jika kinerja rata-rata (40-79%), akui usaha mereka, identifikasi sebagai kemajuan, dan sarankan langkah kecil yang dapat ditindaklanjuti untuk perbaikan.
- Jika kinerja rendah (<40%), bersikaplah lembut dan suportif. Ingatkan mereka bahwa kemunduran itu normal dan dorong mereka untuk merenungkan tantangan tanpa mengecilkan hati. Bingkai sebagai kesempatan belajar.
- Jika tidak ada data (possibleCount adalah 0), berikan pesan sambutan dan motivasi untuk memulai.
- Sapa pengguna secara langsung menggunakan nama yang diberikan.
`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 150,
        });
        return response.choices[0].message.content || "Saya kesulitan menemukan kata-kata yang tepat. Mari coba lagi nanti.";
    } catch (error) {
        console.error("Error fetching insight from OpenAI:", error);
        return "Maaf, saya tidak dapat menghasilkan wawasan saat ini. Silakan periksa kunci API dan koneksi jaringan Anda.";
    }
}