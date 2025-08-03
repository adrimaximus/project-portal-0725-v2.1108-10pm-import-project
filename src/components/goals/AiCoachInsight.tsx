import { Lightbulb, RefreshCw } from 'lucide-react';
import { User } from '@/data/users';
import { useEffect, useState } from 'react';
import { generateAiInsight } from '@/lib/openai';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    goalDescription: string;
    goalTags: string[];
    userName: string;
    selectedMonth: MonthlyData | null;
    collaborators: User[];
    color: string;
    frequency: string;
}

const AiCoachInsight = ({
    totalCompleted,
    totalPossible,
    overallPercentage,
    displayYear,
    goalTitle,
    goalDescription,
    goalTags,
    userName,
    selectedMonth,
    collaborators,
    color,
    frequency,
}: AiCoachInsightProps) => {
    const [insight, setInsight] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const buildPrompt = (): string => {
        const hasCollaborators = collaborators.length > 0;
        const performancePercentage = selectedMonth ? selectedMonth.percentage : overallPercentage;

        // Konteks Pengguna dan Tim
        let prompt = `--- Konteks Pengguna ---\n`;
        prompt += `Pengguna Utama: ${userName}\n`;
        if (hasCollaborators) {
            prompt += `Berkolaborasi dengan: ${collaborators.map(c => c.name).join(', ')}\n`;
        }

        // Konteks Tujuan
        prompt += `\n--- Konteks Tujuan ---\n`;
        prompt += `Tujuan: "${goalTitle}"\n`;
        prompt += `Deskripsi: "${goalDescription}"\n`;
        prompt += `Tag Terkait: ${goalTags.join(', ')}\n`;
        prompt += `Frekuensi: ${frequency}\n`;

        // Konteks Performa
        prompt += `\n--- Konteks Performa ---\n`;
        if (selectedMonth) {
            const { name, percentage, completedCount, possibleCount } = selectedMonth;
            prompt += `Periode Analisis: Bulan ${name}, ${displayYear}\n`;
            prompt += `Statistik: ${completedCount} dari ${possibleCount} kali selesai (${percentage}% tingkat keberhasilan).\n`;
        } else {
            prompt += `Periode Analisis: Keseluruhan Tahun ${displayYear}\n`;
            prompt += `Statistik: ${totalCompleted} dari ${totalPossible} total penyelesaian (${overallPercentage}% tingkat keberhasilan).\n`;
        }

        // Instruksi untuk AI
        prompt += `\n--- Tugas Anda ---\n`;
        prompt += `Berdasarkan semua data di atas, berikan umpan balik yang memotivasi dan personal kepada ${userName}. Tinjau kedisiplinan mereka, berikan saran untuk perbaikan jika perlu, dan semangati mereka (dan tim mereka, jika ada) untuk terus maju. Jadilah seperti pelatih pribadi.`;
        
        if (performancePercentage < 50) {
            prompt += `\n\nPENTING: Karena tingkat keberhasilan saat ini di bawah 50%, berikan 2-3 poin saran yang konkret dan dapat ditindaklanjuti (sebagai daftar bernomor atau berpoin) untuk membantu ${userName} mencapai tingkat keberhasilan di atas 90%. Saran harus spesifik terkait tujuan mereka.`;
        }

        return prompt;
    };

    const fetchInsight = async () => {
        setIsLoading(true);
        const prompt = buildPrompt();
        const generatedInsight = await generateAiInsight(prompt);
        setInsight(generatedInsight);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInsight();
    }, [selectedMonth, displayYear, totalCompleted, totalPossible]);

    const insightBoxStyle = {
        backgroundColor: `${color}1A`,
        borderColor: `${color}4D`,
    };
    const insightTextStyle = {
        color: color,
    };
    const pStyle = {
        color: `${color}D9`
    };

    return (
        <div className="mt-4 rounded-lg border p-3" style={insightBoxStyle}>
            <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" style={insightTextStyle} />
                <div className="flex-1">
                    {isLoading ? (
                        <p className="text-sm leading-relaxed animate-pulse" style={pStyle}>AI Coach sedang berpikir...</p>
                    ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={pStyle}>{insight}</p>
                    )}
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchInsight} disabled={isLoading}>
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} style={insightTextStyle} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Segarkan Wawasan</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};

export default AiCoachInsight;