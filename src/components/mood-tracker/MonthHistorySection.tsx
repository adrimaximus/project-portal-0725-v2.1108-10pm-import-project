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
  const moodCounts: { [key: number]: number } = {};
  let totalScore = 0;

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedEntries.forEach(entry => {
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

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-center">{month}</h3>
      <div className="flex items-center justify-between gap-4 sm:gap-8">
        <div className="grid grid-cols-7 gap-2 flex-1">
          {sortedEntries.map(entry => {
            const mood = getMoodById(entry.moodId);
            return (
              <div
                key={entry.id}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                style={{ backgroundColor: mood?.color }}
                title={`${mood?.label} on ${new Date(entry.date).toLocaleDateString()}`}
              />
            );
          })}
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