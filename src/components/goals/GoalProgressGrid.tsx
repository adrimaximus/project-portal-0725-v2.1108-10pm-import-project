import { Goal } from '@/data/goals';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, startOfWeek, addDays } from 'date-fns';

interface GoalProgressGridProps {
  completions: Goal['completions'];
  color: string;
}

const GoalProgressGrid = ({ completions, color }: GoalProgressGridProps) => {
  const weekDaysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const columns = 18;
  const totalDays = columns * 7;
  const startDate = startOfWeek(addDays(today, -totalDays + 1), { weekStartsOn: 1 });

  const completionMap = new Map(completions.map(c => [c.date, c.completed]));

  const daysByWeek: Date[][] = Array.from({ length: columns }, (_, weekIndex) => 
    Array.from({ length: 7 }, (_, dayIndex) => 
      addDays(startDate, weekIndex * 7 + dayIndex)
    )
  );

  return (
    <div className="flex gap-3 mt-2">
      <div className="flex flex-col text-xs text-muted-foreground font-mono pt-1 space-y-1">
        {weekDaysLabels.map((day, i) => <div key={i} className="h-3 flex items-center">{day}</div>)}
      </div>
      <div className="flex gap-1">
        {daysByWeek.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => {
              const dateString = format(day, 'yyyy-MM-dd');
              const completed = completionMap.get(dateString);
              const isFuture = day > today;

              return (
                <TooltipProvider key={dayIndex} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ 
                          backgroundColor: completed ? color : (isFuture ? 'transparent' : '#E5E7EB'),
                          opacity: isFuture ? 0 : 1
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{format(day, 'PPP')}</p>
                      {completionMap.has(dateString) && !isFuture && (
                        <p>{completed ? 'Completed' : 'Not completed'}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalProgressGrid;