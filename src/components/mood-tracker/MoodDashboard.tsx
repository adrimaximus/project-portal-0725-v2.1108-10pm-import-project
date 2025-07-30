import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { moods, MoodHistoryEntry } from '@/data/mood';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DayContent, DayContentProps } from 'react-day-picker';

interface MoodDashboardProps {
  history: MoodHistoryEntry[];
}

type Period = 'month' | 'year';

const MoodDashboard = ({ history }: MoodDashboardProps) => {
  // State for chart
  const [period, setPeriod] = useState<Period>('month');
  // State for calendar
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // --- Chart Logic ---
  const now = new Date();
  const filteredHistoryForChart = history.filter(entry => {
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
    value: filteredHistoryForChart.filter(entry => entry.moodId === mood.id).length,
  })).filter(mood => mood.value > 0);

  const mostFrequentMood = moodCounts.length > 0 
    ? moodCounts.reduce((prev, current) => (prev.value > current.value) ? prev : current)
    : null;

  // --- Calendar Logic ---
  const historyMap = new Map(history.map(entry => [entry.date, entry.moodId]));

  const moodModifiers = moods.reduce((acc, mood) => {
    acc[`mood-${mood.id}`] = (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      return historyMap.get(dateString) === mood.id;
    };
    return acc;
  }, {} as Record<string, (date: Date) => boolean>);

  const moodModifierStyles = moods.reduce((acc, mood) => {
    acc[`mood-${mood.id}`] = {
      backgroundColor: mood.color,
      color: '#fff',
      borderRadius: '0.5rem',
    };
    return acc;
  }, {} as Record<string, React.CSSProperties>);

  const CustomDayContent = (props: DayContentProps) => {
    if (props.activeModifiers.outside) {
      return <DayContent {...props} />;
    }
    const dateString = props.date.toISOString().split('T')[0];
    const moodId = historyMap.get(dateString);
    const mood = moodId ? moods.find(m => m.id === moodId) : null;
    if (mood) {
      return <span className="text-lg" role="img" aria-label={mood.label}>{mood.emoji}</span>;
    }
    return <DayContent {...props} />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Chart Overview */}
        <div>
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="font-semibold">Overview</h3>
            <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
              <Button variant={period === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setPeriod('month')} className="h-7">This Month</Button>
              <Button variant={period === 'year' ? 'default' : 'ghost'} size="sm" onClick={() => setPeriod('year')} className="h-7">This Year</Button>
            </div>
          </div>
          <div className="w-full h-64 relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={moodCounts} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" dataKey="value" nameKey="label" paddingAngle={moodCounts.length > 1 ? 5 : 0} startAngle={90} endAngle={450}>
                  {moodCounts.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              {mostFrequentMood ? (
                <>
                  <span className="text-4xl">{mostFrequentMood.emoji}</span>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[150px]">
                    You have been mostly feeling <span className="font-bold text-primary">{mostFrequentMood.label.toLowerCase()}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data for this period.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Calendar */}
        <div className="flex flex-col items-center">
           <h3 className="font-semibold pb-2">Mood Calendar</h3>
           <Calendar
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            modifiers={moodModifiers}
            modifiersStyles={moodModifierStyles}
            components={{ DayContent: CustomDayContent }}
            className="p-0 border rounded-md"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodDashboard;