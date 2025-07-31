import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoodHistoryEntry } from '@/data/mood';
import MonthHistorySection from './MonthHistorySection';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoodHistoryProps {
  history: MoodHistoryEntry[];
  className?: string;
}

const MoodHistory = ({ history, className }: MoodHistoryProps) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter history to only include entries from the selected year
  const yearHistory = history.filter(entry => {
    // Appending 'T00:00:00Z' to treat the date string as UTC
    const entryDate = new Date(entry.date + 'T00:00:00Z');
    return entryDate.getUTCFullYear() === selectedYear;
  });

  // Group year's history by month index (0-11)
  const groupedByMonth = yearHistory.reduce((acc, entry) => {
    const entryDate = new Date(entry.date + 'T00:00:00Z');
    const monthIndex = entryDate.getUTCMonth();
    
    if (!acc[monthIndex]) {
      acc[monthIndex] = [];
    }
    acc[monthIndex].push(entry);
    return acc;
  }, {} as Record<number, MoodHistoryEntry[]>);

  // Create a list of 12 months for the selected year
  const monthsOfYear = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(selectedYear, i, 1);
    // Using 'en-US' locale for month names
    const monthName = monthDate.toLocaleString('en-US', { month: 'long' });
    return {
      // MonthHistorySection expects a string like "January 2024"
      name: `${monthName} ${selectedYear}`,
      entries: groupedByMonth[i] || []
    };
  });

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Mood History</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Year</span>
          </Button>
          <span className="font-semibold text-lg tabular-nums">{selectedYear}</span>
          <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Year</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {monthsOfYear.map(monthData => (
            <MonthHistorySection key={monthData.name} month={monthData.name} entries={monthData.entries} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodHistory;