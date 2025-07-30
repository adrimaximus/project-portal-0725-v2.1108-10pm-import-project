import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GoalProgressGrid from '@/components/goals/GoalProgressGrid';
import { subMonths, parseISO, isAfter, startOfToday } from 'date-fns';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const { title, icon: Icon, frequency, color, completions } = goal;

  const today = startOfToday();
  const threeMonthsAgo = subMonths(today, 3);

  const recentCompletions = completions.filter(completion => {
    const completionDate = parseISO(completion.date);
    return isAfter(completionDate, threeMonthsAgo);
  });

  const formatFrequency = (freq: string) => {
    if (freq.startsWith('weekly:')) {
      const days = freq.split(':')[1].split(',').filter(d => d);
      if (days.length === 7) return 'Every day';
      if (days.length === 0) return 'Weekly';
      return days.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ');
    }

    const daysMatch = freq.match(/Every (\d+)/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      if (days === 1) return 'Every day';
      if (days === 7) return 'Once a week';
      return `Every ${days} days`;
    }

    if (freq.toLowerCase() === 'daily') return 'Every day';
    if (freq.toLowerCase() === 'weekly') return 'Once a week';

    return freq;
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