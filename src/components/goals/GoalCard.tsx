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

  return (
    <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{frequency}</p>
      </CardHeader>
      <CardContent>
        <GoalProgressGrid completions={recentCompletions} color={color} />
      </CardContent>
    </Card>
  );
};

export default GoalCard;