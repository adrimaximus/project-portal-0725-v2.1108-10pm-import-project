import { Lightbulb } from 'lucide-react';
import { User } from '@/data/users';

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
}: AiCoachInsightProps) => {

    const hasCollaborators = collaborators.length > 0;
    const collaboratorText = hasCollaborators ? `You and ${collaborators[0].name}${collaborators.length > 1 ? ` & your team` : ''}` : userName;
    const collaboratorPronoun = hasCollaborators ? 'your team is' : 'you are';
    const collaboratorAction = hasCollaborators ? 'are working together' : 'are working';

    const getMonthlyInsight = (month: MonthlyData) => {
        const { name, percentage, completedCount, possibleCount } = month;
        if (possibleCount === 0) {
            return `It looks like there were no scheduled days for "${goalTitle}" in ${name}, so no progress to report. A good time to plan for the future!`;
        }
        if (percentage >= 90) {
            return `Incredible work in ${name}, ${collaboratorText}! A ${percentage}% success rate (${completedCount}/${possibleCount}) is outstanding. Your dedication to this goal, especially in areas like #${goalTags[0]}, is truly paying off. Keep that amazing momentum going!`;
        }
        if (percentage >= 70) {
            return `Fantastic job in ${name}! ${collaboratorText} hit a ${percentage}% completion rate. ${collaboratorPronoun} building a seriously strong habit. What's one small thing you could tweak to aim for 90% next month?`;
        }
        if (percentage >= 50) {
            return `Solid effort in ${name}, ${userName}. A ${percentage}% completion rate shows ${collaboratorAction} on the right track with "${goalTitle}". You're halfway there! Let's brainstorm: what's the biggest hurdle you faced this month? Overcoming that is the key to the next level.`;
        }
        if (percentage > 0) {
            return `Progress is progress! ${collaboratorText} completed this ${completedCount} out of ${possibleCount} times in ${name}. Every step forward counts. Let's reflect: what was the biggest challenge? Acknowledging it is the first step to beating it next time.`;
        }
        return `It looks like ${name} was a tough month for "${goalTitle}". That's okay, it happens to everyone. The most important thing is to not get discouraged. A new month is a fresh start. Let's get back on track together! What support do you need?`;
    };

    const getYearlyInsight = () => {
        if (totalPossible === 0) {
            return `Welcome to your goal: "${goalTitle}"! This is the beginning of an exciting journey. Remember why you started: "${goalDescription}". Let's start tracking and make ${displayYear} a year of growth!`;
        }
        if (overallPercentage >= 80) {
            return `Phenomenal consistency, ${userName}! An overall completion rate of ${overallPercentage}% for the year shows incredible dedication. ${collaboratorText} have truly embodied the spirit of this goal. What has been the most rewarding part of this journey so far?`;
        }
        if (overallPercentage >= 50) {
            return `Great work this year! With a ${overallPercentage}% success rate, ${collaboratorPronoun} well on your way to making "${goalTitle}" a long-term habit. Think back to where you started. The progress is real. Keep building on this strong foundation.`;
        }
        if (overallPercentage > 20) {
            return `A great start to the year for "${goalTitle}"! You've completed it ${totalCompleted} times. Consistency is built one day at a time. Remember your "why": *${goalDescription}*. Keep that in mind as you continue to build this positive habit.`;
        }
        return `The journey of a thousand miles begins with a single step. You've started tracking "${goalTitle}" and that's the most important part. Every check-in is a win. Let's keep building from here!`;
    };

    const insight = selectedMonth ? getMonthlyInsight(selectedMonth) : getYearlyInsight();

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
        <div className="mt-4 flex items-start gap-3 rounded-lg border p-3" style={insightBoxStyle}>
            <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" style={insightTextStyle} />
            <p className="text-sm leading-relaxed" style={pStyle}>{insight}</p>
        </div>
    );
};

export default AiCoachInsight;