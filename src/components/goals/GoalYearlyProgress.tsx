import { useState } from 'react';
import { Goal } from '@/data/goals';
import { format, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameMonth, parseISO, isWithinInterval, isBefore, isToday, isAfter, startOfDay, getDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface GoalYearlyProgressProps {
  completions: Goal['completions'];
  color: string;
  onToggleCompletion: (date: Date) => void;
  specificDays?: string[];
}

const GoalYearlyProgress = ({ completions, color, onToggleCompletion, specificDays }: GoalYearlyProgressProps) => {
  const today = new Date();
  const currentYear = getYear(today);
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [dayToConfirm, setDayToConfirm] = useState<Date | null>(null);

  const todayStart = startOfDay(today);
  const dayIndexToKey = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handlePrevYear = () => setDisplayYear(prev => prev - 1);
  const handleNextYear = () => setDisplayYear(prev => prev + 1);

  const yearStartDate = startOfYear(new Date(displayYear, 0, 1));
  const yearEndDate = endOfYear(new Date(displayYear, 0, 1));

  const relevantCompletions = completions.filter(c => {
    const completionDate = parseISO(c.date);
    return isWithinInterval(completionDate, { start: yearStartDate, end: yearEndDate });
  });
  
  const totalCompleted = relevantCompletions.filter(c => c.completed).length;
  
  const months = Array.from({ length: 12 }).map((_, i) => startOfMonth(new Date(displayYear, i, 1)));

  const monthlyData = months.map(monthDate => {
    const monthCompletions = relevantCompletions.filter(c => isSameMonth(parseISO(c.date), monthDate));
    const completedCount = monthCompletions.filter(c => c.completed).length;
    
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
    const completionMap = new Map(monthCompletions.map(c => [format(parseISO(c.date), 'yyyy-MM-dd'), c.completed]));

    const daysWithGoalStatus = daysInMonth.map(day => {
      const dayKey = dayIndexToKey[getDay(day)];
      const isGoalDay = !specificDays || specificDays.length === 0 || specificDays.includes(dayKey);
      return { date: day, isGoalDay };
    });

    const possibleDaysInMonth = daysWithGoalStatus.filter(d => d.isGoalDay && (isBefore(d.date, todayStart) || isToday(d.date))).length;
    const percentage = possibleDaysInMonth > 0 ? Math.round((completedCount / possibleDaysInMonth) * 100) : 0;

    return {
      date: monthDate,
      name: format(monthDate, 'MMMM', { locale: id }),
      percentage,
      days: daysWithGoalStatus.map(dayInfo => {
        const { date, isGoalDay } = dayInfo;
        const dayStr = format(date, 'yyyy-MM-dd');
        let isCompleted: boolean | undefined = completionMap.get(dayStr);
        
        if (isCompleted === undefined && isBefore(date, todayStart) && isGoalDay) {
          isCompleted = false;
        }
        return { date, isCompleted, isGoalDay };
      })
    };
  });

  const yearGoalDays = eachDayOfInterval({ start: yearStartDate, end: yearEndDate }).filter(day => {
      const dayKey = dayIndexToKey[getDay(day)];
      return (!specificDays || specificDays.length === 0 || specificDays.includes(dayKey)) && (isBefore(day, todayStart) || isToday(day));
  }).length;

  const overallPercentage = yearGoalDays > 0 ? Math.round((totalCompleted / yearGoalDays) * 100) : 0;

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
            Progres keseluruhan Anda untuk target ini pada tahun {displayYear}.
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
                {Array.from({ length: (month.days[0].date.getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
                {month.days.map(day => {
                  const isFutureDay = isAfter(day.date, todayStart);
                  const isDisabled = isFutureDay || !day.isGoalDay;
                  
                  return (
                    <TooltipProvider key={day.date.toString()} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleDayClick(day.date)}
                            disabled={isDisabled}
                            className="w-full h-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed"
                            style={{ 
                              backgroundColor: !day.isGoalDay 
                                ? '#F3F4F6' 
                                : day.isCompleted === undefined 
                                  ? '#E5E7EB' 
                                  : (day.isCompleted ? color : '#6B7280'),
                              opacity: !day.isGoalDay ? 0.5 : 1
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(day.date, 'PPP', { locale: id })}</p>
                          {isFutureDay ? <p>Tanggal mendatang</p> : !day.isGoalDay ? <p>Bukan hari target</p> : day.isCompleted !== undefined ? <p>{day.isCompleted ? 'Selesai' : 'Tidak selesai'}</p> : <p>Lacak sekarang</p>}
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