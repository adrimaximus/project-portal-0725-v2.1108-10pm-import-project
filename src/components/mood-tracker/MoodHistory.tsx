import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoodHistoryEntry } from '@/data/mood';
import MonthHistorySection from './MonthHistorySection';

interface MoodHistoryProps {
  history: MoodHistoryEntry[];
}

const MoodHistory = ({ history }: MoodHistoryProps) => {
  const groupedByMonth = history.reduce((acc, entry) => {
    const date = new Date(entry.date);
    // Use UTC methods to avoid timezone issues with grouping
    const monthYear = new Date(date.getUTCFullYear(), date.getUTCMonth()).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(entry);
    return acc;
  }, {} as Record<string, MoodHistoryEntry[]>);

  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood History</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedMonths.length > 0 ? (
          <div className="space-y-8">
            {sortedMonths.map(month => (
              <MonthHistorySection key={month} month={month} entries={groupedByMonth[month]} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">No history to display.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodHistory;