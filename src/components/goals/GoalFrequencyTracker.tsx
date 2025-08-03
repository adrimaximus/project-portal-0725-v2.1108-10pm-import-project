import { useMemo } from 'react';
import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import GoalLogTable from './GoalLogTable';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import { CheckCircle } from 'lucide-react';

interface GoalFrequencyTrackerProps {
  goal: Goal;
  onLogFrequency: (date: Date) => void;
}

const GoalFrequencyTracker = ({ goal, onLogFrequency }: GoalFrequencyTrackerProps) => {
  const { logsInPeriod, periodName, daysRemaining, completedCount } = useMemo(() => {
    const today = new Date();
    const periodStart = startOfWeek(today, { weekStartsOn: 1 });
    const periodEnd = endOfWeek(today, { weekStartsOn: 1 });
    const periodName = "this week";
    const daysRemaining = differenceInDays(periodEnd, today);

    const logsInPeriod = goal.completions.filter(c => {
      const completionDate = parseISO(c.date);
      return isWithinInterval(completionDate, { start: periodStart, end: periodEnd });
    });

    const completedCount = logsInPeriod.length;
    
    return { logsInPeriod, periodName, daysRemaining, completedCount };
  }, [goal]);

  const handleLog = () => {
    onLogFrequency(new Date());
    toast.success(`Logged workout for "${goal.title}"`);
  };

  const targetCount = goal.frequency || 0;
  const isTargetMet = completedCount >= targetCount;

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
          You've completed {completedCount} of {targetCount} sessions.
          {isTargetMet ? (
            <span className="font-medium text-green-600"> Target met!</span>
          ) : (
            <span className="font-medium"> {targetCount - completedCount} more to go.</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          {Array.from({ length: targetCount }).map((_, index) => (
            <CheckCircle
              key={index}
              className={`h-8 w-8 ${index < completedCount ? 'text-green-500' : 'text-muted-foreground/50'}`}
              fill="currentColor"
            />
          ))}
        </div>
        <Button onClick={handleLog} disabled={isTargetMet} className="w-full">
          Log Today's Session
        </Button>
        <GoalLogTable logs={logsInPeriod} unit={goal.unit} goalType={goal.type} />
      </CardContent>
    </Card>
  );
};

export default GoalFrequencyTracker;