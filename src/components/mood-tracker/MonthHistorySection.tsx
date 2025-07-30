import { moods, MoodHistoryEntry } from '@/data/mood';
import { Card } from '@/components/ui/card';

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
  // getDay() is 0 for Sunday, 1 for Monday... Assuming the week starts on Sunday.
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();

  const entriesMap = new Map<number, MoodHistoryEntry>();
  entries.forEach(entry => {
    // Using UTC date to avoid timezone shifts. The date string is 'YYYY-MM-DD'.
    const entryDate = new Date(entry.date + 'T00:00:00Z');
    const dayOfMonth = entryDate.getUTCDate();
    entriesMap.set(dayOfMonth, entry);
  });

  const calendarDays = [];

  // Add empty placeholders for days before the 1st of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="w-5 h-5 sm:w-6 sm:h-6" />);
  }

  // Add the actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const entry = entriesMap.get(day);
    if (entry) {
      const mood = getMoodById(entry.moodId);
      calendarDays.push(
        <div
          key={entry.id}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
          style={{ backgroundColor: mood?.color }}
          title={`${mood?.label} on ${new Date(year, monthIndex, day).toLocaleDateString()}`}
        />
      );
    } else {
      calendarDays.push(
        <div
          key={`day-${day}`}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted/50"
          title={`No entry for ${new Date(year, monthIndex, day).toLocaleDateString()}`}
        />
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
        {mostFrequentMood && (
          <Card className="flex flex-col items-center justify-center p-3 rounded-2xl w-24 h-24 sm:w-28 sm:h-28 shrink-0">
            <div 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-1"
              style={{ backgroundColor: mostFrequentMood.color }}
            >
              {mostFrequentMood.emoji}
            </div>
            <span className="font-bold text-base sm:text-lg text-card-foreground">{averagePercentage}%</span>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MonthHistorySection;