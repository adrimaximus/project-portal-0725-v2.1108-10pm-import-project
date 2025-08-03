import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import OpenAI from 'openai';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
      Berdasarkan data ini, berikan saya saran yang membangun.
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Anda adalah seorang mentor AI yang suportif dan proaktif. Analisis ringkasan suasana hati pengguna dan berikan saran yang dapat ditindaklanjuti. Dorong pengguna untuk berbagi perasaan atau mencari masukan dari orang tepercaya di sekitar mereka (seperti keluarga, teman, atau rekan kerja). Hindari menawarkan diri sebagai pendengar. Jaga agar respons Anda tetap singkat (2-3 kalimat), hangat, memberdayakan, dan selalu dalam Bahasa Indonesia." },
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

  const dominantMood = data.length > 0 ? data.reduce((prev, current) => (prev.value > current.value) ? prev : current) : null;

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
    <div 
      className={cn("mt-4 p-4 rounded-lg transition-colors duration-300", !dominantMood && "bg-secondary")}
      style={dominantMood ? { backgroundColor: `${dominantMood.color}20` } : {}}
    >
      <div className="flex items-start gap-3">
        <div 
          className={cn("p-2 rounded-full transition-colors duration-300", !dominantMood && "bg-primary/10")}
          style={dominantMood ? { backgroundColor: `${dominantMood.color}30` } : {}}
        >
            <Lightbulb 
              className={cn("h-5 w-5 transition-colors duration-300", !dominantMood && "text-primary")}
              style={dominantMood ? { color: dominantMood.color, filter: 'brightness(75%)' } : {}}
            />
        </div>
        <div>
            <h4 
              className="font-semibold text-sm transition-colors duration-300"
              style={dominantMood ? { color: dominantMood.color, filter: 'brightness(75%)' } : {}}
            >
              Pikiran dari Teman AI-mu
            </h4>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AiFriendSuggestion;