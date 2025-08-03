import { Goal } from '@/data/goals';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const calculateProgress = () => {
    if (goal.type === 'quantity') {
      const today = new Date();
      let periodStart, periodEnd;

      if (goal.targetPeriod === 'Weekly') {
        periodStart = startOfWeek(today, { weekStartsOn: 1 });
        periodEnd = endOfWeek(today, { weekStartsOn: 1 });
      } else { // Monthly
        periodStart = startOfMonth(today);
        periodEnd = endOfMonth(today);
      }

      const completionsInPeriod = goal.completions.filter(c => {
        const completionDate = parseISO(c.date);
        return isWithinInterval(completionDate, { start: periodStart, end: periodEnd });
      });

      const currentTotal = completionsInPeriod.reduce((sum, c) => sum + c.value, 0);
      return goal.targetQuantity ? (currentTotal / goal.targetQuantity) * 100 : 0;
    } else { // frequency
      const relevantCompletions = goal.completions.filter(c => c.value > 0);
      const totalPossible = goal.completions.length;
      return totalPossible > 0 ? (relevantCompletions.length / totalPossible) * 100 : 0;
    }
  };

  const completionPercentage = calculateProgress();
  const isUrl = goal.icon.startsWith('http');

  return (
    <Link to={`/goals/${goal.id}`} className="block">
      <div className="bg-card border rounded-lg p-4 h-full flex flex-col hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 mr-4 overflow-hidden"
            style={{ backgroundColor: `${goal.color}30`, color: goal.color }}
          >
            {isUrl ? (
              <img src={goal.icon} alt={goal.title} className="w-full h-full object-cover" />
            ) : (
              <span>{goal.icon}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{goal.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{goal.description || 'No description'}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold" style={{ color: goal.color }}>{completionPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={completionPercentage} style={{ '--primary-color': goal.color } as React.CSSProperties} className="h-2 [&>*]:bg-[var(--primary-color)]" />
        </div>
        <div className="mt-auto pt-4 flex justify-between items-end">
          <div className="flex flex-wrap gap-1">
            {goal.tags.slice(0, 2).map(tag => (
              <Badge key={tag.id} variant="outline" className="text-xs" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </Badge>
            ))}
          </div>
          <div className="flex -space-x-2">
            {goal.collaborators.map(user => (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-6 w-6 border-2 border-card">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GoalCard;