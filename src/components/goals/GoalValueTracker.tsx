import { useState, useMemo } from 'react';
import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatValue, formatNumber } from '@/lib/formatting';
import GoalLogTable from './GoalLogTable';

interface GoalValueTrackerProps {
  goal: Goal;
  onLogValue: (date: Date, value: number) => void;
}

const GoalValueTracker = ({ goal, onLogValue }: GoalValueTrackerProps) => {
  const [logValue, setLogValue] = useState<number | ''>('');

  const { currentTotal, progress } = useMemo(() => {
    const currentTotal = goal.completions.reduce((sum, c) => sum + c.value, 0);
    const progress = goal.targetValue ? Math.min(Math.round((currentTotal / goal.targetValue) * 100), 100) : 0;
    return { currentTotal, progress };
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
        <CardTitle>Overall Progress</CardTitle>
        <CardDescription>
          You've logged {formatValue(currentTotal, goal.unit)} of your {formatValue(goal.targetValue || 0, goal.unit)} target.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Progress value={progress} style={{ '--primary-color': goal.color } as React.CSSProperties} className="h-3 [&>*]:bg-[var(--primary-color)]" />
          <span className="font-bold text-lg">{progress}%</span>
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
        <GoalLogTable logs={goal.completions} unit={goal.unit} goalType={goal.type} />
      </CardContent>
    </Card>
  );
};

export default GoalValueTracker;