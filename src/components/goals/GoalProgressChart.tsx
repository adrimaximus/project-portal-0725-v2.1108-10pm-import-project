import { useMemo } from 'react';
import { Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, ReferenceLine, Label } from 'recharts';
import { getYear, parseISO, format } from 'date-fns';
import { formatValue } from '@/lib/formatting';
import AiCoachInsight from './AiCoachInsight';

interface GoalProgressChartProps {
  goal: Goal;
}

const GoalProgressChart = ({ goal }: GoalProgressChartProps) => {
  const { chartData, total, target, percentage, unit } = useMemo(() => {
    const currentYear = getYear(new Date());
    const monthlyData: { [key: string]: number } = {};

    for (let i = 0; i < 12; i++) {
      const monthName = format(new Date(currentYear, i, 1), 'MMM');
      monthlyData[monthName] = 0;
    }

    goal.completions
      .filter(c => getYear(parseISO(c.date)) === currentYear)
      .forEach(c => {
        const monthName = format(parseISO(c.date), 'MMM');
        if (monthlyData.hasOwnProperty(monthName)) {
          monthlyData[monthName] += c.value;
        }
      });

    const chartData = Object.entries(monthlyData).map(([name, value]) => ({ name, value }));
    
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const target = goal.type === 'quantity' ? goal.targetQuantity : goal.targetValue;
    const percentage = target ? Math.min(Math.round((total / target) * 100), 100) : 0;

    return { chartData, total, target, percentage, unit: goal.unit };
  }, [goal]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background border rounded-md shadow-md">
          <p className="font-bold">{label}</p>
          <p style={{ color: goal.color }}>
            {`Progress: ${formatValue(payload[0].value, unit)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const monthlyTarget = target > 0 ? target / 12 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Progress Overview</CardTitle>
        {target > 0 && (
          <p className="text-sm text-muted-foreground pt-1">
            {formatValue(total, unit)} / {formatValue(target, unit)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatValue(value, unit, true)} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" fill={goal.color} radius={[4, 4, 0, 0]} />
              {monthlyTarget > 0 && (
                <ReferenceLine y={monthlyTarget} stroke="hsl(var(--primary))" strokeDasharray="3 3">
                  <Label value="Avg. Target" position="insideTopRight" fill="hsl(var(--primary))" fontSize={12} />
                </ReferenceLine>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <AiCoachInsight goal={goal} yearlyProgress={{ percentage }} />
      </CardContent>
    </Card>
  );
};

export default GoalProgressChart;