import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import OpenAI from 'openai';
import { Skeleton } from '@/components/ui/skeleton';

type Period = 'week' | 'month' | 'year';

interface AiFriendSuggestionProps {
  data: (Mood & { value: number })[];
  period: Period;
  userName: string;
}

const AiFriendSuggestion: React.FC<AiFriendSuggestionProps> = ({ data, period, userName }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedStatus = localStorage.getItem("openai_connected");
    const isNowConnected = storedStatus === "true";
    setIsConnected(isNowConnected);

    if (isNowConnected) {
      fetchAiInsight();
    }
  }, [data, period, userName]);

  const fetchAiInsight = async () => {
    setIsLoading(true);
    setError('');
    setInsight('');

    const apiKey = localStorage.getItem("openai_api_key");
    if (!apiKey) {
      setError("Kunci API OpenAI tidak ditemukan. Silakan hubungkan di halaman pengaturan.");
      setIsLoading(false);
      return;
    }

    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const periodInIndonesian = {
      week: 'minggu',
      month: 'bulan',
      year: 'tahun'
    }[period];

    const moodSummary = data.length > 0 
      ? data.map(mood => `${mood.label} (${mood.value} kali)`).join(', ')
      : 'belum ada data suasana hati yang tercatat';

    const prompt = `
      Nama saya ${userName}. Selama ${periodInIndonesian} terakhir, ringkasan suasana hati saya adalah: ${moodSummary}.
      Tolong bertindak sebagai teman AI yang bijak, ramah, dan pengertian. Berikan saya penghiburan, masukan yang bijak, dan jadilah pendengar yang baik.
      Tanggapan Anda harus dalam Bahasa Indonesia, hangat, lembut, dan singkat (sekitar 2-3 kalimat).
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Anda adalah teman AI yang bijak, ramah, dan pengertian. Peran Anda adalah menjadi pendengar yang baik dan memberikan penghiburan serta masukan yang bijak berdasarkan data suasana hati pengguna. Berbicaralah dengan nada yang hangat dan lembut. Jaga agar respons Anda tetap singkat, sekitar 2-3 kalimat, dan selalu dalam Bahasa Indonesia." },
          { role: "user", content: prompt }
        ],
      });

      const result = completion.choices[0]?.message?.content;
      if (result) {
        setInsight(result);
      } else {
        setError("Gagal mendapatkan masukan dari AI. Coba lagi nanti.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat menghubungi AI. Pastikan kunci API Anda valid.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="mt-4 p-4 bg-secondary rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-2">Hubungkan akun OpenAI Anda untuk mendapatkan wawasan yang dipersonalisasi dan saran ramah berdasarkan riwayat suasana hati Anda.</p>
        <Button asChild size="sm">
          <Link to="/settings/integrations/openai">Hubungkan OpenAI</Link>
        </Button>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
    }
    if (error) {
      return <p className="text-sm text-destructive mt-1">{error}</p>;
    }
    if (insight) {
      return <p className="text-sm text-muted-foreground mt-1">{insight}</p>;
    }
    return null;
  };

  return (
    <div className="mt-4 p-4 bg-secondary rounded-lg">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-full">
            <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div>
            <h4 className="font-semibold text-sm">Pikiran dari Teman AI-mu</h4>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AiFriendSuggestion;