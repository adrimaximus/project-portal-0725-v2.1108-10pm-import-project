import { useState, useEffect } from 'react';
import { Goal, GoalCompletion, User } from '@/types';
import { format, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameMonth, parseISO, isWithinInterval, isBefore, isToday, isAfter, startOfDay, getDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GoalYearlyProgressProps {
  goal: Goal;
  year: number;
  onLogCompletion: (date: Date, value: number) => void;
}

export default function GoalYearlyProgress({ goal, year, onLogCompletion }: GoalYearlyProgressProps) {
  const [days, setDays] = useState<Date[]>([]);
  const [completionsByDate, setCompletionsByDate] = useState<Map<string, GoalCompletion[]>>(new Map());

  useEffect(() => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 11, 31));
    setDays(eachDayOfInterval({ start, end }));

    const map = new Map<string, GoalCompletion[]>();
    goal.completions.forEach(comp => {
      const dateKey = format(parseISO(comp.date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(comp);
    });
    setCompletionsByDate(map);
  }, [goal.completions, year]);

  const getIntensity = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const completions = completionsByDate.get(dateKey);
    if (!completions || completions.length === 0) return 0;

    if (goal.type === 'value') {
      const totalValue = completions.reduce((sum, c) => sum + c.value, 0);
      return Math.min(4, Math.ceil((totalValue / (goal.target_value! / 365)) * 4));
    } else {
      return Math.min(4, completions.length);
    }
  };

  const isDaySelectable = (date: Date) => {
    if (isAfter(date, new Date())) return false;
    if (goal.frequency === 'specific_days' && goal.specific_days?.length) {
      const dayOfWeek = getDay(date); // 0 for Sunday, 1 for Monday...
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
      return goal.specific_days.includes(dayName as any);
    }
    return true;
  };

  const months = Array.from({ length: 12 }, (_, i) => format(new Date(year, i, 1), 'MMM'));

  return (
    <TooltipProvider>
      <div className="flex gap-4">
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="grid grid-cols-53 grid-flow-col gap-1">
          {months.map(month => (
            <div key={month} className="col-span-4 text-center text-sm font-semibold">{month}</div>
          ))}
          {days.map(day => {
            const intensity = getIntensity(day);
            const selectable = isDaySelectable(day);
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayCompletions = completionsByDate.get(dateKey);

            return (
              <Tooltip key={day.toString()}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => selectable && onLogCompletion(day, 1)}
                    className={cn(
                      "w-4 h-4 rounded-sm",
                      selectable ? "cursor-pointer hover:ring-2 ring-primary" : "cursor-not-allowed opacity-50",
                      intensity === 0 && "bg-muted",
                      intensity === 1 && "bg-green-200",
                      intensity === 2 && "bg-green-400",
                      intensity === 3 && "bg-green-600",
                      intensity === 4 && "bg-green-800",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(day, 'PPP')}</p>
                  {dayCompletions && dayCompletions.length > 0 && (
                    <p>
                      {goal.type === 'quantity'
                        ? `${dayCompletions.length} completions`
                        : `Value: ${dayCompletions.reduce((s, c) => s + c.value, 0)}`}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}