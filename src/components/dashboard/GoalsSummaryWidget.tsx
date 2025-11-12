import { useGoals } from '@/hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Loader2, Target } from 'lucide-react';
import { Goal } from '@/types';
import { getProgress } from '@/lib/progress';
import { Progress } from '@/components/ui/progress';
import GoalIcon from '@/components/goals/GoalIcon';
import { Button } from '@/components/ui/button';

const GoalItem = ({ goal }: { goal: Goal }) => {
  const { percentage } = getProgress(goal);

  return (
    <Link to={`/goals/${goal.slug}`} className="block p-2 rounded-md hover:bg-muted">
      <div className="flex items-center gap-3">
        <GoalIcon goal={goal} className="h-8 w-8 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{goal.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={percentage} className="h-1.5" indicatorStyle={{ backgroundColor: goal.color }} />
            <span className="text-xs font-mono text-muted-foreground">{percentage.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const GoalsSummaryWidget = () => {
  const { data: goals = [], isLoading } = useGoals();

  const activeGoals = goals.filter(goal => {
    const { percentage } = getProgress(goal);
    return percentage < 100;
  }).slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Active Goals</CardTitle>
          <CardDescription>A quick look at your current objectives.</CardDescription>
        </div>
        <Button asChild variant="link">
          <Link to="/goals">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.map(goal => (
              <GoalItem key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="mx-auto h-10 w-10" />
            <p className="mt-3 text-sm">No active goals found.</p>
            <Button asChild variant="link" className="mt-1">
              <Link to="/goals">Create a new goal</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalsSummaryWidget;