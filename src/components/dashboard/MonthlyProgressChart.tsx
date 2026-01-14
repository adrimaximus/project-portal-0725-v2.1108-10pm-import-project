import { useState, useMemo, useEffect } from 'react';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, getMonth, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { usePaymentStatuses } from '@/hooks/usePaymentStatuses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

type ChartType = 'quantity' | 'value' | 'project_status' | 'payment_status' | 'company_quantity' | 'company_value';

interface MonthlyProgressChartProps {
  projects: Project[];
}

const CustomTooltip = ({ active, payload, label, chartType }: any) => {
  if (label === '___SEPARATOR___') return null;

  if (active && payload && payload.length) {
    const fmt = (val: number) => `Rp\u00A0${new Intl.NumberFormat('id-ID').format(val)}`;

    if (chartType === 'value') {
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

const MonthlyProgressChart = ({ projects: initialProjects }: MonthlyProgressChartProps) => {
  const { hasPermission } = useAuth();
  const canViewValue = hasPermission('projects:view_value');
  const [chartType, setChartType] = useState<ChartType>('quantity');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const { data: projectStatuses = [], isLoading: isLoadingProjectStatuses } = useProjectStatuses();
  const { data: paymentStatuses = [], isLoading: isLoadingPaymentStatuses } = usePaymentStatuses();

  // Independently fetch all projects to ensure stats are accurate and not limited by parent pagination
  const { data: allProjects } = useQuery({
    queryKey: ['all_projects_for_chart'],
    queryFn: async () => {
        // Use RPC or select to get broader dataset. RPC is better for complex joins/filtering logic.
        // Assuming get_dashboard_projects handles RLS correctly.
        const { data, error } = await supabase.rpc('get_dashboard_projects', {
            p_limit: 1000, // Fetch a large number for comprehensive stats
            p_offset: 0,
            p_search_term: '',
        });
        if (error) throw error;
        // Map the result to match Project type interface loosely if needed, or cast
        return data as unknown as Project[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const projectsToUse = allProjects || initialProjects;

  useEffect(() => {
    if (!canViewValue && (chartType === 'value' || chartType === 'company_value')) {
      setChartType('quantity');
    }
  }, [canViewValue, chartType]);

  const filteredProjects = useMemo(() => {
    if (!dateRange?.from) return projectsToUse;

    return projectsToUse.filter(project => {
      if (!project.start_date) return false;
      const projectDate = new Date(project.start_date);
      
      // If only 'from' is selected (single day or start of range)
      if (dateRange.from && !dateRange.to) {
        // Show projects on or after start date
        return projectDate >= startOfDay(dateRange.from);
      }
      
      // If range is selected
      if (dateRange.from && dateRange.to) {
        return isWithinInterval(projectDate, { 
          start: startOfDay(dateRange.from), 
          end: endOfDay(dateRange.to) 
        });
      }
      
      return true;
    });
  }, [projectsToUse, dateRange]);

  const chartData = useMemo(() => {
    if (!filteredProjects) return [];

    if (chartType === 'company_quantity' || chartType === 'company_value') {
      const companies = new Map<string, { name: string; quantity: number; value: number }>();

      filteredProjects.forEach(project => {
        const p = project as any;
        const companyName = p.client_company_name || 'No Company';
        
        if (!companies.has(companyName)) {
          companies.set(companyName, { name: companyName, quantity: 0, value: 0 });
        }
        
        const companyData = companies.get(companyName)!;
        companyData.quantity += 1;
        companyData.value += p.budget || 0;
      });

      const allCompanies = Array.from(companies.values());
      const sortMetric = chartType === 'company_value' ? 'value' : 'quantity';

      const sortedByMetric = [...allCompanies].sort((a, b) => b[sortMetric] - a[sortMetric]);

      const top5 = sortedByMetric.slice(0, 5);
      const rest = sortedByMetric.slice(5);

      const restSorted = rest.sort((a, b) => a.name.localeCompare(b.name));

      if (restSorted.length > 0) {
        return [...top5, { name: '___SEPARATOR___', quantity: 0, value: 0, isSeparator: true }, ...restSorted];
      }

      return top5;
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

    filteredProjects.forEach(project => {
      if (project.start_date) {
        const monthIndex = getMonth(new Date(project.start_date));
        if (months[monthIndex]) {
          months[monthIndex].quantity += 1;
          const budget = project.budget || 0;
          months[monthIndex].value += budget;

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
  }, [filteredProjects, chartType, projectStatuses, paymentStatuses]);

  const handleDownloadReport = () => {
    if (!filteredProjects || filteredProjects.length === 0) {
      toast.error("No projects to download");
      return;
    }

    try {
      // Prepare CSV Headers
      const headers = [
        'Project Name',
        'Slug',
        'Client',
        'Company',
        'Category',
        'Status',
        'Payment Status',
        'Progress',
        'Budget',
        'Start Date',
        'Due Date',
        'Payment Due Date',
        'Created At'
      ];

      // Prepare CSV Rows
      const rows = filteredProjects.map((p: any) => {
        return [
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${p.slug || ''}"`,
          `"${(p.client_name || '').replace(/"/g, '""')}"`,
          `"${(p.client_company_name || '').replace(/"/g, '""')}"`,
          `"${(p.category || '').replace(/"/g, '""')}"`,
          `"${p.status || ''}"`,
          `"${p.payment_status || ''}"`,
          `${p.progress || 0}%`,
          `${p.budget || 0}`,
          `"${p.start_date ? format(new Date(p.start_date), 'yyyy-MM-dd') : ''}"`,
          `"${p.due_date ? format(new Date(p.due_date), 'yyyy-MM-dd') : ''}"`,
          `"${p.payment_due_date ? format(new Date(p.payment_due_date), 'yyyy-MM-dd') : ''}"`,
          `"${p.created_at ? format(new Date(p.created_at), 'yyyy-MM-dd HH:mm:ss') : ''}"`
        ].join(',');
      });

      // Combine Headers and Rows
      const csvContent = [headers.join(','), ...rows].join('\n');

      // Create Download Link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const dateStr = dateRange?.from 
        ? `${format(dateRange.from, 'yyyyMMdd')}${dateRange.to ? '-' + format(dateRange.to, 'yyyyMMdd') : ''}`
        : format(new Date(), 'yyyyMMdd');
        
      link.setAttribute('href', url);
      link.setAttribute('download', `project_report_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to generate report");
    }
  };

  const isCompanyView = chartType.startsWith('company_');

  const renderChart = () => {
    switch (chartType) {
      case 'quantity':
      case 'company_quantity':
      case 'company_value': {
        const valueType = isCompanyView ? chartType.substring('company_'.length) : chartType;

        return (
          <BarChart 
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {isCompanyView && chartData.some((d: any) => d.isSeparator) && (
              <ReferenceLine x="___SEPARATOR___" stroke="hsl(var(--border))" strokeDasharray="3 3" />
            )}
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              interval={isCompanyView ? 0 : 1}
              angle={isCompanyView ? -45 : 0}
              textAnchor={isCompanyView ? 'end' : 'middle'}
              height={isCompanyView ? 100 : 30}
              dy={isCompanyView ? 5 : 10}
              tickFormatter={(val) => {
                if (val === '___SEPARATOR___') return '';
                return isCompanyView && val.length > 20 ? `${val.slice(0, 20)}...` : val;
              }}
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
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} height={30} />
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
        if (isLoadingProjectStatuses) return <div className="flex items-center justify-center h-full">Loading...</div>;
        if (projectStatuses.length === 0) return <div className="flex items-center justify-center h-full">No statuses defined</div>;

        return (
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} height={30} />
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
        if (isLoadingPaymentStatuses) return <div className="flex items-center justify-center h-full">Loading...</div>;
        if (paymentStatuses.length === 0) return <div className="flex items-center justify-center h-full">No statuses defined</div>;

        return (
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={1} height={30} />
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="whitespace-nowrap">{cardTitle}</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleDownloadReport}
                  title="Download Report"
                  className="shrink-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <div className="flex-1 sm:w-auto">
                  <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
              </div>
              
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] p-0 sm:p-6">
        <div className="h-full w-full overflow-x-auto pb-4">
          <div style={{ 
            width: isCompanyView ? `${Math.max(chartData.length * 60, 600)}px` : '100%', 
            minWidth: '100%', 
            height: '100%' 
          }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyProgressChart;