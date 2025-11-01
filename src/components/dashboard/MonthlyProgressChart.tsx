import { useState, useMemo, useEffect } from 'react';
import { Project, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, getMonth } from 'date-fns';
import { getProjectStatusStyles, getPaymentStatusStyles } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type ChartType = 'quantity' | 'value' | 'project_status' | 'payment_status' | 'company_quantity' | 'company_value';

interface MonthlyProgressChartProps {
  projects: Project[];
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

  const currentIndex = options.findIndex((opt: any) => opt.value === dataKey);
  let isTop = true;
  if (currentIndex < options.length - 1) {
    for (let i = currentIndex + 1; i < options.length; i++) {
      const key = options[i].value;
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
  }, [projects, chartType]);

  const renderChart = () => {
    switch (chartType) {
      case 'quantity':
      case 'value':
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
      case 'project_status':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} />
            <Tooltip content={<CustomTooltip chartType={chartType} />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Legend content={<CustomLegend />} />
            {PROJECT_STATUS_OPTIONS.map((status) => {
              const styles = getProjectStatusStyles(status.value);
              return (
                <Bar 
                  key={status.value} 
                  dataKey={status.value} 
                  stackId="a" 
                  fill={styles.hex} 
                  name={status.label} 
                  shape={<RoundedBar options={PROJECT_STATUS_OPTIONS} />} 
                />
              )
            })}
          </BarChart>
        );
      case 'payment_status':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} />
            <Tooltip content={<CustomTooltip chartType={chartType} />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Legend content={<CustomLegend />} />
            {PAYMENT_STATUS_OPTIONS.map((status) => {
              const styles = getPaymentStatusStyles(status.value);
              return (
                <Bar 
                  key={status.value} 
                  dataKey={status.value} 
                  stackId="a" 
                  fill={styles.hex} 
                  name={status.label} 
                  shape={<RoundedBar options={PAYMENT_STATUS_OPTIONS} />} 
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
              <SelectItem value="payment_status">Payment Status</SelectItem>
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