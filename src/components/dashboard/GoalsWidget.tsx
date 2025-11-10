import { useGoals } from '@/hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2, Target } from 'lucide-react';
import { Goal } from '@/types';
import GoalIcon from '@/components/goals/GoalIcon';
import { Progress } from '@/components/ui/progress';
import { getProgress } from '@/lib/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { useMemo } from 'react';

const GoalItem = ({ goal }: { goal: Goal }) => {
  const { percentage } = getProgress(goal);

  return (
    <Link to={`/goals/${goal.slug}`} className="block p-3 rounded-lg hover:bg-muted">
      <div className="flex items-center gap-4">
        <GoalIcon goal={goal} className="h-10 w-10 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{goal.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={percentage} className="h-1.5 flex-1" indicatorStyle={{ backgroundColor: goal.color }} />
            <span className="text-xs font-medium text-muted-foreground">{percentage.toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex -space-x-2">
          {goal.collaborators.slice(0, 3).map(user => (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                    <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent><p>{user.name}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </Link>
  );
};

const GoalsWidget = () => {
  const { data: goals = [], isLoading } = useGoals();

  const recentGoals = useMemo(() => {
    return [...goals]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 4);
  }, [goals]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          My Goals
        </CardTitle>
        <Button asChild variant="link" className="text-sm -my-2 -mr-4">
          <Link to="/goals">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentGoals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">You haven't set any goals yet.</p>
            <Button asChild variant="link" className="mt-2">
              <Link to="/goals">Set your first goal</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentGoals.map(goal => (
              <GoalItem key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalsWidget;