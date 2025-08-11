import { useMemo } from 'react';
import { Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { eachMonthOfInterval, startOfYear, endOfYear, format, parseISO } from 'date-fns';

interface GoalProgressChartProps {
  goal: Goal;
}

export default function GoalProgressChart({ goal }: GoalProgressChartProps) {
  const data = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfYear(new Date()),
      end: endOfYear(new Date()),
    });

    return months.map(month => {
      const monthCompletions = goal.completions.filter(c =>
        format(parseISO(c.date), 'yyyy-MM') === format(month, 'yyyy-MM')
      );

      const value = goal.type === 'quantity'
        ? monthCompletions.length
        : monthCompletions.reduce((sum, c) => sum + c.value, 0);

      return {
        name: format(month, 'MMM'),
        value,
      };
    });
  }, [goal]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill={goal.color} name={goal.type === 'quantity' ? 'Completions' : `Value (${goal.unit})`} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}