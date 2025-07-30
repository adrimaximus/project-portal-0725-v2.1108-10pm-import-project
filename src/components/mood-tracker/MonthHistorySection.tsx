import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moods, MoodHistoryEntry } from '@/data/mood';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, getDate, isSameMonth, isToday, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

interface MonthHistorySectionProps {
  history: MoodHistoryEntry[];
}

const DayCell = ({ day, moodEmoji, isCurrentMonth }: { day: Date; moodEmoji?: string; isCurrentMonth: boolean }) => (
  <div className="relative flex h-12 flex-col items-center justify-center">
    <span
      className={cn(
        "absolute top-1 text-xs",
        !isCurrentMonth && "text-muted-foreground/50",
        isToday(day) && "flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground"
      )}
    >
      {format(day, 'd')}
    </span>
    {moodEmoji && <span className="text-2xl mt-2">{moodEmoji}</span>}
  </div>
);

const MonthHistorySection = ({ history }: MonthHistorySectionProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthHistory = history.filter(entry => isSameMonth(new Date(entry.date), currentDate));

  const avgScore = monthHistory.length > 0
    ? monthHistory.reduce((acc, entry) => {
        const mood = moods.find((m) => m.id === entry.moodId);
        return acc + (mood ? mood.score : 0);
      }, 0) / monthHistory.length
    : 0;

  const avgMood = moods.slice().reverse().find(mood => avgScore >= mood.score);

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const firstDayOfMonth = startOfMonth(currentDate);
  const startingDay = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  const days = Array.from({ length: 35 }, (_, i) => new Date(startingDay.getFullYear(), startingDay.getMonth(), startingDay.getDate() + i));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
          {avgMood && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{avgMood.emoji}</span>
              <span>Avg. {avgMood.label}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
          {weekdays.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {days.map(day => {
            const historyEntry = history.find(entry => 
              getDate(new Date(entry.date)) === getDate(day) && 
              isSameMonth(new Date(entry.date), day)
            );
            const mood = historyEntry ? moods.find(m => m.id === historyEntry.moodId) : undefined;
            return <DayCell key={day.toString()} day={day} moodEmoji={mood?.emoji} isCurrentMonth={isSameMonth(day, currentDate)} />;
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthHistorySection;