import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GoalProgressGrid from '@/components/goals/GoalProgressGrid';
import { subMonths, parseISO, isAfter, startOfToday } from 'date-fns';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const { title, icon: Icon, frequency, color, completions } = goal;

  // Filter completions to only include the last 3 months
  const today = startOfToday();
  const threeMonthsAgo = subMonths(today, 3);

  const recentCompletions = completions.filter(completion => {
    const completionDate = parseISO(completion.date);
    return isAfter(completionDate, threeMonthsAgo);
  });

  const formatFrequency = (freq: string) => {
    // Handle simple legacy formats
    if (freq.toLowerCase() === 'daily') {
      return 'Setiap hari';
    }
    if (freq.toLowerCase() === 'weekly') {
      return 'Seminggu sekali';
    }

    // Handle "Every X day(s) for Y week(s)" format
    const daysMatch = freq.match(/Every (\d+)/);
    const weeksMatch = freq.match(/for (\d+)/);

    // Fallback for any other unexpected format
    if (!daysMatch) {
      return freq;
    }

    const days = parseInt(daysMatch[1], 10);
    const weeks = weeksMatch ? parseInt(weeksMatch[1], 10) : 1;

    let dayPart = '';
    if (days === 1) {
      dayPart = 'Setiap hari';
    } else if (days === 7) {
      // If it's every 7 days, it's just weekly, regardless of the duration.
      return 'Seminggu sekali';
    } else {
      dayPart = `Setiap ${days} hari`;
    }

    let weekPart = '';
    // Only add the duration part if it was specified and is more than 1 week.
    if (weeksMatch && weeks > 1) {
      weekPart = ` selama ${weeks} minggu`;
    }

    return `${dayPart}${weekPart}`;
  };

  return (
    <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{formatFrequency(frequency)}</p>
      </CardHeader>
      <CardContent>
        <GoalProgressGrid completions={recentCompletions} color={color} />
      </CardContent>
    </Card>
  );
};

export default GoalCard;