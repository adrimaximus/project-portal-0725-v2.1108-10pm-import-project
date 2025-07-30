import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moods, MoodEntry, Mood } from '@/data/mood';
import { format, getDaysInMonth, startOfMonth, getDay, eachDayOfInterval, subMonths, getMonth, getYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MoodHistoryProps {
  history: MoodEntry[];
}

const MonthCalendar = ({ date, history }: { date: Date, history: MoodEntry[] }) => {
  const monthHistory = history.filter(entry => {
    const entryDate = new Date(entry.date);
    return getYear(entryDate) === getYear(date) && getMonth(entryDate) === getMonth(date);
  });

  const historyMap = new Map(monthHistory.map(entry => [entry.date, entry.moodId]));
  
  const daysInMonth = getDaysInMonth(date);
  const monthStart = startOfMonth(date);
  const firstDayOfWeek = getDay(monthStart); // 0 for Sunday, 1 for Monday...

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const moodValues = monthHistory.map(entry => moods.find(m => m.id === entry.moodId)?.value || 0);
  const averageMoodValue = moodValues.length > 0 ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length : 0;
  const averageMood = moods.slice().reverse().find(m => m.value <= averageMoodValue);
  const moodPercentage = averageMoodValue > 0 ? (averageMoodValue / 5) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <h4 className="font-semibold">{format(date, 'MMMM')}</h4>
      <div className="grid grid-cols-7 gap-1.5">
        {paddingDays.map(p => <div key={`pad-${p}`} className="h-4 w-4" />)}
        {days.map(day => {
          const dayDate = new Date(getYear(date), getMonth(date), day);
          const dateString = format(dayDate, 'yyyy-MM-dd');
          const moodId = historyMap.get(dateString);
          const mood = moodId ? moods.find(m => m.id === moodId) : null;
          
          return (
            <TooltipProvider key={day} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger>
                  <div className={cn(
                    "h-4 w-4 rounded-full",
                    mood ? mood.bgColor : 'bg-muted'
                  )} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(dayDate, 'MMM dd, yyyy')}</p>
                  {mood && <p>Mood: {mood.label}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      {averageMood && (
        <div className="flex items-center gap-2 text-center">
          <averageMood.Icon className={cn("h-10 w-10", averageMood.color)} />
          <span className="font-bold text-lg">{Math.round(moodPercentage)}%</span>
        </div>
      )}
    </div>
  );
};

const MoodHistory = ({ history }: MoodHistoryProps) => {
  const [monthsToShow, setMonthsToShow] = useState(3);
  const today = new Date();

  const monthDates = Array.from({ length: monthsToShow }, (_, i) => subMonths(today, i)).reverse();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your mood over time</CardTitle>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
          <Button size="sm" variant={monthsToShow === 3 ? 'secondary' : 'ghost'} onClick={() => setMonthsToShow(3)}>3 months</Button>
          <Button size="sm" variant={monthsToShow === 6 ? 'secondary' : 'ghost'} onClick={() => setMonthsToShow(6)}>6 months</Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
        {monthDates.map(date => (
          <MonthCalendar key={date.toString()} date={date} history={history} />
        ))}
      </CardContent>
    </Card>
  );
};

export default MoodHistory;