import { Goal } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format, eachDayOfInterval, startOfYear, endOfYear, isBefore, startOfToday } from 'date-fns';

interface GoalProgressGridProps {
  goal: Goal;
}

const GoalProgressGrid = ({ goal }: GoalProgressGridProps) => {
  const today = startOfToday();
  const days = eachDayOfInterval({
    start: startOfYear(today),
    end: endOfYear(today),
  });

  const completionsByDate = new Map(
    goal.completions.map(c => [format(new Date(c.date), 'yyyy-MM-dd'), c])
  );

  const getIntensity = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const completion = completionsByDate.get(dateString);
    if (!completion) return 0;
    
    if (goal.type === 'value' && goal.target_value) {
      // Intensity based on percentage of daily target (assuming yearly goal)
      const dailyTarget = goal.target_value / 365;
      return Math.min(4, Math.ceil((completion.value / dailyTarget) * 4));
    }
    
    // For quantity goals, any completion is level 4 for simplicity here
    return 4;
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-52 grid-flow-col gap-1">
        {days.map(day => {
          const isFuture = isBefore(today, day);
          const intensity = isFuture ? 0 : getIntensity(day);
          return (
            <Tooltip key={day.toString()}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'h-3 w-3 rounded-sm',
                    isFuture ? 'bg-muted/20' : 'bg-muted',
                    intensity === 1 && 'bg-green-200',
                    intensity === 2 && 'bg-green-400',
                    intensity === 3 && 'bg-green-600',
                    intensity === 4 && 'bg-green-800',
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                {format(day, 'PPP')}
                {completionsByDate.has(format(day, 'yyyy-MM-dd')) && (
                  <p>Completed!</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default GoalProgressGrid;