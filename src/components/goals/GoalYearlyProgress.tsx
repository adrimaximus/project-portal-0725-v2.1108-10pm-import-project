import { useState, useEffect } from 'react';
import { Goal, GoalCompletion } from '@/types';
import { User } from '@/types';
import { format, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameMonth, parseISO, isWithinInterval, isBefore, isToday, isAfter, startOfDay, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AiCoachInsight from './AiCoachInsight';

interface GoalYearlyProgressProps {
  goal: Goal;
  onToggleCompletion: (date: Date) => void;
}

const GoalYearlyProgress = ({ goal, onToggleCompletion }: GoalYearlyProgressProps) => {
  const { completions: rawCompletions, color, frequency, specific_days: specificDays } = goal;
  const completions = rawCompletions.map(c => ({ 
    date: c.date, 
    completed: c.value === 1,
    hasAttachment: !!(c as any).attachment_url // Check for attachment
  }));

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
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Create a map that stores the full completion object (or just relevant details)
    const completionMap = new Map<string, { completed: boolean; hasAttachment: boolean }>(
      relevantCompletions.map(c => [
        format(parseISO(c.date), 'yyyy-MM-dd'), 
        { completed: c.completed, hasAttachment: c.hasAttachment }
      ])
    );

    const daysWithStatus = daysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const isValid = isDayValidForGoal(day);
        const completionData = completionMap.get(dayStr);
        
        let isCompleted: boolean | undefined;
        let hasAttachment = false;

        if (completionData) {
            isCompleted = completionData.completed;
            hasAttachment = completionData.hasAttachment;
        }
        
        if (isCompleted === undefined && isValid && isBefore(day, todayStart)) {
            isCompleted = false;
        }
        return { date: day, isCompleted, isValid, hasAttachment };
    });

    const possibleDaysInPast = daysWithStatus.filter(d => d.isValid && isBefore(d.date, todayStart));
    const completedCount = possibleDaysInPast.filter(d => d.isCompleted === true).length;
    const possibleCount = possibleDaysInPast.length;
    const percentage = possibleCount > 0 ? Math.round((completedCount / possibleCount) * 100) : 0;

    return {
        date: monthDate,
        name: format(monthDate, 'MMMM', { locale: enUS }),
        percentage,
        completedCount,
        possibleCount,
        days: daysWithStatus.map(d => ({ 
            date: d.date, 
            isCompleted: d.isCompleted, 
            hasAttachment: d.hasAttachment 
        }))
    };
  });

  const [selectedMonth, setSelectedMonth] = useState<(typeof monthlyData)[0] | null>(null);
  const [aiContext, setAiContext] = useState<{
    yearly?: { percentage: number };
    month?: { name: string; percentage: number; completedCount: number; possibleCount: number; };
  }>({ yearly: { percentage: overallPercentage } });

  useEffect(() => {
    if (!selectedMonth) {
      setAiContext({ yearly: { percentage: overallPercentage } });
    }
  }, [overallPercentage, selectedMonth]);

  const handleMonthClick = (month: (typeof monthlyData)[0]) => {
    if (selectedMonth?.name === month.name) {
      setSelectedMonth(null);
      setAiContext({ yearly: { percentage: overallPercentage } });
    } else {
      setSelectedMonth(month);
      setAiContext({
        month: {
          name: month.name,
          percentage: month.percentage,
          completedCount: month.completedCount,
          possibleCount: month.possibleCount,
        },
      });
    }
  };

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
            goal={goal} 
            yearlyProgress={aiContext.yearly}
            monthlyProgress={aiContext.month}
          />
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {monthlyData.map(month => {
            const isSelected = selectedMonth?.name === month.name;
            return (
              <div 
                key={month.name} 
                onClick={() => handleMonthClick(month)}
                className="p-3 border rounded-lg cursor-pointer transition-all"
                style={isSelected ? { boxShadow: `0 0 0 2px ${color}` } : {}}
              >
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
                    let buttonClasses = "w-full h-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed relative";

                    if (isMissed) {
                      buttonStyle.backgroundColor = 'transparent';
                      buttonStyle.border = `1px solid ${color}80`;
                      buttonClasses += ' box-border';
                    } else {
                      let bgColor = '#E5E7EB';
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
                              onClick={(e) => { e.stopPropagation(); handleDayClick(day.date); }}
                              disabled={isDisabled}
                              className={buttonClasses}
                              style={buttonStyle}
                            >
                              {day.hasAttachment && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                                </div>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{format(day.date, 'PPP', { locale: enUS })}</p>
                            {isFutureDay ? <p>Future date</p> : 
                             !isValidDay ? <p>Not a scheduled day</p> :
                             day.isCompleted !== undefined ? (
                                <>
                                  <p>{day.isCompleted ? 'Completed' : 'Not completed'}</p>
                                  {day.hasAttachment && <div className="flex items-center gap-1 mt-1 text-xs text-primary"><FileText className="h-3 w-3" /> Report attached</div>}
                                </>
                             ) : <p>Track now</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )
          })}
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