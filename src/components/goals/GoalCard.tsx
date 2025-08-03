import { useMemo } from 'react';
import { Goal } from '@/data/goals';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import GoalIcon from './GoalIcon';
import { formatNumber, formatValue } from '@/lib/formatting';
import { getYear, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const { progress, total, target, unit } = useMemo(() => {
    const currentYear = getYear(new Date());
    const total = goal.completions
      .filter(c => getYear(parseISO(c.date)) === currentYear)
      .reduce((sum, c) => sum + c.value, 0);

    let target: number | undefined;
    if (goal.type === 'quantity') target = goal.targetQuantity;
    if (goal.type === 'value') target = goal.targetValue;

    const progress = target ? Math.min(Math.round((total / target) * 100), 100) : 0;

    return {
      progress,
      total,
      target,
      unit: goal.unit,
    };
  }, [goal]);

  const collaborators = goal.collaborators || [];

  const formatDisplayValue = (value: number) => {
    return goal.type === 'value' ? formatValue(value, unit) : formatNumber(value);
  };

  return (
    <Link to={`/goals/${goal.id}`} className="block">
      <Card className="h-full flex flex-col hover:border-primary/80 transition-colors">
        <CardHeader className="flex-row items-start gap-4 space-y-0">
          <GoalIcon goal={goal} />
          <div className="flex-1">
            <h3 className="font-bold text-lg">{goal.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {goal.type === 'frequency' ? (
            <div className="text-sm">
              <span className="font-semibold text-2xl">{goal.frequency}</span> times / {goal.targetPeriod?.replace('ly', '')}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-primary">{formatDisplayValue(total)}</span>
                {target && <span className="text-xs text-muted-foreground">Target: {formatDisplayValue(target)}</span>}
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="h-2.5 rounded-full" style={{ width: `${progress}%`, backgroundColor: goal.color }}></div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {collaborators.map(user => (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-8 w-8 border-2 border-card">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{user.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default GoalCard;