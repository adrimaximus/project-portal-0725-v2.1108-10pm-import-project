import { Lightbulb } from 'lucide-react';

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
    frequency: string;
    displayYear: number;
    goalTitle: string;
    goalTags: string[];
    userName: string;
    selectedMonth: MonthlyData | null;
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

    const getMonthlyInsight = (month: MonthlyData) => {
        const { name, percentage, completedCount, possibleCount } = month;
        if (possibleCount === 0) {
            return `Sepertinya tidak ada jadwal untuk "${goalTitle}" di bulan ${name}, jadi tidak ada progres yang bisa dilaporkan.`;
        }
        if (percentage >= 90) {
            return `Luar biasa, ${userName}! Di bulan ${name}, Anda berhasil mencapai ${completedCount} dari ${possibleCount} hari, tingkat keberhasilan ${percentage}%. Konsistensi Anda untuk "${goalTitle}" sangat mengesankan. Pertahankan momentum ini!`;
        }
        if (percentage >= 70) {
            return `Kerja bagus di bulan ${name}! Anda mencapai tingkat penyelesaian ${percentage}% untuk "${goalTitle}". Anda sedang membangun kebiasaan yang kuat. Perubahan kecil apa yang bisa membantu Anda di bulan berikutnya?`;
        }
        if (percentage >= 50) {
            return `Usaha yang bagus di bulan ${name}, ${userName}. Anda menyelesaikan "${goalTitle}" sebanyak ${percentage}% dari hari yang dijadwalkan. Anda sudah setengah jalan! Mari kita coba kalahkan skor itu bulan depan.`;
        }
        if (percentage > 0) {
            return `Anda membuat kemajuan untuk "${goalTitle}" di bulan ${name}, menyelesaikannya ${completedCount} dari ${possibleCount} kali. Setiap langkah berarti. Apa tantangan terbesar Anda bulan ini?`;
        }
        return `Sepertinya ${name} adalah bulan yang sulit untuk "${goalTitle}", dengan penyelesaian 0%. Jangan berkecil hati, ${userName}. Bulan baru adalah awal yang baru. Mari kembali ke jalur yang benar!`;
    };

    const getYearlyInsight = () => {
        if (totalPossible === 0) {
            return `Sepertinya belum ada data untuk "${goalTitle}" di tahun ${displayYear}. Mari mulai lacak progres Anda!`;
        }
        if (overallPercentage >= 80) {
            return `Konsistensi yang luar biasa, ${userName}! Dengan tingkat penyelesaian ${overallPercentage}% tahun ini, Anda menunjukkan dedikasi yang luar biasa pada "${goalTitle}".`;
        }
        if (overallPercentage >= 50) {
            return `Anda melakukan pekerjaan hebat dengan "${goalTitle}" tahun ini, mempertahankan tingkat keberhasilan ${overallPercentage}%. Anda berada di jalur yang tepat untuk menjadikannya kebiasaan jangka panjang.`;
        }
        if (overallPercentage > 20) {
            return `Awal yang baik untuk "${goalTitle}" di tahun ${displayYear}! Anda telah menyelesaikannya ${totalCompleted} kali. Konsistensi adalah kunci, mari terus membangun fondasi ini.`;
        }
        return `Anda sudah mulai melacak "${goalTitle}". Setiap progres adalah langkah maju. Terus catat kemajuan Anda untuk melihat trennya!`;
    };

    const insight = selectedMonth ? getMonthlyInsight(selectedMonth) : getYearlyInsight();

    return (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800 dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-300">
            <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{insight}</p>
        </div>
    );
};

export default AiCoachInsight;