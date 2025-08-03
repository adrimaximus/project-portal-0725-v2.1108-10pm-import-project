import { useState, useEffect } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { User } from '@/data/users';
import { generateCoachInsight } from '@/lib/openai';

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

const AiCoachInsight = (props: AiCoachInsightProps) => {
    const {
        color,
        selectedMonth,
        displayYear,
        goalTitle,
        goalDescription,
        goalTags,
        userName,
        collaborators,
        totalCompleted,
        totalPossible,
        overallPercentage,
    } = props;

    const [insight, setInsight] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchInsight = async () => {
            setIsLoading(true);

            const hasCollaborators = collaborators.length > 0;
            const collaboratorText = hasCollaborators ? `You and ${collaborators[0].name}${collaborators.length > 1 ? ` & your team` : ''}` : userName;

            const insightParams = selectedMonth
                ? {
                    timePeriod: `untuk bulan ${selectedMonth.name}`,
                    percentage: selectedMonth.percentage,
                    completedCount: selectedMonth.completedCount,
                    possibleCount: selectedMonth.possibleCount,
                }
                : {
                    timePeriod: `untuk tahun ${displayYear}`,
                    percentage: overallPercentage,
                    completedCount: totalCompleted,
                    possibleCount: totalPossible,
                };

            const generatedInsight = await generateCoachInsight({
                goalTitle,
                goalDescription,
                goalTags,
                collaboratorText,
                ...insightParams,
            });

            setInsight(generatedInsight);
            setIsLoading(false);
        };

        fetchInsight();
    }, [selectedMonth, displayYear, goalTitle, goalDescription, goalTags, userName, collaborators, totalCompleted, totalPossible, overallPercentage]);

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
        <div className="mt-4 flex items-start gap-3 rounded-lg border p-3 min-h-[6rem]" style={insightBoxStyle}>
            <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" style={insightTextStyle} />
            {isLoading ? (
                <div className="flex items-center gap-2" style={pStyle}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Coach sedang berpikir...</span>
                </div>
            ) : (
                <p className="text-sm leading-relaxed" style={pStyle}>{insight}</p>
            )}
        </div>
    );
};

export default AiCoachInsight;