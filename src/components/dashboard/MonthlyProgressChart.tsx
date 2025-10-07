import { useState, useMemo, useEffect } from 'react';
import { Project, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, getMonth } from 'date-fns';
import { getStatusStyles, getPaymentStatusStyles } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type ChartMetric = 'quantity' | 'value' | 'project_status' | 'payment_status';
type OverviewType = 'monthly' | 'company';
type ChartType = `${OverviewType}_${ChartMetric}`;

interface MonthlyProgressChartProps {
  projects: (Project & { client_company_name?: string | null })[];
}

const CustomTooltip = ({ active, payload, label, chartType }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
        <p className="font-bold mb-2">{label}</p>
        {chartType === 'quantity' || chartType === 'value' ? (
          <p className="text-foreground">
            <span className="font-semibold capitalize" style={{ color: payload[0].fill }}>
              {chartType}:
            </span>{' '}
            {chartType === 'value' ? `Rp\u00A0${new Intl.NumberFormat('id-ID').format(payload[0].value as number)}` : payload[0].value}
          </p>
        ) : (
          <ul className="space-y-1">
            {payload.slice().reverse().map((entry: any) => (
              <li key={entry.dataKey} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.fill }}></span>
                  <span>{entry.name}:</span>
                </div>
                <span className="font-bold ml-4">{entry.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return null;
};

const MonthlyProgressChart = ({ projects }: MonthlyProgressChartProps) => {
  const { hasPermission } = useAuth();
  const canViewValue = hasPermission('projects:view_value');
  const [chartType, setChartType] = useState<ChartType>('monthly_quantity');

  useEffect(() => {
    const [_overview, metric] = chartType.split('_');
    if (!canViewValue && metric === 'value') {
      setChartType(`${_overview}_quantity` as ChartType);
    }
  }, [canViewValue, chartType]);

  const chartData = useMemo(() => {
    const [overviewType] = chartType.split('_') as [OverviewType, ChartMetric];

    if (overviewType === 'monthly') {
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
    }

    if (overviewType === 'company') {
      const companyMap = new Map<string, any>();
      projects.forEach(project => {
        const companyName = project.client_company_name || 'N/A';
        if (!companyMap.has(companyName)) {
          const base = { name: companyName, quantity: 0, value: 0 };
          const projectStatus = Object.fromEntries(PROJECT_STATUS_OPTIONS.map(s => [s.value, 0]));
          const paymentStatus = Object.fromEntries(PAYMENT_STATUS_OPTIONS.map(s => [s.value, 0]));
          companyMap.set(companyName, { ...base, ...projectStatus, ...paymentStatus });
        }
        const companyData = companyMap.get(companyName)!;
        companyData.quantity += 1;
        companyData.value += project.budget || 0;
        if (project.status && companyData[project.status] !== undefined) {
          companyData[project.status]++;
        }
        if (project.payment_status && companyData[project.payment_status] !== undefined) {
          companyData[project.payment_status]++;
        }
      });

      const companyArray = Array.from(companyMap.values());
      const sortBy = chartType.includes('value') ? 'value' : 'quantity';
      companyArray.sort((a, b) => b[sortBy] - a[sortBy]);
      return companyArray.slice(0, 10);
    }

    return [];
  }, [projects, chartType]);

  const renderChart = () => {
    const [overviewType, metric] = chartType.split('_') as [OverviewType, ChartMetric];

    const sanitizeKeyForCss = (key: string) => key.replace(/\s+/g, '-').toLowerCase();

    switch (metric) {
      case 'quantity':
      case 'value':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} tickFormatter={(value) => metric === 'value' ? `Rp${new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value)}` : value} />
            <Tooltip
              content={<CustomTooltip chartType={metric} />}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Bar dataKey={metric} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'project_status':
      case 'payment_status': {
        const isProjectStatus = metric === 'project_status';
        const options = isProjectStatus ? PROJECT_STATUS_OPTIONS : PAYMENT_STATUS_OPTIONS;
        const getStyles = isProjectStatus ? getStatusStyles : getPaymentStatusStyles;

        const chartConfig = options.reduce((acc, status) => {
          acc[sanitizeKeyForCss(status.value)] = {
            label: status.label,
            color: getStyles(status.value).hex,
          };
          return acc;
        }, {} as ChartConfig);

        return (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} />
              <YAxis tickLine={false} axisLine={false} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <ChartLegend content={<ChartLegendContent />} />
              {options.map(status => (
                <Bar
                  key={status.value}
                  dataKey={status.value}
                  stackId="a"
                  fill={`var(--color-${sanitizeKeyForCss(status.value)})`}
                  name={status.label}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <CardTitle>Project Overview</CardTitle>
          <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Monthly</SelectLabel>
                <SelectItem value="monthly_quantity">Project Quantity</SelectItem>
                {canViewValue && <SelectItem value="monthly_value">Project Value</SelectItem>}
                <SelectItem value="monthly_project_status">Project Status</SelectItem>
                <SelectItem value="monthly_payment_status">Payment Status</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Company</SelectLabel>
                <SelectItem value="company_quantity">Company Quantity</SelectItem>
                {canViewValue && <SelectItem value="company_value">Company Value</SelectItem>}
                <SelectItem value="company_project_status">Company Project Status</SelectItem>
                <SelectItem value="company_payment_status">Company Payment Status</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-[350px] pt-6">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyProgressChart;