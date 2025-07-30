import { Mood, MoodEntry, moods } from '@/data/mood';
import { cn } from '@/lib/utils';

interface MonthHistorySectionProps {
  month: Date;
  historyForMonth: MoodEntry[];
}

const MonthHistorySection = ({ month, historyForMonth }: MonthHistorySectionProps) => {
  const daysInMonth = Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-7 gap-1 p-2">
      {daysInMonth.map((day) => {
        const entryForDay = historyForMonth.find(
          (entry) => new Date(entry.date).getDate() === day
        );
        const mood = entryForDay ? moods.find((m) => m.id === entryForDay.moodId) : null;

        return (
          <div
            key={day}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs',
              mood ? mood.color : 'bg-gray-100'
            )}
          >
            {mood ? (
              <div title={`${mood.label}: ${mood.value}`}>
                {mood.emoji}
              </div>
            ) : (
              <span className="text-muted-foreground">{day}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MonthHistorySection;