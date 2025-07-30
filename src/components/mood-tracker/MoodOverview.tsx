import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { moods, MoodEntry, Mood } from '@/data/mood';
import { isThisMonth, parseISO } from 'date-fns';

interface MoodOverviewProps {
  history: MoodEntry[];
}

const MoodOverview = ({ history }: MoodOverviewProps) => {
  const [timeframe, setTimeframe] = useState<'all' | 'month'>('all');

  const filteredHistory = timeframe === 'month'
    ? history.filter(entry => isThisMonth(parseISO(entry.date)))
    : history;

  const moodCounts = filteredHistory.reduce((acc, entry) => {
    acc[entry.moodId] = (acc[entry.moodId] || 0) + 1;
    return acc;
  }, {} as Record<Mood['id'], number>);

  const chartData = moods.map(mood => ({
    name: mood.label,
    value: moodCounts[mood.id] || 0,
    color: mood.bgColor.replace('bg-', ''), // Simplified color for chart
  }));

  const getMoodColor = (moodId: Mood['id']) => {
    return moods.find(m => m.id === moodId)?.bgColor.replace('bg-', 'bg-') || 'bg-gray-500';
  }

  const mostFrequentMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const mostFrequentMoodData = mostFrequentMood ? moods.find(m => m.id === mostFrequentMood[0]) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Overview</CardTitle>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
          <Button size="sm" variant={timeframe === 'all' ? 'secondary' : 'ghost'} onClick={() => setTimeframe('all')}>All time</Button>
          <Button size="sm" variant={timeframe === 'month' ? 'secondary' : 'ghost'} onClick={() => setTimeframe('month')}>This month</Button>
        </div>
      </CardHeader>
      <CardContent className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              stroke="hsl(var(--background))"
              strokeWidth={3}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} className={moods[index].bgColor} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {mostFrequentMoodData ? (
            <>
              <mostFrequentMoodData.Icon className={`h-10 w-10 mb-2 ${mostFrequentMoodData.color}`} />
              <p className="text-sm text-muted-foreground">You have been</p>
              <p className="font-semibold text-lg">mostly feeling {mostFrequentMoodData.label.toLowerCase()}</p>
            </>
          ) : (
            <p className="text-muted-foreground">No data for this period.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodOverview;