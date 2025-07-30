import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GoalProgressGrid from '@/components/goals/GoalProgressGrid';
import { subMonths, parseISO, isAfter, startOfToday } from 'date-fns';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const { title, icon: Icon, color, completions } = goal;

  const today = startOfToday();
  const threeMonthsAgo = subMonths(today, 3);

  const recentCompletions = completions.filter(completion => {
    const completionDate = parseISO(completion.date);
    return isAfter(completionDate, threeMonthsAgo);
  });

  const formatFrequency = (g: Goal) => {
    if (g.specificDays && g.specificDays.length > 0) {
      if (g.specificDays.length === 7) return 'Every day';
      if (g.specificDays.length === 1) return 'Once a week';
      
      const dayOrder: { [key: string]: number } = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
      const sortedDays = [...g.specificDays].sort((a, b) => dayOrder[a] - dayOrder[b]);
      
      if (g.specificDays.length > 3) {
        return `${g.specificDays.length} days a week`;
      }
      return sortedDays.join(', ');
    }
    
    if (g.frequency.startsWith('Every 1 day')) {
      return 'Every day';
    }

    return g.frequency;
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
        <p className="text-sm text-muted-foreground">{formatFrequency(goal)}</p>
      </CardHeader>
      <CardContent>
        <GoalProgressGrid completions={recentCompletions} color={color} />
      </CardContent>
    </Card>
  );
};

export default GoalCard;