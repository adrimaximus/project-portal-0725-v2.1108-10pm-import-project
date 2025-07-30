import { useState } from 'react';
import { Goal } from '@/data/goals';
import { format, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameMonth, parseISO, isWithinInterval, isBefore, isToday, isAfter, startOfDay, getDay, isSameYear, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
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

const dayKeyMapping: { [key: number]: string } = { 0: 'Su', 1: 'Mo', 2: 'Tu', 3: 'We', 4: 'Th', 5: 'Fr', 6: 'Sa' };

const GoalYearlyProgress = ({ goal, onToggleCompletion }: GoalYearlyProgressProps) => {
  const { completions, color, specificDays } = goal;
  const today = new Date();
  const currentYear = getYear(today);
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [dayToConfirm, setDayToConfirm] = useState<Date | null>(null);

  const todayStart = startOfDay(today);

  const handlePrevYear = () => setDisplayYear(prev => prev - 1);
  const handleNextYear = () => setDisplayYear(prev => prev + 1);

  const isTrackableDay = (date: Date): boolean => {
    if (!specificDays || specificDays.length === 0 || specificDays.length === 7) {
      return true; // Handles "Every day" and goals without specific day settings
    }
    const dayOfWeek = getDay(date);
    const dayKey = dayKeyMapping[dayOfWeek];
    return specificDays.includes(dayKey);
  };

  const yearStartDate = startOfYear(new Date(displayYear, 0, 1));
  const yearEndDate = endOfYear(new Date(displayYear, 0, 1));

  // Calculate total possible completions
  let totalPossible = 0;
  const endOfCalculation = isSameYear(todayStart, yearStartDate) ? todayStart : yearEndDate;
  if (isBefore(yearStartDate, endOfCalculation) || isSameDay(yearStartDate, endOfCalculation)) {
    const daysInYearToDate = eachDayOfInterval({ start: yearStartDate, end: endOfCalculation });
    totalPossible = daysInYearToDate.filter(day => isTrackableDay(day)).length;
  }

  const relevantCompletions = completions.filter(c => {
    const completionDate = parseISO(c.date);
    return isWithinInterval(completionDate, { start: yearStartDate, end: yearEndDate });
  });
  
  const totalCompleted = relevantCompletions.filter(c => c.completed).length;
  const overallPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const months = Array.from({ length: 12 }).map((_, i) => startOfMonth(new Date(displayYear, i, 1)));

  const monthlyData = months.map(monthDate => {
    const monthCompletions = relevantCompletions.filter(c => isSameMonth(parseISO(c.date), monthDate));
    const completedCount = monthCompletions.filter(c => c.completed).length;
    
    const allDaysInMonth = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
    const possibleDaysInMonth = allDaysInMonth
      .filter(day => isTrackableDay(day))
      .filter(day => isBefore(day, todayStart) || isSameDay(day, todayStart));
    const possibleCount = possibleDaysInMonth.length;

    const percentage = possibleCount > 0 ? Math.round((completedCount / possibleCount) * 100) : 0;
    
    const completionMap = new Map(monthCompletions.map(c => [format(parseISO(c.date), 'yyyy-MM-dd'), c.completed]));

    return {
      date: monthDate,
      name: format(monthDate, 'MMMM', { locale: id }),
      percentage,
      days: allDaysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        let isCompleted: boolean | undefined = completionMap.get(dayStr);
        if (isCompleted === undefined && isTrackableDay(day) && isBefore(day, todayStart)) {
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
            <CardTitle>Progres Tahunan</CardTitle>
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
            Anda telah menyelesaikan target ini <strong>{totalCompleted}</strong> dari <strong>{totalPossible}</strong> kali pada tahun {displayYear}.
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
                {Array.from({ length: (getDay(month.days[0].date) + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
                {month.days.map(day => {
                  const isFutureDay = isAfter(day.date, todayStart);
                  const isTrackable = isTrackableDay(day.date);
                  
                  let bgColor = '#F3F4F6'; // Non-trackable day color
                  if (isTrackable) {
                    bgColor = day.isCompleted === undefined ? '#E5E7EB' : (day.isCompleted ? color : '#6B7280');
                  }

                  return (
                    <TooltipProvider key={day.date.toString()} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => isTrackable && handleDayClick(day.date)}
                            disabled={isFutureDay || !isTrackable}
                            className="w-full h-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed"
                            style={{ backgroundColor: bgColor, opacity: isTrackable ? 1 : 0.3 }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(day.date, 'PPP', { locale: id })}</p>
                          {!isTrackable ? <p>Bukan hari target</p> : isFutureDay ? <p>Tanggal mendatang</p> : day.isCompleted !== undefined ? <p>{day.isCompleted ? 'Selesai' : 'Tidak selesai'}</p> : <p>Lacak sekarang</p>}
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
            <AlertDialogTitle>Apakah kamu yakin, ingin mengganti?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan mengubah status penyelesaian untuk tanggal yang telah lewat.
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