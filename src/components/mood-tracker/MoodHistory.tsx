import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoodHistoryEntry } from '@/data/mood';
import MonthHistorySection from './MonthHistorySection';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MoodHistoryProps {
  history: MoodHistoryEntry[];
  title: string;
  className?: string;
}

const MoodHistory = ({ history, title, className }: MoodHistoryProps) => {
  const groupedByMonth = history.reduce((acc, entry) => {
    const entryDate = new Date(entry.date + 'T00:00:00Z');
    const monthKey = format(entryDate, 'MMMM yyyy');
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(entry);
    return acc;
  }, {} as Record<string, MoodHistoryEntry[]>);

  const monthsWithEntries = Object.entries(groupedByMonth)
    .map(([monthName, entries]) => ({
      name: monthName,
      entries: entries,
    }))
    .sort((a, b) => new Date(b.name).getTime() - new Date(a.name).getTime());

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {monthsWithEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {monthsWithEntries.map(monthData => (
              <MonthHistorySection key={monthData.name} month={monthData.name} entries={monthData.entries} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No mood history recorded for this period.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodHistory;