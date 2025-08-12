import { Project } from "@/data/projects";
import { Goal } from "@/types";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const generateSystemPrompt = (project: Project) => {
  return `Anda adalah asisten AI yang berspesialisasi dalam manajemen proyek dan komunikasi klien untuk agensi digital di Indonesia. Tugas Anda adalah menghasilkan ringkasan proyek (project brief) yang jelas, profesional, dan mudah dipahami untuk klien.

Informasi Proyek Saat Ini:
- Nama Proyek: ${project.name}
- Kategori: ${project.category}
- Deskripsi: ${project.description}
- Layanan: ${(project.services || []).join(', ')}
- Tanggal Mulai: ${project.startDate}
- Tanggal Selesai: ${project.dueDate}
- Anggaran: Rp ${project.budget.toLocaleString('id-ID')}
- Status: ${project.status}

Aturan:
1.  Gunakan Bahasa Indonesia yang formal dan sopan.
2.  Sapa klien dengan nama proyeknya.
3.  Struktur brief harus mencakup: Pendahuluan, Ruang Lingkup Proyek, Timeline, Anggaran, dan Penutup.
4.  Pada bagian Ruang Lingkup, jelaskan layanan yang diberikan berdasarkan data.
5.  Pada bagian Timeline, sebutkan tanggal mulai dan selesai.
6.  Pada bagian Anggaran, sebutkan total anggaran yang disetujui.
7.  Pada bagian Penutup, sampaikan antusiasme untuk berkolaborasi dan berikan ruang untuk diskusi lebih lanjut.
8.  JANGAN membuat informasi baru. Hanya gunakan data yang disediakan.
9.  Format output sebagai teks biasa, tanpa markdown.
`;
};

export const generateProjectBrief = async (project: Project): Promise<string> => {
  try {
    const systemPrompt = generateSystemPrompt(project);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: "Tolong hasilkan brief proyek berdasarkan informasi yang diberikan.",
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return response.choices[0].message.content || "Tidak dapat menghasilkan brief.";
  } catch (error) {
    console.error("Error generating project brief:", error);
    return "Terjadi kesalahan saat mencoba menghasilkan brief proyek. Silakan coba lagi nanti.";
  }
};

const generateTaskSuggestionsSystemPrompt = (project: Project, existingTasks: { title: string }[]) => {
  const existingTaskTitles = existingTasks.map(t => `- ${t.title}`).join('\n');
  return `Anda adalah asisten AI untuk manajer proyek. Tugas Anda adalah menyarankan daftar tugas (task list) untuk sebuah proyek berdasarkan deskripsi dan layanannya.

Informasi Proyek:
- Nama Proyek: ${project.name}
- Deskripsi: ${project.description}
- Layanan yang diberikan: ${(project.services || []).join(', ')}

Tugas yang Sudah Ada:
${existingTaskTitles.length > 0 ? existingTaskTitles : "- Belum ada tugas."}

Aturan:
1.  Analisis deskripsi dan layanan proyek untuk mengidentifikasi pekerjaan yang perlu dilakukan.
2.  Hasilkan daftar tugas yang relevan dan dapat ditindaklanjuti.
3.  JANGAN menyarankan tugas yang sudah ada di daftar "Tugas yang Sudah Ada".
4.  Format output sebagai array JSON dari string. Setiap string adalah judul tugas.
5.  Contoh Output: ["Desain Mockup UI/UX", "Pengembangan Komponen Frontend", "Setup Database", "Implementasi API Endpoint"]
6.  Hasilkan antara 3 hingga 7 saran tugas.
7.  Jika deskripsi terlalu umum, berikan saran tugas generik yang relevan dengan kategori proyek.
`;
};

export const generateTaskSuggestions = async (project: Project, existingTasks: { title: string }[]): Promise<string[]> => {
    try {
        const systemPrompt = generateTaskSuggestionsSystemPrompt(project, existingTasks);
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: "Berdasarkan detail proyek, tolong berikan beberapa saran tugas dalam format array JSON.",
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.5,
        });

        const content = response.choices[0].message.content;
        if (!content) {
            return [];
        }
        
        // GPT might return a JSON object with a key, e.g., { "tasks": [...] }
        const parsedContent = JSON.parse(content);
        if (Array.isArray(parsedContent)) {
            return parsedContent;
        }
        if (typeof parsedContent === 'object' && parsedContent !== null) {
            const key = Object.keys(parsedContent)[0];
            if (key && Array.isArray(parsedContent[key])) {
                return parsedContent[key];
            }
        }

        return [];
    } catch (error) {
        console.error("Error generating task suggestions:", error);
        return [];
    }
};

export const generateAiInsight = async (goal: Goal, context: any): Promise<string> => {
  console.log("AI Insight generation requested for:", goal.title, context);
  // This is a mock implementation
  await new Promise(resolve => setTimeout(resolve, 1000));
  return `Here is an AI-generated insight for your goal "${goal.title}". Based on your progress, you are doing great! Keep it up.`;
};

export const generateAiIcon = async (prompt: string): Promise<string> => {
  console.log("AI Icon generation requested with prompt:", prompt);
  // This is a mock implementation
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Returning a placeholder image URL
  return `https://via.placeholder.com/128/4ECDC4/FFFFFF?text=AI`;
};