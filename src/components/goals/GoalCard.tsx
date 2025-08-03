import { Goal } from '@/data/goals';
import { getIconComponent } from '@/data/icons';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { parseISO, isWithinInterval, startOfToday, subDays } from 'date-fns';
import { getColorForTag } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Collaborator } from '@/types';

type GoalWithTags = Goal & { tags?: string[] };

const GoalCard = ({ goal }: { goal: GoalWithTags }) => {
  const Icon = getIconComponent(goal.icon);

  const calculateProgress = () => {
    const now = startOfToday();
    const completions = goal.completions.filter(c => c.completed);
    const frequency = goal.frequency.toLowerCase();
    
    if (frequency === 'daily') {
      const thirtyDaysAgo = subDays(now, 30);
      const relevantCompletions = completions.filter(c => isWithinInterval(parseISO(c.date), { start: thirtyDaysAgo, end: now })).length;
      return (relevantCompletions / 30) * 100;
    }
    
    if (frequency === 'weekly') {
        const sevenDaysAgo = subDays(now, 7);
        const completedLast7Days = completions.some(c => isWithinInterval(parseISO(c.date), { start: sevenDaysAgo, end: now }));
        return completedLast7Days ? 100 : 0;
    }

    if (frequency === 'monthly') {
        const thirtyDaysAgo = subDays(now, 30);
        const completedLast30Days = completions.some(c => isWithinInterval(parseISO(c.date), { start: thirtyDaysAgo, end: now }));
        return completedLast30Days ? 100 : 0;
    }

    return 0;
  };

  const progress = calculateProgress();

  return (
    <Link to={`/goals/${goal.id}`} className="block">
      <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: `${goal.color}20` }}>
                <Icon className="h-6 w-6" style={{ color: goal.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate" title={goal.title}>{goal.title}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">{goal.frequency}</p>
              </div>
            </div>
            {goal.collaborators && goal.collaborators.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                {goal.collaborators.slice(0, 3).map((user: Collaborator) => (
                  <Avatar key={user.id} className="inline-block h-8 w-8 rounded-full border-2 border-background">
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end">
          {goal.tags && goal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {goal.tags.map(tag => {
                const { bg, text, border } = getColorForTag(tag);
                return (
                  <Badge key={tag} className={cn("font-normal", bg, text, border)}>{tag}</Badge>
                );
              })}
            </div>
          )}
          <div>
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GoalCard;