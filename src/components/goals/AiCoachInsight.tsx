import { useState, useEffect } from 'react';
import { Lightbulb, Bot, AlertTriangle } from 'lucide-react';
import OpenAI from 'openai';
import { useSettings } from '@/context/SettingsContext';

interface MonthlyData {
    name: string;
    percentage: number;
    completedCount: number;
    possibleCount: number;
}

interface AiCoachInsightProps {
    totalCompleted: number;
    totalPossible: number;
    overallPercentage: number;
    displayYear: number;
    goalTitle: string;
    userName: string;
    selectedMonth: MonthlyData | null;
    frequency: string;
    goalTags: string[];
}

const AiCoachInsight = ({
    totalCompleted,
    totalPossible,
    overallPercentage,
    displayYear,
    goalTitle,
    userName,
    selectedMonth
}: AiCoachInsightProps) => {
    const { apiKey } = useSettings();
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const generateInsight = async () => {
            if (!apiKey) {
                setError('Kunci API OpenAI belum diatur. Silakan atur di halaman Pengaturan.');
                return;
            }

            setIsLoading(true);
            setError('');
            setInsight('');

            const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

            let promptContent = '';
            if (selectedMonth) {
                promptContent = `Sebagai seorang pelatih motivasi, berikan masukan singkat (maksimal 2 kalimat) dalam Bahasa Indonesia untuk pengguna bernama ${userName} mengenai progres tujuannya "${goalTitle}". 
                Data untuk bulan ${selectedMonth.name} ${displayYear}:
                - Persentase penyelesaian: ${selectedMonth.percentage}%
                - Berhasil diselesaikan: ${selectedMonth.completedCount} kali
                - Total hari yang dijadwalkan: ${selectedMonth.possibleCount} kali.
                Fokus pada pencapaian dan berikan dorongan semangat.`;
            } else {
                promptContent = `Sebagai seorang pelatih motivasi, berikan masukan singkat (maksimal 2 kalimat) dalam Bahasa Indonesia untuk pengguna bernama ${userName} mengenai progres tahunan untuk tujuannya "${goalTitle}".
                Data untuk tahun ${displayYear}:
                - Persentase penyelesaian keseluruhan: ${overallPercentage}%
                - Total berhasil diselesaikan: ${totalCompleted} kali
                - Total hari yang dijadwalkan: ${totalPossible} kali.
                Berikan gambaran umum dan motivasi untuk melanjutkan.`;
            }

            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "system", content: promptContent }],
                    max_tokens: 100,
                });
                setInsight(completion.choices[0].message.content || 'Tidak dapat menghasilkan masukan saat ini.');
            } catch (err: any) {
                console.error(err);
                setError(`Gagal mengambil masukan dari OpenAI. Error: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        generateInsight();
    }, [selectedMonth, displayYear, apiKey, goalTitle, userName, totalCompleted, totalPossible, overallPercentage]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 flex-shrink-0 animate-spin" />
                    <p className="text-sm">AI Coach sedang berpikir...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex items-start gap-3 text-yellow-800 dark:text-yellow-300">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{error}</p>
                </div>
            );
        }
        return (
            <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{insight}</p>
            </div>
        );
    };

    return (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800 dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-300 min-h-[68px]">
            {renderContent()}
        </div>
    );
};

export default AiCoachInsight;