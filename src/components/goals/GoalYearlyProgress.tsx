import { Goal } from '@/data/goals';
import { startOfYear, endOfYear, eachDayOfInterval, format, getDay, isSameDay, parseISO } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GoalYearlyProgressProps {
  goal: Goal;
}

const GoalYearlyProgress = ({ goal }: GoalYearlyProgressProps) => {
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);
  const daysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Use a Map for efficient lookups
  const completionsByDate = new Map(goal.completions.map(c => [format(parseISO(c.date), 'yyyy-MM-dd'), true]));

  const firstDayOfWeek = getDay(yearStart);
  const placeholders = Array.from({ length: firstDayOfWeek });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{format(today, 'yyyy')} Progress</h3>
      <div className="grid grid-cols-7 md:grid-cols-53 gap-1 auto-cols-max grid-flow-col-dense">
        {placeholders.map((_, index) => <div key={`placeholder-${index}`} className="w-3 h-3" />)}
        {daysInYear.map(day => {
          const dayString = format(day, 'yyyy-MM-dd');
          const isCompleted = completionsByDate.has(dayString);

          return (
            <TooltipProvider key={dayString}>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: isCompleted ? goal.color : '#E4E4E7' }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {format(day, 'MMM d, yyyy')} - {isCompleted ? 'Completed' : 'Not Completed'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

export default GoalYearlyProgress;