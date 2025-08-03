import { Goal } from '@/data/goals';
import { format, getMonth, getYear, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber, formatValue } from '@/lib/formatting';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AiCoachInsight from './AiCoachInsight';

interface GoalProgressChartProps {
  goal: Goal;
}

const GoalProgressChart = ({ goal }: GoalProgressChartProps) => {
  if (goal.type === 'frequency') {
    return null; // This chart is for quantity and value goals
  }

  const currentYear = getYear(new Date());
  const monthlyTotals = Array(12).fill(0);
  let totalProgress = 0;

  goal.completions.forEach(completion => {
    const completionDate = parseISO(completion.date);
    if (getYear(completionDate) === currentYear) {
      const monthIndex = getMonth(completionDate);
      monthlyTotals[monthIndex] += completion.value;
      totalProgress += completion.value;
    }
  });

  const getMonthlyTarget = () => {
    const target = goal.type === 'quantity' ? goal.targetQuantity : goal.targetValue;
    if (!target || !goal.targetPeriod) return null;

    switch (goal.targetPeriod) {
      case 'Weekly': return target * (52 / 12); // Average weeks in a month
      case 'Monthly': return target;
      default: return null;
    }
  };

  const monthlyTarget = getMonthlyTarget();
  // The chart's vertical scale should be based on the monthly target,
  // but if any month's progress exceeds the target, the scale should adjust to the highest value.
  // We also ensure it's at least 1 to avoid division by zero.
  const chartMax = Math.max(monthlyTarget || 0, ...monthlyTotals, 1);

  const unit = goal.type === 'value' ? goal.unit : '';

  const formatProgress = (value: number) => {
    return goal.type === 'quantity' ? formatNumber(value) : formatValue(value, unit);
  };

  const getYearlyTarget = () => {
    if (goal.type === 'quantity' && goal.targetQuantity && goal.targetPeriod) {
      switch (goal.targetPeriod) {
        case 'Weekly': return goal.targetQuantity * 52;
        case 'Monthly': return goal.targetQuantity * 12;
        default: return null;
      }
    }
    if (goal.type === 'value' && goal.targetValue && goal.targetPeriod) {
      switch (goal.targetPeriod) {
        case 'Weekly': return goal.targetValue * 52;
        case 'Monthly': return goal.targetValue * 12;
        default: return null;
      }
    }
    return null;
  };

  const yearlyTarget = getYearlyTarget();
  const overallPercentage = yearlyTarget ? Math.round((totalProgress / yearlyTarget) * 100) : null;

  const getTargetText = () => {
    if (goal.type === 'quantity' && goal.targetQuantity && goal.targetPeriod) {
      return `Target: ${formatProgress(goal.targetQuantity)} / ${goal.targetPeriod.replace('ly', '')}`;
    }
    if (goal.type === 'value' && goal.targetValue && goal.targetPeriod) {
      return `Target: ${formatProgress(goal.targetValue)} / ${goal.targetPeriod.replace('ly', '')}`;
    }
    return 'No target set';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Overview - {currentYear}</CardTitle>
        <CardDescription>
          Total progress this year: <strong>{formatProgress(totalProgress)}</strong>. {getTargetText()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 w-full items-end gap-2 rounded-md bg-muted/50 p-4" aria-label="Monthly progress chart">
          {monthlyTotals.map((value, index) => {
            const monthName = format(new Date(currentYear, index, 1), 'MMM');
            const heightPercentage = (value / chartMax) * 100;
            const targetHeightPercentage = monthlyTarget ? (monthlyTarget / chartMax) * 100 : 0;

            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative h-full flex-1">
                      <div
                        className="absolute bottom-0 w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${heightPercentage}%`,
                          backgroundColor: goal.color,
                        }}
                        aria-label={`Progress for ${monthName}: ${formatProgress(value)}`}
                      />
                      {monthlyTarget && targetHeightPercentage > 0 && (
                         <div
                          className="absolute left-0 w-full border-t-2 border-dashed border-foreground/50"
                          style={{
                            bottom: `${targetHeightPercentage}%`,
                          }}
                          aria-label={`Monthly Target: ${formatProgress(monthlyTarget)}`}
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-bold">{monthName}</p>
                    <p>Progress: {formatProgress(value)}</p>
                    {monthlyTarget && <p>Target: {formatProgress(monthlyTarget)}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <div className="mt-2 flex w-full gap-2" aria-hidden="true">
          {monthlyTotals.map((_, index) => (
            <div key={index} className="flex-1 text-center text-xs text-muted-foreground">
              {format(new Date(currentYear, index, 1), 'MMM')}
            </div>
          ))}
        </div>
        <AiCoachInsight goal={goal} progress={overallPercentage !== null ? { percentage: overallPercentage } : null} />
      </CardContent>
    </Card>
  );
};

export default GoalProgressChart;