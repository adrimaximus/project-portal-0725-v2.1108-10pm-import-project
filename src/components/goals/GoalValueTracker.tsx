import { useState, useMemo } from 'react';
import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface GoalValueTrackerProps {
  goal: Goal;
  onLogValue: (date: Date, value: number) => void;
}

const GoalValueTracker = ({ goal, onLogValue }: GoalValueTrackerProps) => {
  const [logValue, setLogValue] = useState<number | ''>('');

  const { currentTotal, progress, recentLogs } = useMemo(() => {
    const currentTotal = goal.completions.reduce((sum, c) => sum + c.value, 0);
    const progress = goal.targetValue ? Math.min(Math.round((currentTotal / goal.targetValue) * 100), 100) : 0;
    const recentLogs = [...goal.completions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    return { currentTotal, progress, recentLogs };
  }, [goal]);

  const handleLog = () => {
    const value = Number(logValue);
    if (value > 0) {
      onLogValue(new Date(), value);
      toast.success(`Logged ${value} ${goal.unit || ''} for "${goal.title}"`);
      setLogValue('');
    } else {
      toast.error("Please enter a valid number.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Progress</CardTitle>
        <CardDescription>
          You've logged {currentTotal} {goal.unit || ''} of your {goal.targetValue} {goal.unit || ''} target.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Progress value={progress} style={{ '--primary-color': goal.color } as React.CSSProperties} className="h-3 [&>*]:bg-[var(--primary-color)]" />
          <span className="font-bold text-lg">{progress}%</span>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`Log ${goal.unit || 'value'}...`}
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
              {recentLogs.map((log, index) => (
                <li key={index} className="flex justify-between">
                  <span>{format(parseISO(log.date), 'MMM dd, yyyy')}</span>
                  <span className="font-medium">{log.value} {goal.unit || ''}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No logs yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalValueTracker;