import { useState, useMemo } from 'react';
import { Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, isFuture, isPast, isToday } from 'date-fns';

type ChartView = 'monthly' | 'company';

interface BillingAnalyticsProps {
  invoices: Invoice[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
}).format(amount);

const formatCurrencyFull = (amount: number) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(amount);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (label === '___SEPARATOR___') return null;

  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
    
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg text-sm min-w-[200px] z-50">
        <div className="mb-2 border-b pb-1 flex justify-between items-center">
          <span className="font-bold text-base">{label}</span>
          {payload[0].payload.isFuture && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">Future</span>}
        </div>
        <div className="space-y-1.5">
          {payload.slice().reverse().map((entry: any) => (
            <div key={entry.name} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground capitalize">{entry.name}</span>
              </div>
              <span className="font-mono font-medium" style={{ color: entry.color }}>
                {formatCurrencyFull(entry.value)}
              </span>
            </div>
          ))}
          <div className="border-t pt-1 mt-1 flex justify-between items-center gap-4">
            <span className="font-semibold">Total</span>
            <span className="font-bold">{formatCurrencyFull(total)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const BillingAnalytics = ({ invoices }: BillingAnalyticsProps) => {
  const [view, setView] = useState<ChartView>('monthly');

  const chartData = useMemo(() => {
    if (view === 'monthly') {
        const now = new Date();
        const start = subMonths(now, 9);
        const end = addMonths(now, 3);
        const months = eachMonthOfInterval({ start: startOfMonth(start), end: endOfMonth(end) });
        
        return months.map(month => {
          const dueInMonth = invoices.filter(inv => inv.dueDate && isSameMonth(inv.dueDate, month));
          let paid = 0, overdue = 0, pending = 0;

          dueInMonth.forEach(inv => {
            const amount = inv.amount || 0;
            if (inv.status === 'Paid') paid += amount;
            else if (inv.status === 'Overdue') overdue += amount;
            else {
              // Treat as overdue if past due date and not in current month window (grace period logic could go here)
              if (isPast(inv.dueDate) && !isSameMonth(inv.dueDate, now) && !isToday(inv.dueDate)) {
                 overdue += amount;
              } else {
                 pending += amount;
              }
            }
          });

          return {
            name: format(month, 'MMM yyyy'),
            paid,
            overdue,
            pending,
            isFuture: isFuture(month) && !isSameMonth(month, now)
          };
        });
    } else {
        // Company View
        const companies = new Map<string, { name: string; paid: number; overdue: number; pending: number; total: number }>();

        invoices.forEach(inv => {
            const name = inv.clientCompanyName || inv.clientName || 'Unknown';
            if (!companies.has(name)) {
                companies.set(name, { name, paid: 0, overdue: 0, pending: 0, total: 0 });
            }
            const data = companies.get(name)!;
            const amount = inv.amount || 0;
            
            if (inv.status === 'Paid') data.paid += amount;
            else if (inv.status === 'Overdue') data.overdue += amount;
            else data.pending += amount;
            
            data.total += amount;
        });

        const allCompanies = Array.from(companies.values());
        
        // Sort by Total Value Descending
        const sortedByValue = [...allCompanies].sort((a, b) => b.total - a.total);
        
        // Take Top 5
        const top5 = sortedByValue.slice(0, 5);
        
        // Take the rest and sort A-Z
        const rest = sortedByValue.slice(5).sort((a, b) => a.name.localeCompare(b.name));
        
        if (rest.length > 0) {
            return [...top5, { name: '___SEPARATOR___', paid: 0, overdue: 0, pending: 0, total: 0, isSeparator: true }, ...rest];
        }
        
        return top5;
    }
  }, [invoices, view]);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <CardTitle>{view === 'monthly' ? 'Invoicing Schedule' : 'Company Breakdown'}</CardTitle>
                <CardDescription>
                {view === 'monthly' 
                    ? "Monthly invoiced amounts by status over time." 
                    : "Total invoiced value grouped by company/client."}
                </CardDescription>
            </div>
            <Select value={view} onValueChange={(v) => setView(v as ChartView)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="monthly">Monthly Timeline</SelectItem>
                    <SelectItem value="company">By Company</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-0 sm:pl-2">
        <div className="h-[350px] w-full overflow-x-auto pb-2">
           <div style={{ 
              width: view === 'company' ? `${Math.max(chartData.length * 60, '100%')}` : '100%', 
              minWidth: '100%', 
              height: '100%' 
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  {view === 'company' && chartData.some((d: any) => d.isSeparator) && (
                     <ReferenceLine x="___SEPARATOR___" stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  )}
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    interval={view === 'company' ? 0 : 'preserveStartEnd'}
                    angle={view === 'company' ? -45 : 0}
                    textAnchor={view === 'company' ? 'end' : 'middle'}
                    height={view === 'company' ? 80 : 30}
                    tickFormatter={(val) => {
                        if (val === '___SEPARATOR___') return '';
                        return view === 'company' && val.length > 15 ? `${val.slice(0, 15)}...` : val;
                    }}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  
                  <Bar dataKey="paid" name="Paid" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} maxBarSize={50} />
                  <Bar dataKey="overdue" name="Overdue" stackId="a" fill="#ef4444" maxBarSize={50} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};