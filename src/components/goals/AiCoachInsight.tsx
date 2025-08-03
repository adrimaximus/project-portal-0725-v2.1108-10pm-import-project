import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import OpenAI from 'openai';
import { Skeleton } from '@/components/ui/skeleton';

interface AiCoachInsightProps {
  totalCompleted: number;
  totalPossible: number;
  overallPercentage: number;
  frequency: string;
  displayYear: number;
}

const AiCoachInsight: React.FC<AiCoachInsightProps> = ({ totalCompleted, totalPossible, overallPercentage, frequency, displayYear }) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCompleted, totalPossible, overallPercentage, frequency, displayYear]);

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

    if (totalPossible === 0) {
        setInsight(`Tahun ${displayYear} belum ada target yang dijadwalkan. Mari kita siapkan rencana untuk sukses!`);
        setIsLoading(false);
        return;
    }

    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const prompt = `
      Analisis data kemajuan tujuan pengguna untuk tahun ${displayYear}:
      - Frekuensi Target: ${frequency}
      - Total Sesi yang Direncanakan: ${totalPossible}
      - Total Sesi yang Selesai: ${totalCompleted}
      - Persentase Penyelesaian Keseluruhan: ${overallPercentage}%

      Berikan tanggapan sebagai pelatih profesional, motivator, dan trainer AI. Berikan wawasan, latihan (drill) singkat jika perlu, dan motivasi untuk menjaga pengguna tetap fokus, tekun, dan tidak mudah patah semangat.
      Tanggapan harus dalam Bahasa Indonesia, tajam, profesional, dan memotivasi. Jaga agar tetap singkat (2-3 kalimat).
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Anda adalah pelatih profesional, motivator, dan trainer AI. Tugas Anda adalah menganalisis kemajuan tujuan pengguna dan memberikan wawasan, latihan (drill), dan motivasi untuk menjaga mereka tetap fokus, tekun, dan tidak mudah menyerah. Berikan tanggapan yang tajam, profesional, dan memotivasi dalam Bahasa Indonesia. Jaga agar tetap singkat (2-3 kalimat)." },
          { role: "user", content: prompt }
        ],
      });

      const result = completion.choices[0]?.message?.content;
      if (result) {
        setInsight(result);
      } else {
        setError("Gagal mendapatkan wawasan dari AI. Coba lagi nanti.");
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
      <div className="mt-4 p-3 bg-secondary rounded-lg text-center border border-dashed">
        <p className="text-xs text-muted-foreground mb-2">Aktifkan Pelatih AI Anda dengan menghubungkan akun OpenAI untuk mendapatkan wawasan dan motivasi yang dipersonalisasi.</p>
        <Button asChild size="sm" variant="outline">
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
    <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-full">
            <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
            <h4 className="font-semibold text-sm">Wawasan dari Pelatih AI</h4>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AiCoachInsight;