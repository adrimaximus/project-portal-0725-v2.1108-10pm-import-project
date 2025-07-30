import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { moods, MoodEntry } from '@/data/mood';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MoodHistoryProps {
  history: MoodEntry[];
}

const MoodHistory = ({ history }: MoodHistoryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {history.map((entry) => {
            const mood = moods.find((m) => m.id === entry.moodId);
            if (!mood) return null;
            return (
              <li key={entry.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mr-4', mood.color)}>
                    <span className="text-2xl">{mood.emoji}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{mood.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MoodHistory;