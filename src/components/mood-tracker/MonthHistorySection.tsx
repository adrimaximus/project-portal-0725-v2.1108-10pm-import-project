import { moods, MoodHistoryEntry } from '@/data/mood';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface MonthHistorySectionProps {
  month: string;
  entries: MoodHistoryEntry[];
}

const getMoodById = (moodId: number) => {
  return moods.find(mood => mood.id === moodId);
};

const MonthHistorySection = ({ month, entries }: MonthHistorySectionProps) => {
  // --- Calculation for the summary card ---
  const moodCounts: { [key: number]: number } = {};
  let totalScore = 0;

  entries.forEach(entry => {
    moodCounts[entry.moodId] = (moodCounts[entry.moodId] || 0) + 1;
    const mood = getMoodById(entry.moodId);
    if (mood) {
      totalScore += mood.score;
    }
  });

  const mostFrequentMoodId = Object.keys(moodCounts).length > 0
    ? parseInt(Object.keys(moodCounts).reduce((a, b) => moodCounts[parseInt(a)] > moodCounts[parseInt(b)] ? a : b))
    : null;

  const mostFrequentMood = mostFrequentMoodId ? getMoodById(mostFrequentMoodId) : null;
  const averagePercentage = entries.length > 0 ? Math.round((totalScore / entries.length)) : 0;

  // --- Calculation for the calendar grid ---
  const monthDate = new Date(month);
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const placeholders = (firstDayOfWeek + 6) % 7;

  const entriesMap = new Map<number, MoodHistoryEntry>();
  entries.forEach(entry => {
    const entryDate = new Date(entry.date + 'T00:00:00');
    const dayOfMonth = entryDate.getDate();
    entriesMap.set(dayOfMonth, entry);
  });

  const calendarDays = [];

  for (let i = 0; i < placeholders; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="w-5 h-5 sm:w-6 sm:h-6" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const entry = entriesMap.get(day);
    const currentDate = new Date(year, monthIndex, day);
    const formattedDate = format(currentDate, 'ccc, d MMM yyyy');

    if (entry) {
      const mood = getMoodById(entry.moodId);
      calendarDays.push(
        <TooltipProvider key={entry.id} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                style={{ backgroundColor: mood?.color }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-2">
                <span className="text-lg">{mood?.emoji}</span>
                <div>
                  <p className="font-bold" style={{ color: mood?.color }}>{mood?.label}</p>
                  <p className="text-xs text-muted-foreground">{formattedDate}</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      calendarDays.push(
        <TooltipProvider key={`day-${day}`} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted/50"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm text-muted-foreground">No entry on {formattedDate}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-center">{month}</h3>
      <div className="flex items-center justify-between gap-4 sm:gap-8">
        <div className="grid grid-cols-7 gap-2 flex-1">
          {calendarDays}
        </div>
        <Card className="flex flex-col items-center justify-center p-2 rounded-xl w-16 h-16 sm:w-20 sm:h-20 shrink-0">
          {mostFrequentMood ? (
            <>
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xl sm:text-2xl"
                style={{ backgroundColor: mostFrequentMood.color }}
              >
                {mostFrequentMood.emoji}
              </div>
              <span className="font-bold text-xs sm:text-sm text-card-foreground">{averagePercentage}%</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No Data</span>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MonthHistorySection;