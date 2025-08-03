import { Goal } from '@/data/goals';
import { getYear, getDayOfYear, parseISO } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GoalYearlyProgressProps {
  goal: Goal;
}

const GoalYearlyProgress = ({ goal }: GoalYearlyProgressProps) => {
  const currentYear = getYear(new Date());
  const daysInYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0 ? 366 : 365;

  const contributionsByDay = Array(daysInYear).fill(0);
  goal.completions.forEach(completion => {
    const date = parseISO(completion.date);
    if (getYear(date) === currentYear) {
      const dayIndex = getDayOfYear(date) - 1;
      contributionsByDay[dayIndex] += completion.value;
    }
  });

  const maxContribution = Math.max(...contributionsByDay, 1);

  const getIntensity = (value: number) => {
    if (value === 0) return 0;
    const percentage = value / maxContribution;
    if (percentage < 0.25) return 1;
    if (percentage < 0.5) return 2;
    if (percentage < 0.75) return 3;
    return 4;
  };

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: daysInYear }).map((_, index) => {
        const intensity = getIntensity(contributionsByDay[index]);
        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'h-3 w-3 rounded-sm',
                    intensity === 0 && 'bg-muted',
                    intensity === 1 && 'bg-green-200',
                    intensity === 2 && 'bg-green-400',
                    intensity === 3 && 'bg-green-600',
                    intensity === 4 && 'bg-green-800'
                  )}
                  style={{ backgroundColor: intensity > 0 ? goal.color + (20 + intensity * 20).toString(16) : undefined }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{contributionsByDay[index]} contributions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

export default GoalYearlyProgress;