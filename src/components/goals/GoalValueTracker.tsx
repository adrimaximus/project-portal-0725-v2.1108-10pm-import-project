import { useState, useMemo } from 'react';
import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatValue, formatNumber } from '@/lib/formatting';
import GoalLogTable from './GoalLogTable';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from 'date-fns';

interface GoalValueTrackerProps {
  goal: Goal;
  onLogValue: (date: Date, value: number) => void;
}

const GoalValueTracker = ({ goal, onLogValue }: GoalValueTrackerProps) => {
  const [logValue, setLogValue] = useState<number | ''>('');

  const { currentPeriodTotal, periodProgress, periodName, logsInPeriod, daysRemaining, valueToGo } = useMemo(() => {
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

    const daysRemaining = differenceInDays(periodEnd, today);

    const logsInPeriod = goal.completions.filter(c => {
      const completionDate = parseISO(c.date);
      return isWithinInterval(completionDate, { start: periodStart, end: periodEnd });
    });

    const currentPeriodTotal = logsInPeriod.reduce((sum, c) => sum + c.value, 0);
    const periodProgress = goal.targetValue ? Math.round((currentPeriodTotal / goal.targetValue) * 100) : 0;
    const valueToGo = Math.max(0, (goal.targetValue || 0) - currentPeriodTotal);
    
    return { currentPeriodTotal, periodProgress, periodName, logsInPeriod, daysRemaining, valueToGo };
  }, [goal]);

  const handleLog = () => {
    const value = Number(logValue);
    if (value > 0) {
      onLogValue(new Date(), value);
      toast.success(`Logged ${formatValue(value, goal.unit)} for "${goal.title}"`);
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
        <div className="flex justify-between items-start">
          <CardTitle>Progress {periodName}</CardTitle>
          {daysRemaining >= 0 && (
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
            </span>
          )}
        </div>
        <CardDescription>
          You've logged {formatValue(currentPeriodTotal, goal.unit)} of {formatValue(goal.targetValue || 0, goal.unit)}.
          {valueToGo > 0 ? (
            <span className="font-medium"> {formatValue(valueToGo, goal.unit)} to go.</span>
          ) : (
            <span className="font-medium text-green-600"> Target met!</span>
          )}
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
            placeholder={`Log ${goal.unit || 'value'}...`}
            value={logValue !== '' ? formatNumber(logValue) : ''}
            onChange={handleNumericInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleLog()}
          />
          <Button onClick={handleLog}>Log</Button>
        </div>
        <GoalLogTable logs={logsInPeriod} unit={goal.unit} goalType={goal.type} />
      </CardContent>
    </Card>
  );
};

export default GoalValueTracker;