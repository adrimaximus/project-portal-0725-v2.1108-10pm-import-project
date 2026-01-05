import { useMemo, useState, useEffect } from 'react';
import { Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, ReferenceLine, Label } from 'recharts';
import { getYear, parseISO, format } from 'date-fns';
import { formatValue } from '@/lib/formatting';
import AiCoachInsight from './AiCoachInsight';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GoalProgressChartProps {
  goal: Goal;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

const GoalProgressChart = ({ goal, selectedYear, onYearChange }: GoalProgressChartProps) => {
  const currentYear = getYear(new Date());
  
  // Generate list of available years based on completion data or default to current year
  const years = useMemo(() => {
    const dataYears = goal.completions.map(c => getYear(parseISO(c.date)));
    const uniqueYears = Array.from(new Set([currentYear, ...dataYears])).sort((a, b) => b - a);
    return uniqueYears.map(String);
  }, [goal.completions, currentYear]);

  // Ensure selected year is in the list, or fallback to current
  useEffect(() => {
    if (!years.includes(selectedYear)) {
      onYearChange(currentYear.toString());
    }
  }, [years, selectedYear, currentYear, onYearChange]);

  const { chartData, total, target, percentage, unit } = useMemo(() => {
    const yearToView = parseInt(selectedYear, 10);
    const monthlyData: { [key: string]: number } = {};

    for (let i = 0; i < 12; i++) {
      const monthName = format(new Date(yearToView, i, 1), 'MMM');
      monthlyData[monthName] = 0;
    }

    goal.completions
      .filter(c => getYear(parseISO(c.date)) === yearToView)
      .forEach(c => {
        const monthName = format(parseISO(c.date), 'MMM');
        if (monthlyData.hasOwnProperty(monthName)) {
          monthlyData[monthName] += c.value;
        }
      });

    const chartData = Object.entries(monthlyData).map(([name, value]) => ({ name, value }));
    
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const target = goal.type === 'quantity' ? goal.target_quantity : goal.target_value;
    const percentage = target ? Math.min(Math.round((total / target) * 100), 100) : 0;

    return { chartData, total, target, percentage, unit: goal.unit };
  }, [goal, selectedYear]);

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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Monthly Progress Overview</CardTitle>
          {target > 0 && (
            <p className="text-sm text-muted-foreground pt-1">
              {formatValue(total, unit)} / {formatValue(target, unit)}
            </p>
          )}
        </div>
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[100px] h-8">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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