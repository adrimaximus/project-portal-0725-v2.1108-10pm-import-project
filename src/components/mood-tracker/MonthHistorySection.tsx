import { MoodHistoryEntry, moods } from '@/data/mood';
import { getDaysInMonth, getDay as getDayOfWeek, format, getDate } from 'date-fns';

interface MonthHistorySectionProps {
  history: MoodHistoryEntry[];
  month: number; // 0-11
  year: number;
}

const MonthHistorySection = ({ history, month, year }: MonthHistorySectionProps) => {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDayOfWeek = getDayOfWeek(new Date(year, month, 1));

  const entriesForMonth = history.filter(
    (entry) => new Date(entry.date).getMonth() === month && new Date(entry.date).getFullYear() === year
  );

  const totalScore = entriesForMonth.reduce((acc, entry) => {
    const mood = moods.find((m) => m.id === entry.moodId);
    return acc + (mood?.score ?? 0);
  }, 0);

  const averageScore = entriesForMonth.length > 0 ? totalScore / entriesForMonth.length : null;

  let averageMoodLabel = null;
  if (averageScore !== null) {
    if (averageScore > 1.5) averageMoodLabel = { label: 'Mostly Good', color: moods.find(m => m.id === 'good')?.color };
    else if (averageScore > 0.5) averageMoodLabel = { label: 'Mostly Neutral', color: moods.find(m => m.id === 'neutral')?.color };
    else averageMoodLabel = { label: 'Mostly Bad', color: moods.find(m => m.id === 'bad')?.color };
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">
          {format(new Date(year, month), 'MMMM yyyy')}
        </h3>
        {averageMoodLabel && (
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: averageMoodLabel.color }}></span>
            <span>{averageMoodLabel.label}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const entryForDay = entriesForMonth.find(
            (e) => getDate(new Date(e.date)) === day
          );
          const mood = entryForDay ? moods.find((m) => m.id === entryForDay.moodId) : undefined;
          return (
            <div key={day} className="aspect-square flex items-center justify-center">
              {mood ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: mood.color }}>
                  <span className="text-lg">{mood.emoji}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">{day}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthHistorySection;