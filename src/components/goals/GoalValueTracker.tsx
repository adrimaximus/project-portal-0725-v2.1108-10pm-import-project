import { GoalCompletion, User } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generatePastelColor } from '@/lib/utils';

interface GoalValueTrackerProps {
  completions: (GoalCompletion & { user: User })[];
  targetValue?: number;
  unit?: string;
}

const GoalValueTracker = ({ completions, targetValue, unit }: GoalValueTrackerProps) => {
  const data = completions.map(c => ({
    date: format(parseISO(c.date), 'MMM d'),
    value: c.value,
    user: c.user,
  }));

  const aggregatedData = data.reduce((acc, curr) => {
    const existing = acc.find(item => item.date === curr.date);
    if (existing) {
      existing.value += curr.value;
      if (!existing.users.some((u: any) => u.id === curr.user.id)) {
        existing.users.push(curr.user);
      }
    } else {
      acc.push({
        date: curr.date,
        value: curr.value,
        users: [curr.user],
      });
    }
    return acc;
  }, [] as any[]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = aggregatedData.find(d => d.date === label);
      return (
        <div className="bg-background border p-3 rounded-md shadow-lg">
          <p className="font-semibold">{`${label}`}</p>
          <p className="text-primary">{`Value: ${payload[0].value} ${unit || ''}`}</p>
          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground">Contributors:</p>
            <div className="flex items-center -space-x-2 mt-1">
              {dataPoint.users.map((achiever: any) => (
                <Avatar key={achiever.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={achiever.avatar_url} alt={achiever.name} />
                  <AvatarFallback style={{ backgroundColor: generatePastelColor(achiever.id) }}>{achiever.initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={aggregatedData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" />
        <YAxis unit={unit} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" name="Logged Value" radius={[4, 4, 0, 0]}>
          {aggregatedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={generatePastelColor(entry.date)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default GoalValueTracker;