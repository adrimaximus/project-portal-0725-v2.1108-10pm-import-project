import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type Period = 'week' | 'month' | 'year';

interface AiFriendSuggestionProps {
  data: (Mood & { value: number })[];
  period: Period;
  userName: string;
}

const generateInsight = (data: (Mood & { value: number })[], period: Period, userName: string): string => {
  const periodInIndonesian = {
    week: 'minggu',
    month: 'bulan',
    year: 'tahun'
  }[period];

  if (data.length === 0) {
    return `Hai ${userName}, sepertinya kamu belum mencatat suasana hati untuk ${periodInIndonesian} ini. Luangkan waktu sejenak untuk terkoneksi dengan dirimu. Setiap perasaan itu valid.`;
  }

  const dominantMood = data.reduce((prev, current) => (prev.value > current.value) ? prev : current);

  switch (dominantMood.label) {
    case 'Happy':
      return `Senang sekali melihatmu merasa bahagia ${periodInIndonesian} ini, ${userName}! Teruslah nikmati momen-momen yang membawa kebahagiaan. Apa satu hal kecil yang membuatmu tersenyum baru-baru ini?`;
    case 'Sad':
      return `Aku perhatikan kamu merasa sedih ${periodInIndonesian} ini, ${userName}. Tidak apa-apa untuk merasa tidak baik-baik saja. Ingatlah untuk bersikap lembut pada diri sendiri. Mungkin mendengarkan musik yang menenangkan atau berbicara dengan teman bisa membantu. Aku di sini untuk mendengarkan.`;
    case 'Stressed':
      return `Sepertinya ${periodInIndonesian} ini cukup membuatmu stres, ${userName}. Ingatlah untuk beristirahat. Bahkan beberapa menit bernapas dalam-dalam bisa membuat perbedaan. Kamu sudah melakukan yang terbaik, dan itu sudah cukup.`;
    case 'Angry':
      return `Merasa marah ${periodInIndonesian} ini sangat wajar, ${userName}. Itu adalah emosi yang kuat. Mengakuinya adalah langkah pertama. Mungkin jalan-jalan sebentar atau menuliskan pikiranmu bisa membantu menyalurkan energi itu secara konstruktif.`;
    case 'Calm':
      return `Kamu merasa tenang ${periodInIndonesian} ini, ${userName}. Itu adalah kondisi pikiran yang hebat. Hargai kedamaian ini. Kegiatan apa yang telah membantumu mempertahankan ketenangan ini?`;
    case 'Anxious':
        return `Sepertinya rasa cemas hadir ${periodInIndonesian} ini, ${userName}. Aku turut prihatin kamu mengalaminya. Coba fokus pada napasmu sejenak. Tarik napas tenang, hembuskan kekhawatiran. Kamu aman saat ini.`;
    default:
      return `Hai ${userName}, terima kasih sudah memeriksa perasaanmu ${periodInIndonesian} ini. Setiap hari adalah kesempatan baru untuk lebih memahami diri sendiri. Teruslah sadar akan emosimu, itu kerja bagus!`;
  }
};

const AiFriendSuggestion: React.FC<AiFriendSuggestionProps> = ({ data, period, userName }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const storedStatus = localStorage.getItem("openai_connected");
    setIsConnected(storedStatus === "true");
  }, []);

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

  const insight = generateInsight(data, period, userName);

  return (
    <div className="mt-4 p-4 bg-secondary rounded-lg">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-full">
            <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div>
            <h4 className="font-semibold text-sm">Pikiran dari Teman AI-mu</h4>
            <p className="text-sm text-muted-foreground mt-1">{insight}</p>
        </div>
      </div>
    </div>
  );
};

export default AiFriendSuggestion;