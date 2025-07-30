import { MoodHistoryEntry, moods } from '@/data/mood';

interface MonthHistorySectionProps {
  month: string;
  entries: MoodHistoryEntry[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const MonthHistorySection = ({ month, entries, onMouseEnter, onMouseLeave }: MonthHistorySectionProps) => {
  // Jangan render bagian ini jika tidak ada entri untuk bulan tersebut
  if (entries.length === 0) {
    return null;
  }

  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <h4 className="font-semibold text-sm mb-2">{month}</h4>
      <div className="flex flex-col gap-2">
        {entries.map(entry => {
          const mood = moods.find(m => m.id === entry.moodId);
          const entryDate = new Date(entry.date + 'T00:00:00Z');
          const day = entryDate.getUTCDate();
          const dayName = entryDate.toLocaleDateString('id-ID', { weekday: 'long' });

          return (
            <div key={entry.id} className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-mono w-6 text-right">{day}</span>
                <span>{dayName}</span>
              </div>
              {mood && (
                <div className="flex items-center gap-2 text-primary">
                  <span className="font-medium">{mood.label}</span>
                  <span>{mood.emoji}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthHistorySection;