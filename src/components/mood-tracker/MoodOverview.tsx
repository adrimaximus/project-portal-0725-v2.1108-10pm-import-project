import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { moods, Mood, MoodEntry } from '@/data/mood';

interface MoodOverviewProps {
  history: MoodEntry[];
}

const MoodOverview = ({ history }: MoodOverviewProps) => {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No mood entries yet.</p>
        </CardContent>
      </Card>
    );
  }

  const averageMoodValue =
    history.reduce((acc, entry) => {
      const mood = moods.find((m) => m.id === entry.moodId);
      return acc + (mood?.value || 0);
    }, 0) / history.length;

  const averageMood =
    moods
      .slice()
      .sort((a, b) => Math.abs(a.value - averageMoodValue) - Math.abs(b.value - averageMoodValue))[0] || moods[2];

  return (
    <Card>
      <CardHeader>
        <CardTitle>This week's overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center text-center">
          <div>
            <span className="text-6xl">{averageMood.emoji}</span>
            <p className="text-xl font-semibold mt-2">You've been feeling {averageMood.label.toLowerCase()}</p>
            <p className="text-muted-foreground">on average this week</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodOverview;