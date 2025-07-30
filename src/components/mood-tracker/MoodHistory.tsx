import { MoodHistoryEntry } from '@/data/mood';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MonthHistorySection from './MonthHistorySection';
import { parseISO } from 'date-fns';

interface MoodHistoryProps {
  history: MoodHistoryEntry[];
}

const MoodHistory = ({ history }: MoodHistoryProps) => {
  const sortedHistory = [...history].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const groupedByMonth = sortedHistory.reduce((acc, entry) => {
    const date = parseISO(entry.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, MoodHistoryEntry[]>);

  const monthKeys = Object.keys(groupedByMonth);

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground">No history yet. Start tracking your mood!</p>
        ) : (
          <div className="space-y-8">
            {monthKeys.map(key => {
              const [year, month] = key.split('-');
              return (
                <MonthHistorySection
                  key={key}
                  history={groupedByMonth[key]}
                  year={Number(year)}
                  month={Number(month)}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodHistory;