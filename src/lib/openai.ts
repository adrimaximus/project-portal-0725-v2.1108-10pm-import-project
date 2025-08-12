import OpenAI from 'openai';
import { Goal } from '@/types';
import { Project } from '@/data/projects';
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

  const tagsText = goal.tags && goal.tags.length > 0 ? goal.tags.map(t => t.name).join(', ') : 'Tidak ada';

  const basePrompt = `
    Anda adalah seorang Pelatih Sasaran AI yang ahli. Nada bicara Anda sangat memotivasi, berwawasan luas, dan kolaboratif. Anda memberikan nasihat yang jelas dan dapat ditindaklanjuti untuk membantu pengguna dan tim mereka mencapai tujuan. Respons Anda harus dalam Bahasa Indonesia.
    Gunakan semua data sasaran yang tersedia untuk memberikan saran yang sangat relevan. Jadilah sedikit lebih kreatif dalam memberikan semangat dan gunakan 1-2 emoji yang relevan untuk menambah sentuhan personal. 🚀

    **Data Sasaran Utama:**
    - Judul: ${goal.title}
    - Deskripsi: ${goal.description}
    - Periode Target: ${goal.target_period || 'Tidak ditentukan'}
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
      1. Berikan **analisis tajam dan ringkas** tentang performa di bulan ${name}.
      2. Gunakan format markdown **bold** untuk menyorot angka-angka penting (seperti **${percentage}%**, **${completedCount}**, dan **${possibleCount}**).
      3. **Jika performa >= 100%:** Berikan apresiasi luar biasa.
      4. **Jika performa antara 60% dan 99%:** Berikan motivasi dan penguatan positif.
      5. **Jika performa < 60%:** Berikan dorongan semangat dan **satu tips paling berdampak** untuk meningkatkan konsistensi.
      6. Pastikan kalimat Anda selesai dan tidak terpotong.
      7. Jangan tambahkan salam penutup atau tanda tangan.
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

    const target = goal.type === 'quantity' ? goal.target_quantity : goal.target_value;
    const totalProgress = goal.completions
        .filter(c => getYear(parseISO(c.date)) === currentYear)
        .reduce((sum, c) => sum + c.value, 0);
    const toGo = target ? Math.max(0, target - totalProgress) : 0;

    let progressSummary = `Progres saat ini adalah ${context.yearly.percentage}% dari target tahunan.`;
    if (target) {
      progressSummary += ` ${totalProgress.toLocaleString()} dari ${target.toLocaleString()} ${goal.unit || ''} telah tercapai. Sisa ${toGo.toLocaleString()} untuk mencapai target.`;
    }

    contextPrompt = `
      Berikan **analisis tahunan yang tajam dan ringkas**.

      **Data Tambahan Tahunan:**
      - Progres: ${progressSummary}
      - Sisa Waktu: ${daysLeft} hari tersisa di periode ini.
      - Kolaborator: ${collaboratorText}

      **Instruksi Respons Tahunan:**
      1. Gunakan format markdown **bold** untuk menyorot angka-angka penting (seperti persentase, progres total, target, sisa hari) dan nama kolaborator.
      2.  **Jika progres >= 100%:** Mulai dengan **apresiasi** yang kuat.
      3.  **Jika progres antara 60% dan 99%:** Berikan **motivasi** dan penguatan positif.
      4.  **Jika progres < 60%:** Berikan **dorongan semangat** yang kuat dan **1-2 strategi paling berdampak** untuk membantu mereka kembali ke jalur yang benar.
      5.  Sebutkan pentingnya kolaborasi jika ada anggota tim.
      6.  Gunakan format markdown. Pastikan kalimat Anda selesai dan tidak terpotong.
      7.  Jangan tambahkan salam penutup atau tanda tangan.
    `;
  } else {
    return "Konteks tidak cukup untuk memberikan wawasan.";
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: basePrompt + contextPrompt }],
      max_tokens: 1024,
      temperature: 0.75,
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

export async function generateAiTasks(project: Project): Promise<string[]> {
  const openai = getOpenAIClient();

  const prompt = `
    Berdasarkan detail proyek berikut, buatlah daftar 5 tugas awal yang dipecah. Tugas-tugas ini harus menjadi langkah-langkah logis pertama untuk memulai proyek.

    Detail Proyek:
    - Judul: ${project.name}
    - Deskripsi: ${project.description}
    - Layanan: ${(project.services || []).join(', ')}
    - Tanggal Mulai: ${project.startDate}
    - Tanggal Selesai: ${project.dueDate}

    Instruksi:
    - Tugas harus jelas, dapat ditindaklanjuti, dan ringkas.
    - Kembalikan respons sebagai array JSON dari string. Contoh: ["Tentukan ruang lingkup proyek", "Buat mockup awal", "Siapkan lingkungan pengembangan"].
    - Jangan sertakan penjelasan atau teks pengantar di luar array JSON.
    - Respons harus dalam Bahasa Indonesia.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("AI mengembalikan respons kosong.");
    }

    const parsed = JSON.parse(content);
    
    const tasksArray = Array.isArray(parsed) 
      ? parsed 
      : Object.values(parsed).find(value => Array.isArray(value) && value.every(item => typeof item === 'string'));

    if (!tasksArray) {
      throw new Error("Tidak dapat menemukan array tugas dalam respons AI.");
    }

    return tasksArray;

  } catch (error) {
    console.error("Error generating AI tasks:", error);
    throw new Error("Gagal menghasilkan tugas dari AI. Silakan periksa koneksi OpenAI Anda dan coba lagi.");
  }
}