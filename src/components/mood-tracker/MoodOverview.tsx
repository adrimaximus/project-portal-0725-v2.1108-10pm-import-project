import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moods, MoodHistoryEntry } from '@/data/mood';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MoodOverviewProps {
  history: MoodHistoryEntry[];
}

type Period = 'month' | 'year';

const MoodOverview = ({ history }: MoodOverviewProps) => {
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();
  const filteredHistory = history.filter(entry => {
    const entryDate = new Date(entry.date);
    if (period === 'month') {
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    }
    if (period === 'year') {
      return entryDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const moodCounts = moods.map(mood => ({
    ...mood,
    value: filteredHistory.filter(entry => entry.moodId === mood.id).length,
  })).filter(mood => mood.value > 0);

  const mostFrequentMood = moodCounts.length > 0 
    ? moodCounts.reduce((prev, current) => (prev.value > current.value) ? prev : current)
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Overview</CardTitle>
        <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
          <Button
            variant={period === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('month')}
            className="h-7"
          >
            This Month
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('year')}
            className="h-7"
          >
            This Year
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-32 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={moodCounts}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                dataKey="value"
                nameKey="label"
                paddingAngle={moodCounts.length > 1 ? 5 : 0}
                startAngle={90}
                endAngle={450}
              >
                {moodCounts.map((entry) => (
                  <Cell key={`cell-${entry.id}`} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {mostFrequentMood ? (
              <>
                <span className="text-2xl">{mostFrequentMood.emoji}</span>
                <p className="text-xs text-muted-foreground mt-1 max-w-[100px]">
                  You have been mostly feeling <span className="font-bold text-primary">{mostFrequentMood.label.toLowerCase()}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data for this period.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodOverview;