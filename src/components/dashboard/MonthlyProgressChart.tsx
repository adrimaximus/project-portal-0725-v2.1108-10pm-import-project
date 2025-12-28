import { useState, useMemo, useEffect } from 'react';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, getMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { usePaymentStatuses } from '@/hooks/usePaymentStatuses';

type ChartType = 'quantity' | 'value' | 'project_status' | 'payment_status' | 'company_quantity' | 'company_value';

interface MonthlyProgressChartProps {
  projects: Project[];
}

const CustomTooltip = ({ active, payload, label, chartType }: any) => {
  if (active && payload && payload.length) {
    // Helper to format currency
    const fmt = (val: number) => `Rp\u00A0${new Intl.NumberFormat('id-ID').format(val)}`;

    if (chartType === 'value') {
      // Specialized tooltip for Value Breakdown
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm text-sm min-w-[150px]">
          <p className="font-bold mb-2 border-b pb-1">{label}</p>
          <div className="space-y-1">
            {payload.slice().reverse().map((entry: any) => (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="capitalize text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-medium">{fmt(entry.value)}</span>
              </div>
            ))}
            <div className="border-t pt-1 mt-1 flex justify-between gap-4">
              <span className="font-semibold">Total</span>
              <span className="font-bold">
                {fmt(payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Default tooltip for other types
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
        <p className="font-bold mb-2">{label}</p>
        {chartType === 'quantity' || chartType === 'company_value' ? (
          <p className="text-foreground">
            <span className="font-semibold capitalize" style={{ color: payload[0].fill }}>
              {chartType.replace('company_', '')}:
            </span>{' '}
            {chartType.includes('value') ? fmt(payload[0].value) : payload[0].value}
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

const CustomLegend = ({ payload }: any) => {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-foreground">
      {payload.slice().reverse().map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center">
          <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const RoundedBar = (props: any) => {
  const { fill, x, y, width, height, payload, dataKey, options } = props;

  if (height <= 0) {
    return null;
  }

  const currentIndex = options.findIndex((opt: any) => opt.name === dataKey);
  
  let isTop = true;
  if (currentIndex < options.length - 1) {
    for (let i = currentIndex + 1; i < options.length; i++) {
      const key = options[i].name;
      if (payload[key] > 0) {
        isTop = false;
        break;
      }
    }
  }

  const radius = 4;

  if (isTop) {
    return (
      <path
        d={`M${x},${y + radius} 
           A${radius},${radius} 0 0 1 ${x + radius},${y} 
           L${x + width - radius},${y} 
           A${radius},${radius} 0 0 1 ${x + width},${y + radius} 
           L${x + width},${y + height} 
           L${x},${y + height} 
           Z`}
        fill={fill}
      />
    );
  } else {
    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
  }
};

const MonthlyProgressChart = ({ projects }: MonthlyProgressChartProps) => {
  const { hasPermission } = useAuth();
  const canViewValue = hasPermission('projects:view_value');
  const [chartType, setChartType] = useState<ChartType>('quantity');
  
  const { data: projectStatuses = [] } = useProjectStatuses();
  const { data: paymentStatuses = [], isLoading: isLoadingPaymentStatuses } = usePaymentStatuses();

  useEffect(() => {
    if (!canViewValue && (chartType === 'value' || chartType === 'company_value')) {
      setChartType('quantity');
    }
  }, [canViewValue, chartType]);

  const chartData = useMemo(() => {
    if (chartType === 'company_quantity' || chartType === 'company_value') {
      const companies = new Map<string, { name: string; quantity: number; value: number }>();

      projects.forEach(project => {
        const p = project as any;
        const companyName = p.client_company_name || 'No Company';
        
        if (!companies.has(companyName)) {
          companies.set(companyName, { name: companyName, quantity: 0, value: 0 });
        }
        
        const companyData = companies.get(companyName)!;
        companyData.quantity += 1;
        companyData.value += p.budget || 0;
      });

      return Array.from(companies.values());
    }

    const months = Array.from({ length: 12 }, (_, i) => {
      const base = {
        name: format(new Date(0, i), 'MMM'),
        quantity: 0,
        value: 0,
        paid: 0,
        overdue: 0,
        pending: 0,
      };
      
      const projectStatusCounts = projectStatuses.length > 0 
        ? Object.fromEntries(projectStatuses.map(s => [s.name, 0]))
        : {};
        
      const paymentStatusCounts = paymentStatuses.length > 0
        ? Object.fromEntries(paymentStatuses.map(s => [s.name, 0]))
        : {};
      
      return { ...base, ...projectStatusCounts, ...paymentStatusCounts };
    });

    projects.forEach(project => {
      if (project.start_date) {
        const monthIndex = getMonth(new Date(project.start_date));
        if (months[monthIndex]) {
          months[monthIndex].quantity += 1;
          const budget = project.budget || 0;
          months[monthIndex].value += budget;

          // Financial Breakdown
          if (project.payment_status === 'Paid') {
            months[monthIndex].paid += budget;
          } else if (project.payment_status === 'Overdue') {
            months[monthIndex].overdue += budget;
          } else {
            months[monthIndex].pending += budget;
          }
          
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
  }, [projects, chartType, projectStatuses, paymentStatuses]);

  const renderChart = () => {
    switch (chartType) {
      case 'quantity':
      case 'company_quantity':
      case 'company_value': {
        const isCompanyChart = chartType.startsWith('company_');
        const valueType = isCompanyChart ? chartType.substring('company_'.length) : chartType;

        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              interval={isCompanyChart ? 0 : 1}
              angle={isCompanyChart ? -45 : 0}
              textAnchor={isCompanyChart ? 'end' : 'middle'}
              height={isCompanyChart ? 70 : undefined}
              dy={isCompanyChart ? 10 : 0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={10}
              tickFormatter={(value) =>
                valueType === 'value'
                  ? `Rp${new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value)}`
                  : value
              }
            />
            <Tooltip content={<CustomTooltip chartType={valueType} />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Bar dataKey={valueType} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      }
      case 'value': {
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              fontSize={10} 
              tickFormatter={(value) => `Rp${new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value)}`}
            />
            <Tooltip content={<CustomTooltip chartType="value" />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Legend />
            <Bar 
              dataKey="paid" 
              name="Paid" 
              stackId="a" 
              fill="#22c55e" 
              radius={[0, 0, 0, 0]} 
              maxBarSize={60} 
            />
            <Bar 
              dataKey="overdue" 
              name="Overdue" 
              stackId="a" 
              fill="#ef4444" 
              radius={[0, 0, 0, 0]} 
              maxBarSize={60} 
            />
            <Bar 
              dataKey="pending" 
              name="Pending" 
              stackId="a" 
              fill="#94a3b8" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={60} 
            />
          </BarChart>
        );
      }
      case 'project_status':
        if (projectStatuses.length === 0) return <div className="flex items-center justify-center h-full">Loading...</div>;

        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} />
            <Tooltip content={<CustomTooltip chartType={chartType} />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Legend content={<CustomLegend />} />
            {projectStatuses.map((status) => {
              return (
                <Bar 
                  key={status.id} 
                  dataKey={status.name} 
                  stackId="a" 
                  fill={status.color} 
                  name={status.name} 
                  shape={<RoundedBar options={projectStatuses} />} 
                />
              )
            })}
          </BarChart>
        );
      case 'payment_status':
        if (isLoadingPaymentStatuses || paymentStatuses.length === 0) {
          return <div className="flex items-center justify-center h-full">Loading statuses...</div>;
        }
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} />
            <Tooltip content={<CustomTooltip chartType={chartType} />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Legend content={<CustomLegend />} />
            {paymentStatuses.map((status) => {
              return (
                <Bar 
                  key={status.id} 
                  dataKey={status.name} 
                  stackId="a" 
                  fill={status.color} 
                  name={status.name} 
                  shape={<RoundedBar options={paymentStatuses} />} 
                />
              )
            })}
          </BarChart>
        );
    }
  };

  const cardTitle = chartType.startsWith('company_') ? 'Company Overview' : 'Monthly Overview';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <CardTitle>{cardTitle}</CardTitle>
          <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quantity">Project Quantity</SelectItem>
              {canViewValue && <SelectItem value="value">Project Value</SelectItem>}
              <SelectItem value="project_status">Project Status</SelectItem>
              <SelectItem value="payment_status">Payment Status (Count)</SelectItem>
              <SelectItem value="company_quantity">Company Project Qty</SelectItem>
              {canViewValue && <SelectItem value="company_value">Company Project Value</SelectItem>}
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