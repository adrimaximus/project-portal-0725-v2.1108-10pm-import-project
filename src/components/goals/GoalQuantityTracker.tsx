import { useState, useMemo, useRef } from 'react';
import { Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/formatting';
import GoalLogTable from './GoalLogTable';
import { Paperclip, X } from 'lucide-react';

interface GoalQuantityTrackerProps {
  goal: Goal;
  onLogProgress: (date: Date, value: number, file?: File | null) => void;
}

const GoalQuantityTracker = ({ goal, onLogProgress }: GoalQuantityTrackerProps) => {
  const [logValue, setLogValue] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentPeriodTotal, periodProgress, periodName, logsInPeriod, daysRemaining, quantityToGo } = useMemo(() => {
    const today = new Date();
    let periodStart, periodEnd, periodName;

    if (goal.target_period === 'Weekly') {
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
    const periodProgress = goal.target_quantity ? Math.round((currentPeriodTotal / goal.target_quantity) * 100) : 0;
    const quantityToGo = Math.max(0, (goal.target_quantity || 0) - currentPeriodTotal);
    
    return { currentPeriodTotal, periodProgress, periodName, logsInPeriod, daysRemaining, quantityToGo };
  }, [goal]);

  const handleLog = () => {
    const value = Number(logValue);
    if (value > 0) {
      onLogProgress(new Date(), value, file);
      toast.success(`Logged ${formatNumber(value)} for "${goal.title}"`);
      setLogValue('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
          You've completed {formatNumber(currentPeriodTotal)} of {formatNumber(goal.target_quantity || 0)}.
          {quantityToGo > 0 ? (
            <span className="font-medium"> {formatNumber(quantityToGo)} to go.</span>
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
        <div className="flex flex-col gap-2 mt-4">
            <div className="flex gap-2">
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Log progress..."
                    value={logValue !== '' ? formatNumber(logValue) : ''}
                    onChange={handleNumericInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleLog()}
                    className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                </Button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                />
                <Button onClick={handleLog}>Log</Button>
            </div>
            {file && (
                <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded-md">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate flex-1">{file.name}</span>
                    <button onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
        <GoalLogTable logs={logsInPeriod} goalType={goal.type} />
      </CardContent>
    </Card>
  );
};

export default GoalQuantityTracker;