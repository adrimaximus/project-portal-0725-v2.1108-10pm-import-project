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

export async function generateAiInsight(goal: Goal, progress: { percentage: number } | null) {
  const openai = getOpenAIClient();

  // --- Gather Rich Context Data ---
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

  let progressSummary = `Progres saat ini adalah ${progress?.percentage ?? 0}% dari target tahunan.`;
  if (target) {
    progressSummary += ` ${totalProgress.toLocaleString()} dari ${target.toLocaleString()} ${goal.unit || ''} telah tercapai. Sisa ${toGo.toLocaleString()} untuk mencapai target.`;
  }

  // --- Construct the Detailed Prompt ---
  const prompt = `
    Anda adalah seorang Pelatih Sasaran AI yang ahli. Nada bicara Anda sangat memotivasi, berwawasan luas, dan kolaboratif. Anda memberikan nasihat yang jelas dan dapat ditindaklanuti untuk membantu pengguna dan tim mereka mencapai tujuan. Respons Anda harus dalam Bahasa Indonesia.

    Analisis data sasaran berikut dan berikan umpan balik yang relevan.

    **Data Sasaran:**
    - Judul: ${goal.title}
    - Deskripsi: ${goal.description}
    - Tipe & Target: ${goal.type}, menargetkan ${target || goal.frequency} ${goal.unit || ''} per ${goal.targetPeriod}
    - Progres: ${progressSummary}
    - Sisa Waktu: ${daysLeft} hari tersisa di periode ini.
    - Kolaborator: ${collaboratorText}

    **Instruksi Respons:**
    1.  **Jika progres >= 100%:** Mulai dengan **apresiasi** yang kuat. Puji pencapaian luar biasa ini. Sebutkan bagaimana momentum ini bisa dipertahankan atau ditingkatkan.
    2.  **Jika progres antara 50% dan 99%:** Berikan **motivasi** dan penguatan positif. Sebutkan bahwa mereka berada di jalur yang benar. Berikan **saran** spesifik untuk memastikan sasaran tercapai.
    3.  **Jika progres < 50%:** Berikan **dorongan semangat** yang kuat, jangan mengkritik. Akui bahwa masih ada waktu. Berikan **Rencana Aksi** yang jelas dengan 2-3 langkah sederhana dan dapat ditindaklanjuti untuk meningkatkan progres.
    4.  Selalu sebutkan pentingnya kolaborasi jika ada anggota tim.
    5.  Gunakan format markdown (seperti **bold** dan daftar bernomor/poin) untuk keterbacaan. Jaga agar respons tetap singkat dan padat (sekitar 3-5 kalimat).
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
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