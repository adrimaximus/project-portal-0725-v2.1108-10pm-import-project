import { useState } from 'react';
import { Goal } from '@/data/goals';
import { format, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameMonth, parseISO, isWithinInterval, isBefore, isToday, isAfter, startOfDay, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AiCoachInsight from './AiCoachInsight';

interface GoalYearlyProgressProps {
  completions: Goal['completions'];
  color: string;
  onToggleCompletion: (date: Date) => void;
  frequency: string;
  specificDays?: string[];
}

const GoalYearlyProgress = ({ completions, color, onToggleCompletion, frequency, specificDays }: GoalYearlyProgressProps) => {
  const today = new Date();
  const currentYear = getYear(today);
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [dayToConfirm, setDayToConfirm] = useState<Date | null>(null);

  const todayStart = startOfDay(today);

  const handlePrevYear = () => setDisplayYear(prev => prev - 1);
  const handleNextYear = () => setDisplayYear(prev => prev + 1);

  const yearStartDate = startOfYear(new Date(displayYear, 0, 1));
  const yearEndDate = endOfYear(new Date(displayYear, 0, 1));

  const relevantCompletions = completions.filter(c => {
    const completionDate = parseISO(c.date);
    return isWithinInterval(completionDate, { start: yearStartDate, end: yearEndDate });
  });
  
  const totalCompleted = relevantCompletions.filter(c => c.completed).length;
  const totalPossible = relevantCompletions.length;
  const overallPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const months = Array.from({ length: 12 }).map((_, i) => startOfMonth(new Date(displayYear, i, 1)));

  const dayKeys = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const isDaily = !specificDays || specificDays.length === 0 || specificDays.length === 7;

  const isDayValidForGoal = (date: Date): boolean => {
    if (isDaily) return true;
    const dayKey = dayKeys[getDay(date)];
    return specificDays!.includes(dayKey);
  };

  const monthlyData = months.map(monthDate => {
    const monthCompletions = relevantCompletions.filter(c => isSameMonth(parseISO(c.date), monthDate));
    const completedCount = monthCompletions.filter(c => c.completed).length;
    const possibleCount = monthCompletions.length;
    const percentage = possibleCount > 0 ? Math.round((completedCount / possibleCount) * 100) : 0;
    
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
    const completionMap = new Map(monthCompletions.map(c => [format(parseISO(c.date), 'yyyy-MM-dd'), c.completed]));

    return {
      date: monthDate,
      name: format(monthDate, 'MMMM', { locale: enUS }),
      percentage,
      days: daysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        let isCompleted: boolean | undefined = completionMap.get(dayStr);
        if (isCompleted === undefined && isBefore(day, todayStart) && isDayValidForGoal(day)) {
          isCompleted = false;
        }
        return { date: day, isCompleted };
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
            You have completed this target <strong>{totalCompleted}</strong> of <strong>{totalPossible}</strong> times in {displayYear}.
          </CardDescription>
          <div className="flex items-center gap-4 pt-2">
            <Progress value={overallPercentage} className="w-full" indicatorStyle={{ backgroundColor: color }} />
            <span className="font-bold text-lg">{overallPercentage}%</span>
          </div>
          <AiCoachInsight 
            totalCompleted={totalCompleted}
            totalPossible={totalPossible}
            overallPercentage={overallPercentage}
            frequency={frequency}
            displayYear={displayYear}
          />
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {monthlyData.map(month => (
            <div key={month.name} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-sm">{month.name}</p>
                <p className="text-sm font-bold">{month.percentage}%</p>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: (month.days[0].date.getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
                {month.days.map(day => {
                  const isFutureDay = isAfter(day.date, todayStart);
                  const isValidDay = isDayValidForGoal(day.date);
                  const isDisabled = isFutureDay || !isValidDay;
                  const isMissed = isValidDay && day.isCompleted === false;

                  const buttonStyle: React.CSSProperties = {};
                  let buttonClasses = "w-full h-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed";

                  if (isMissed) {
                    buttonStyle.backgroundColor = 'transparent';
                    buttonStyle.border = `1px solid ${color}80`;
                    buttonClasses += ' box-border';
                  } else {
                    let bgColor = '#E5E7EB'; // Default for non-valid, or untracked valid days
                    if (isValidDay && day.isCompleted === true) {
                      bgColor = color;
                    }
                    buttonStyle.backgroundColor = bgColor;
                  }

                  if (isFutureDay) {
                    buttonStyle.opacity = 0.2;
                  }

                  return (
                    <TooltipProvider key={day.date.toString()} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleDayClick(day.date)}
                            disabled={isDisabled}
                            className={buttonClasses}
                            style={buttonStyle}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(day.date, 'PPP', { locale: enUS })}</p>
                          {isFutureDay ? <p>Future date</p> : 
                           !isValidDay ? <p>Not a scheduled day</p> :
                           day.isCompleted !== undefined ? <p>{day.isCompleted ? 'Completed' : 'Not completed'}</p> : <p>Track now</p>}
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
            <AlertDialogTitle>Are you sure you want to change this?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will change the completion status for a past date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" size="icon" onClick={() => setDayToConfirm(null)}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button size="icon" onClick={handleConfirm}>
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