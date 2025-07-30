import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { moods, MoodHistoryEntry } from '@/data/mood';

interface MoodOverviewProps {
  history: MoodHistoryEntry[];
}

const MoodOverview = ({ history }: MoodOverviewProps) => {
  const moodCounts = moods.map(mood => ({
    ...mood,
    count: history.filter(entry => entry.moodId === mood.id).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {moodCounts.map(mood => (
            <div key={mood.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{mood.emoji}</span>
                <span className="font-medium">{mood.label}</span>
              </div>
              <span className="text-muted-foreground">{mood.count} days</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodOverview;