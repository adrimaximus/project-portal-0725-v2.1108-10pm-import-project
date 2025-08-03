import { useState, useMemo } from 'react';
import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface GoalQuantityTrackerProps {
  goal: Goal;
  onLogProgress: (date: Date, value: number) => void;
}

const GoalQuantityTracker = ({ goal, onLogProgress }: GoalQuantityTrackerProps) => {
  const [logValue, setLogValue] = useState<number | ''>('');

  const { currentPeriodTotal, periodProgress, periodName, recentLogs } = useMemo(() => {
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

    const completionsInPeriod = goal.completions.filter(c => {
      const completionDate = parseISO(c.date);
      return isWithinInterval(completionDate, { start: periodStart, end: periodEnd });
    });

    const currentPeriodTotal = completionsInPeriod.reduce((sum, c) => sum + c.value, 0);
    const periodProgress = goal.targetQuantity ? Math.min(Math.round((currentPeriodTotal / goal.targetQuantity) * 100), 100) : 0;
    
    const recentLogs = completionsInPeriod.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    return { currentPeriodTotal, periodProgress, periodName, recentLogs };
  }, [goal]);

  const handleLog = () => {
    const value = Number(logValue);
    if (value > 0) {
      onLogProgress(new Date(), value);
      toast.success(`Logged ${value} for "${goal.title}"`);
      setLogValue('');
    } else {
      toast.error("Please enter a valid number.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress {periodName}</CardTitle>
        <CardDescription>
          You've completed {currentPeriodTotal} of your {goal.targetQuantity} target.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Progress value={periodProgress} style={{ '--primary-color': goal.color } as React.CSSProperties} className="h-3 [&>*]:bg-[var(--primary-color)]" />
          <span className="font-bold text-lg">{periodProgress}%</span>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Log progress..."
            value={logValue}
            onChange={(e) => setLogValue(e.target.value === '' ? '' : Number(e.target.value))}
            onKeyPress={(e) => e.key === 'Enter' && handleLog()}
          />
          <Button onClick={handleLog}>Log</Button>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Logs</h4>
          {recentLogs.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {recentLogs.map(log => (
                <li key={log.date} className="flex justify-between">
                  <span>{format(parseISO(log.date), 'MMM dd, yyyy')}</span>
                  <span className="font-medium">{log.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No logs for this period yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalQuantityTracker;