import { useState } from 'react';
import { Goal } from '@/data/goals';
import { format, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameMonth, parseISO, isWithinInterval, isBefore, isToday, isAfter, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface GoalYearlyProgressProps {
  goal: Goal;
  onToggleCompletion: (date: Date) => void;
}

const GoalYearlyProgress = ({ goal, onToggleCompletion }: GoalYearlyProgressProps) => {
  const { completions, color, specificDays } = goal;
  const today = new Date();
  const currentYear = getYear(today);
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [dayToConfirm, setDayToConfirm] = useState<Date | null>(null);

  const todayStart = startOfDay(today);

  const dayKeyMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const isDayActive = (date: Date): boolean => {
    if (!specificDays || specificDays.length === 0 || specificDays.length === 7) {
      return true;
    }
    const dayKey = dayKeyMap[date.getDay()];
    return specificDays.includes(dayKey);
  };

  const handlePrevYear = () => setDisplayYear(prev => prev - 1);
  const handleNextYear = () => setDisplayYear(prev => prev + 1);

  const yearStartDate = startOfYear(new Date(displayYear, 0, 1));
  const yearEndDate = endOfYear(new Date(displayYear, 0, 1));

  const relevantCompletions = completions.filter(c => {
    const completionDate = parseISO(c.date);
    return isWithinInterval(completionDate, { start: yearStartDate, end: yearEndDate });
  });
  
  const totalCompleted = relevantCompletions.filter(c => c.completed).length;
  
  const yearDays = eachDayOfInterval({ start: yearStartDate, end: yearEndDate });
  const totalPossible = yearDays.filter(day => isDayActive(day) && !isAfter(day, today)).length;
  
  const overallPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const months = Array.from({ length: 12 }).map((_, i) => startOfMonth(new Date(displayYear, i, 1)));

  const monthlyData = months.map(monthDate => {
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
    const completionMap = new Map(relevantCompletions.map(c => [format(parseISO(c.date), 'yyyy-MM-dd'), c.completed]));

    const monthActiveDays = daysInMonth.filter(day => isDayActive(day) && !isAfter(day, today));
    const monthCompletedCount = monthActiveDays.filter(day => completionMap.get(format(day, 'yyyy-MM-dd')) === true).length;
    const monthPossibleCount = monthActiveDays.length;
    const percentage = monthPossibleCount > 0 ? Math.round((monthCompletedCount / monthPossibleCount) * 100) : 0;

    return {
      date: monthDate,
      name: format(monthDate, 'MMMM'),
      percentage,
      days: daysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const isActive = isDayActive(day);
        const isPastOrToday = !isAfter(day, todayStart);
        
        let isCompleted: boolean | undefined = completionMap.get(dayStr);
        if (isCompleted === undefined && isPastOrToday && isActive) {
          isCompleted = false;
        }
        return { date: day, isCompleted, isActive };
      })
    };
  });

  const handleDayClick = (day: Date) => {
    if (isAfter(day, todayStart)) return;
    if (isToday(day)) {
      onToggleCompletion(day);
    } else {
      setDayToConfirm(day);
    }
  };

  const handleConfirm = () => {
    if (dayToConfirm) {
      onToggleCompletion(dayToConfirm);
    }
    setDayToConfirm(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle>Yearly Progress</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevYear}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg w-24 text-center">{displayYear}</span>
              <Button variant="outline" size="icon" onClick={handleNextYear} disabled={displayYear === currentYear}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            You have completed this goal <strong>{totalCompleted}</strong> out of <strong>{totalPossible}</strong> possible times in {displayYear}.
          </CardDescription>
          <div className="flex items-center gap-4 pt-2">
            <Progress value={overallPercentage} className="w-full" indicatorStyle={{ backgroundColor: color }} />
            <span className="font-bold text-lg">{overallPercentage}%</span>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {monthlyData.map(month => (
            <div key={month.name} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-sm">{month.name}</p>
                <p className="text-sm font-bold">{month.percentage}%</p>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: (month.days[0].date.getDay() + 7) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
                {month.days.map(day => {
                  const isFutureDay = isAfter(day.date, todayStart);
                  const isDisabled = isFutureDay || !day.isActive;
                  
                  let bgColor = '#F3F4F6'; // Inactive day
                  if (day.isActive) {
                    if (day.isCompleted === undefined) {
                       bgColor = '#E5E7EB'; // Trackable (future)
                    } else if (day.isCompleted) {
                      bgColor = color; // Completed
                    } else {
                      bgColor = '#6B7280'; // Not completed (missed)
                    }
                  }

                  return (
                    <TooltipProvider key={day.date.toString()} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleDayClick(day.date)}
                            disabled={isDisabled}
                            className="w-full h-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed"
                            style={{ backgroundColor: bgColor }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(day.date, 'PPP')}</p>
                          {isFutureDay ? <p>Future date</p> : !day.isActive ? <p>Not a scheduled day</p> : (day.isCompleted ? <p>Completed</p> : <p>Not completed</p>)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <AlertDialog open={!!dayToConfirm} onOpenChange={() => setDayToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to make this change?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will modify the completion status for a past date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDayToConfirm(null)}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleConfirm}>
                <Check className="h-4 w-4" />
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GoalYearlyProgress;