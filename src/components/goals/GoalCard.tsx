import { Goal } from '@/data/goals';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GoalFormDialog } from './GoalFormDialog';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { formatValue, formatNumber } from '@/lib/formatting';
import { getUserByName } from '@/data/users';
import GoalIcon from './GoalIcon';

interface GoalCardProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const GoalCard = ({ goal, onUpdate, onDelete }: GoalCardProps) => {
  const { progress, total, target } = useMemo(() => {
    const total = goal.completions.reduce((sum, c) => sum + c.value, 0);
    let target: number | null = null;
    if (goal.type === 'quantity' && goal.targetQuantity) target = goal.targetQuantity;
    if (goal.type === 'value' && goal.targetValue) target = goal.targetValue;
    if (goal.type === 'frequency' && goal.frequency) target = goal.frequency;

    const progress = target ? Math.min(Math.round((total / target) * 100), 100) : 0;
    return { progress, total, target };
  }, [goal]);

  const formatProgressText = () => {
    if (goal.type === 'frequency') {
      return `${formatNumber(total)} / ${formatNumber(target || 0)} times`;
    }
    const formattedTotal = goal.type === 'value' ? formatValue(total, goal.unit) : formatNumber(total);
    const formattedTarget = goal.type === 'value' ? formatValue(target || 0, goal.unit) : formatNumber(target || 0);
    return `${formattedTotal} / ${formattedTarget}`;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <GoalIcon goal={goal} className="h-8 w-8" />
            <div>
              <CardTitle className="text-lg font-bold">{goal.title}</CardTitle>
              <CardDescription className="text-sm">{goal.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <GoalFormDialog goal={goal} onSave={(data) => onUpdate({ ...goal, ...data })} />
            <Button variant="ghost" size="icon" onClick={() => onDelete(goal.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Progress</span>
            <span>{formatProgressText()}</span>
          </div>
          <Progress value={progress} style={{ '--primary-color': goal.color } as React.CSSProperties} className="h-2 [&>*]:bg-[var(--primary-color)]" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {goal.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center -space-x-2">
          {goal.collaborators.map(collaboratorName => {
            const user = getUserByName(collaboratorName);
            if (!user) return null;
            return (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 border-2 border-card">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <Button asChild variant="link" size="sm">
          <Link to={`/goals/${goal.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GoalCard;