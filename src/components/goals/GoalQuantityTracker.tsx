import { useState, useMemo } from 'react';
import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/formatting';
import GoalLogTable from './GoalLogTable';

interface GoalQuantityTrackerProps {
  goal: Goal;
  onLogProgress: (date: Date, value: number) => void;
}

const GoalQuantityTracker = ({ goal, onLogProgress }: GoalQuantityTrackerProps) => {
  const [logValue, setLogValue] = useState<number | ''>('');

  const { currentPeriodTotal, periodProgress, periodName, logsInPeriod } = useMemo(() => {
    const today = new Date();
    let periodStart, periodEnd, periodName;

    if (goal.targetPeriod === 'Weekly') {
      periodStart = startOfWeek(today, { weekStartsOn: 1 });
      periodEnd = endOfWeek(today, { weekStartsOn: 1 });
      periodName = "this week";
    } else { // Monthly
      periodStart = startOfMonth(today);
      periodEnd = endOfMonth(today);
      periodName = "this month";
    }

    const logsInPeriod = goal.completions.filter(c => {
      const completionDate = parseISO(c.date);
      return isWithinInterval(completionDate, { start: periodStart, end: periodEnd });
    });

    const currentPeriodTotal = logsInPeriod.reduce((sum, c) => sum + c.value, 0);
    const periodProgress = goal.targetQuantity ? Math.round((currentPeriodTotal / goal.targetQuantity) * 100) : 0;
    
    return { currentPeriodTotal, periodProgress, periodName, logsInPeriod };
  }, [goal]);

  const handleLog = () => {
    const value = Number(logValue);
    if (value > 0) {
      onLogProgress(new Date(), value);
      toast.success(`Logged ${formatNumber(value)} for "${goal.title}"`);
      setLogValue('');
    } else {
      toast.error("Please enter a valid number.");
    }
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = rawValue.replace(/,/g, '');

    if (sanitizedValue === '') {
      setLogValue('');
      return;
    }

    const numValue = parseInt(sanitizedValue, 10);
    if (!isNaN(numValue)) {
      setLogValue(numValue);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress {periodName}</CardTitle>
        <CardDescription>
          You've completed {formatNumber(currentPeriodTotal)} of your {formatNumber(goal.targetQuantity || 0)} target.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Progress value={periodProgress} style={{ '--primary-color': goal.color } as React.CSSProperties} className="h-3 [&>*]:bg-[var(--primary-color)]" />
          <span className="font-bold text-lg">{periodProgress}%</span>
        </div>
        <div className="flex gap-2 mt-4">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Log progress..."
            value={logValue !== '' ? formatNumber(logValue) : ''}
            onChange={handleNumericInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleLog()}
          />
          <Button onClick={handleLog}>Log</Button>
        </div>
        <GoalLogTable logs={logsInPeriod} goalType={goal.type} />
      </CardContent>
    </Card>
  );
};

export default GoalQuantityTracker;