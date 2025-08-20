import { useState, useMemo } from 'react';
import { Project, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, getMonth } from 'date-fns';
import { getStatusStyles, getPaymentStatusStyles } from '@/lib/utils';

type ChartType = 'quantity' | 'value' | 'project_status' | 'payment_status';

interface MonthlyProgressChartProps {
  projects: Project[];
}

const MonthlyProgressChart = ({ projects }: MonthlyProgressChartProps) => {
  const [chartType, setChartType] = useState<ChartType>('quantity');

  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const base = {
        name: format(new Date(0, i), 'MMM'),
        quantity: 0,
        value: 0,
      };
      const projectStatus = Object.fromEntries(PROJECT_STATUS_OPTIONS.map(s => [s.value, 0]));
      const paymentStatus = Object.fromEntries(PAYMENT_STATUS_OPTIONS.map(s => [s.value, 0]));
      return { ...base, ...projectStatus, ...paymentStatus };
    });

    projects.forEach(project => {
      if (project.start_date) {
        const monthIndex = getMonth(new Date(project.start_date));
        if (months[monthIndex]) {
          months[monthIndex].quantity += 1;
          months[monthIndex].value += project.budget || 0;
          if (project.status && months[monthIndex][project.status] !== undefined) {
            months[monthIndex][project.status]++;
          }
          if (project.payment_status && months[monthIndex][project.payment_status] !== undefined) {
            months[monthIndex][project.payment_status]++;
          }
        }
      }
    });

    return months;
  }, [projects]);

  const renderChart = () => {
    switch (chartType) {
      case 'quantity':
      case 'value':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} tickFormatter={(value) => chartType === 'value' ? `Rp${new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value)}` : value} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              formatter={(value) => chartType === 'value' ? `Rp ${new Intl.NumberFormat('id-ID').format(value as number)}` : value}
            />
            <Bar dataKey={chartType} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'project_status':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            {PROJECT_STATUS_OPTIONS.map(status => (
              <Bar key={status.value} dataKey={status.value} stackId="a" fill={getStatusStyles(status.value).hex} name={status.label} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case 'payment_status':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            {PAYMENT_STATUS_OPTIONS.map(status => (
              <Bar key={status.value} dataKey={status.value} stackId="a" fill={getPaymentStatusStyles(status.value).hex} name={status.label} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <CardTitle>Monthly Overview</CardTitle>
          <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quantity">Project Quantity</SelectItem>
              <SelectItem value="value">Project Value</SelectItem>
              <SelectItem value="project_status">Project Status</SelectItem>
              <SelectItem value="payment_status">Payment Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyProgressChart;