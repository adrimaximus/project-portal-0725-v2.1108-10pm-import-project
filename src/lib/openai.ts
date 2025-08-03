import OpenAI from 'openai';
import { Goal } from '@/data/goals';
import { User } from '@/data/users';
import { getYear, parseISO, endOfYear, differenceInDays } from 'date-fns';

function getOpenAIClient() {
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    throw new Error("Kunci API OpenAI tidak ditemukan. Silakan hubungkan akun OpenAI Anda di pengaturan.");
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export async function generateAiInsight(
  goal: Goal, 
  context: { 
    yearly?: { percentage: number };
    month?: { name: string; percentage: number; completedCount: number; possibleCount: number; };
  }
) {
  const openai = getOpenAIClient();

  const tagsText = goal.tags && goal.tags.length > 0 ? goal.tags.join(', ') : 'Tidak ada';

  const basePrompt = `
    Anda adalah seorang Pelatih Sasaran AI yang ahli. Nada bicara Anda sangat memotivasi, berwawasan luas, dan kolaboratif. Anda memberikan nasihat yang jelas dan dapat ditindaklanjuti untuk membantu pengguna dan tim mereka mencapai tujuan. Respons Anda harus dalam Bahasa Indonesia.
    Gunakan semua data sasaran yang tersedia untuk memberikan saran yang sangat relevan.

    **Data Sasaran Utama:**
    - Judul: ${goal.title}
    - Deskripsi: ${goal.description}
    - Periode Target: ${goal.targetPeriod || 'Tidak ditentukan'}
    - Tag Kustom: ${tagsText}
  `;

  let contextPrompt = '';

  if (context.month) {
    const { name, percentage, completedCount, possibleCount } = context.month;
    contextPrompt = `
      Fokus pada ulasan untuk bulan **${name}**.

      **Data Bulanan (${name}):**
      - Performa: ${percentage}% tercapai.
      - Detail: ${completedCount} dari ${possibleCount} hari target telah diselesaikan.

      **Instruksi Respons Bulanan:**
      1. Berikan ulasan singkat tentang performa di bulan ${name}.
      2. **Jika performa >= 100%:** Berikan apresiasi luar biasa.
      3. **Jika performa antara 60% dan 99%:** Berikan motivasi dan penguatan positif, sebutkan mereka di jalur yang benar.
      4. **Jika performa < 60%:** Berikan dorongan semangat. Berdasarkan **semua data sasaran utama**, berikan **1-2 tips praktis dan relevan** untuk meningkatkan konsistensi.
      5. Jaga agar tetap singkat (2-4 kalimat).
    `;
  } else if (context.yearly) {
    const today = new Date();
    const currentYear = getYear(today);
    const endOfPeriod = endOfYear(today);
    const daysLeft = differenceInDays(endOfPeriod, today);

    const collaborators = goal.collaborators.map(c => c.name);
    const collaboratorText = collaborators.length > 0 
      ? `Tim Anda (${collaborators.join(', ')}) juga terlibat dalam sasaran ini.` 
      : "Anda mengerjakan sasaran ini sendirian.";

    const target = goal.type === 'quantity' ? goal.targetQuantity : goal.targetValue;
    const totalProgress = goal.completions
        .filter(c => getYear(parseISO(c.date)) === currentYear)
        .reduce((sum, c) => sum + c.value, 0);
    const toGo = target ? Math.max(0, target - totalProgress) : 0;

    let progressSummary = `Progres saat ini adalah ${context.yearly.percentage}% dari target tahunan.`;
    if (target) {
      progressSummary += ` ${totalProgress.toLocaleString()} dari ${target.toLocaleString()} ${goal.unit || ''} telah tercapai. Sisa ${toGo.toLocaleString()} untuk mencapai target.`;
    }

    contextPrompt = `
      Analisis data sasaran tahunan berikut.

      **Data Tambahan Tahunan:**
      - Progres: ${progressSummary}
      - Sisa Waktu: ${daysLeft} hari tersisa di periode ini.
      - Kolaborator: ${collaboratorText}

      **Instruksi Respons Tahunan:**
      1.  **Jika progres >= 100%:** Mulai dengan **apresiasi** yang kuat.
      2.  **Jika progres antara 60% dan 99%:** Berikan **motivasi** dan penguatan positif.
      3.  **Jika progres < 60%:** Berikan **dorongan semangat** yang kuat. Berdasarkan **semua data sasaran utama**, berikan **2-3 tips dan strategi praktis** yang dapat ditindaklanjuti untuk membantu mereka kembali ke jalur yang benar.
      4.  Sebutkan pentingnya kolaborasi jika ada anggota tim.
      5.  Gunakan format markdown. Jaga agar respons tetap singkat dan padat (sekitar 3-5 kalimat).
    `;
  } else {
    return "Konteks tidak cukup untuk memberikan wawasan.";
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: basePrompt + contextPrompt }],
      max_tokens: 300,
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching AI coach insight:", error);
    return "Maaf, saya tidak dapat menghasilkan wawasan saat ini. Teruslah berusaha!";
  }
}

export async function generateAiIcon(prompt: string): Promise<string> {
  const openai = getOpenAIClient();
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A minimalist, vector-style icon for a goal tracking app. The icon should be simple, clean, and on a solid, single-color background. The subject is: "${prompt}"`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("Image generation failed, no URL returned.");
    }
    return imageUrl;
  } catch (error) {
    console.error("Error generating icon with DALL-E:", error);
    throw new Error("Failed to generate icon. Please try again.");
  }
}