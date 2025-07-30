import { moods, MoodHistoryEntry } from '@/data/mood';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

type Period = 'week' | 'month' | 'year';

interface MoodOverviewProps {
  history: MoodHistoryEntry[];
  period: Period;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const shouldMoveLeft = data.label === 'Happy' || data.label === 'Good';

    return (
      <div className={cn(shouldMoveLeft && '-translate-x-full')}>
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.emoji}</span>
            <p className="text-sm text-muted-foreground">
              <span className="font-bold" style={{ color: data.color }}>{data.label}</span>: {data.value} day{data.value !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const MoodOverview = ({ history, period }: MoodOverviewProps) => {
  const filteredHistory = history.filter(entry => {
    const entryDate = new Date(entry.date);
    const today = new Date();

    if (period === 'week') {
      const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - dayOfWeek);
      firstDay.setHours(0, 0, 0, 0);

      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      lastDay.setHours(23, 59, 59, 999);

      return entryDate >= firstDay && entryDate <= lastDay;
    }
    if (period === 'month') {
      return entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear();
    }
    if (period === 'year') {
      return entryDate.getFullYear() === today.getFullYear();
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
    <div className="w-[90%] mx-auto h-48 relative pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'transparent' }}
            wrapperStyle={{ zIndex: 50 }}
          />
          <Pie
            data={moodCounts}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="90%"
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
  );
};

export default MoodOverview;