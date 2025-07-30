import { Goal } from '@/data/goals';
import { startOfToday, subDays, isSameDay, parseISO, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GoalProgressGridProps {
  completions: Goal['completions'];
  color: string;
}

const GoalProgressGrid = ({ completions, color }: GoalProgressGridProps) => {
  const today = startOfToday();
  // Display the last 90 days
  const days = Array.from({ length: 90 }, (_, i) => subDays(today, i)).reverse();

  return (
    <TooltipProvider>
      <div className="grid grid-cols-15 gap-1.5">
        {days.map((day, index) => {
          // A day is completed if a completion object with that date exists.
          const isCompleted = completions.some(c => isSameDay(parseISO(c.date), day));

          return (
            <Tooltip key={index} delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  className="w-3.5 h-3.5 rounded-sm"
                  style={{ backgroundColor: isCompleted ? color : '#E4E4E7' }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{format(day, 'MMM d, yyyy')} - {isCompleted ? 'Completed' : 'Not Completed'}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default GoalProgressGrid;