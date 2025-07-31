import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { eachMonthOfInterval, getYear, getMonth, format, getDaysInMonth, startOfMonth, getDay, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface YearlyProgressProps {
  goal: Goal;
}

const DaySquare = ({ date, goal }: { date: Date; goal: Goal }) => {
  const completion = goal.completions.find(c => isSameDay(parseISO(c.date), date));
  const isCompleted = completion?.completed;

  return (
    <div
      className={cn(
        'h-3 w-3 rounded-sm',
        isCompleted ? 'bg-primary' : 'bg-muted/50'
      )}
      style={isCompleted ? { backgroundColor: goal.color } : {}}
    />
  );
};

const MonthCard = ({ month, goal }: { month: Date; goal: Goal }) => {
  const year = getYear(month);
  const monthIndex = getMonth(month);
  const daysInMonth = getDaysInMonth(month);
  const firstDayOfMonth = getDay(startOfMonth(month)); // 0 = Sunday

  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1));
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthCompletions = goal.completions.filter(c => {
    const completionDate = parseISO(c.date);
    return getYear(completionDate) === year && getMonth(completionDate) === monthIndex && c.completed;
  });

  const progress = daysInMonth > 0 ? Math.round((monthCompletions.length / daysInMonth) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{format(month, 'MMMM')}</CardTitle>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 grid-rows-6 gap-1">
          {emptyDays.map(i => <div key={`empty-${i}`} />)}
          {days.map(day => <DaySquare key={day.toString()} date={day} goal={goal} />)}
        </div>
      </CardContent>
    </Card>
  );
};

const YearlyProgress = ({ goal }: YearlyProgressProps) => {
  const year = getYear(new Date());
  const months = eachMonthOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31),
  });

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const totalCompletions = goal.completions.filter(c => {
    const d = parseISO(c.date);
    return isWithinInterval(d, { start: yearStart, end: yearEnd }) && c.completed;
  }).length;
  
  const totalPossibleCompletions = 365; // Simplifikasi untuk tujuan harian
  const overallProgress = Math.round((totalCompletions / totalPossibleCompletions) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Yearly Progress</CardTitle>
            <span className="text-sm text-muted-foreground">{year}</span>
        </div>
        <p className="text-sm text-muted-foreground pt-2">
          You have completed this target {totalCompletions} times in {year}.
        </p>
        <Progress value={overallProgress} className="mt-2" style={{'--progress-color': goal.color} as React.CSSProperties} />
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map(month => (
          <MonthCard key={month.toString()} month={month} goal={goal} />
        ))}
      </CardContent>
    </Card>
  );
};

export default YearlyProgress;