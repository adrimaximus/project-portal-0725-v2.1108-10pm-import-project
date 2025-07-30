import { Goal } from '@/data/goals';
import { format, getMonth, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, isSameMonth, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GoalYearlyProgressProps {
  completions: Goal['completions'];
  color: string;
}

const GoalYearlyProgress = ({ completions, color }: GoalYearlyProgressProps) => {
  const today = new Date();
  const oneYearAgo = subYears(today, 1);

  const relevantCompletions = completions.filter(c => parseISO(c.date) >= oneYearAgo);
  
  const totalCompleted = relevantCompletions.filter(c => c.completed).length;
  const totalPossible = relevantCompletions.length;
  const overallPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const months = Array.from({ length: 12 }).map((_, i) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return startOfMonth(monthDate);
  }).reverse();

  const monthlyData = months.map(monthDate => {
    const monthCompletions = relevantCompletions.filter(c => isSameMonth(parseISO(c.date), monthDate));
    const completedCount = monthCompletions.filter(c => c.completed).length;
    const possibleCount = monthCompletions.length;
    const percentage = possibleCount > 0 ? Math.round((completedCount / possibleCount) * 100) : 0;
    
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate)
    });

    const completionMap = new Map(monthCompletions.map(c => [format(parseISO(c.date), 'yyyy-MM-dd'), c.completed]));

    return {
      date: monthDate,
      name: format(monthDate, 'MMMM yyyy'),
      percentage,
      completedCount,
      possibleCount,
      days: daysInMonth.map(day => ({
        date: day,
        isCompleted: completionMap.get(format(day, 'yyyy-MM-dd')),
        isInMonth: isSameMonth(day, monthDate)
      }))
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Progress</CardTitle>
        <CardDescription>
          You've completed this goal <strong>{totalCompleted}</strong> out of <strong>{totalPossible}</strong> times in the last year.
        </CardDescription>
        <div className="flex items-center gap-4 pt-2">
          <Progress value={overallPercentage} className="w-full" indicatorStyle={{ backgroundColor: color }} />
          <span className="font-bold text-lg">{overallPercentage}%</span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {monthlyData.map(month => (
          <div key={month.name} className="p-3 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-sm">{month.name}</p>
              <p className="text-sm font-bold">{month.percentage}%</p>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (month.days[0].date.getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {month.days.map(day => (
                <TooltipProvider key={day.date.toString()} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="w-full h-3 rounded-sm" style={{ backgroundColor: day.isCompleted === undefined ? '#E5E7EB' : (day.isCompleted ? color : '#6B7280') }} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{format(day.date, 'PPP')}</p>
                      {day.isCompleted !== undefined && (
                        <p>{day.isCompleted ? 'Completed' : 'Not completed'}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default GoalYearlyProgress;