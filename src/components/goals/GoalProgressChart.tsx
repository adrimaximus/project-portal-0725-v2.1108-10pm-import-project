import { Goal } from '@/data/goals';
import { format, getMonth, getYear, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber, formatValue } from '@/lib/formatting';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AiCoachInsight from './AiCoachInsight';
import { useMemo } from 'react';

interface GoalProgressChartProps {
  goal: Goal;
}

const GoalProgressChart = ({ goal }: GoalProgressChartProps) => {
  if (goal.type === 'frequency') {
    return null; // This chart is for quantity and value goals
  }

  const currentYear = getYear(new Date());

  const { monthlyContributions, totalProgress, allAchievers, colorMap } = useMemo(() => {
    // Initialize an array of 12 empty objects, one for each month
    const monthlyContributions: { [achiever: string]: number }[] = Array.from({ length: 12 }, () => ({}));
    let totalProgress = 0;
    const achieverSet = new Set<string>();

    goal.completions.forEach(completion => {
      achieverSet.add(completion.achiever);
      const completionDate = parseISO(completion.date);
      if (getYear(completionDate) === currentYear) {
        const monthIndex = getMonth(completionDate);
        // Add completion value to the specific achiever's total for that month
        monthlyContributions[monthIndex][completion.achiever] = (monthlyContributions[monthIndex][completion.achiever] || 0) + completion.value;
        totalProgress += completion.value;
      }
    });

    const allAchievers = Array.from(achieverSet);
    const colors = ['#3b82f6', '#16a34a', '#ef4444', '#eab308', '#8b5cf6', '#db2777'];
    const colorMap = allAchievers.reduce((acc, achiever, i) => {
      acc[achiever] = colors[i % colors.length];
      return acc;
    }, {} as { [key: string]: string });

    return { monthlyContributions, totalProgress, allAchievers, colorMap };
  }, [goal, currentYear]);

  const monthlyTotals = monthlyContributions.map(month => Object.values(month).reduce((sum, val) => sum + val, 0));

  const getMonthlyTarget = () => {
    const target = goal.type === 'quantity' ? goal.targetQuantity : goal.targetValue;
    if (!target || !goal.targetPeriod) return null;

    switch (goal.targetPeriod) {
      case 'Weekly': return target * 4; // Simplified to 4 weeks per month for clarity
      case 'Monthly': return target;
      default: return null;
    }
  };

  const monthlyTarget = getMonthlyTarget();
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
          {monthlyContributions.map((contributions, index) => {
            const monthName = format(new Date(currentYear, index, 1), 'MMM');
            const totalMonthValue = monthlyTotals[index];
            const targetHeightPercentage = monthlyTarget ? (monthlyTarget / chartMax) * 100 : 0;
            let accumulatedHeight = 0;

            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative h-full flex-1 cursor-pointer">
                      {Object.entries(contributions)
                        .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistent stack order
                        .map(([achiever, value]) => {
                          const heightPercentage = (value / chartMax) * 100;
                          const bottomPosition = accumulatedHeight;
                          accumulatedHeight += heightPercentage;
                          return (
                            <div
                              key={achiever}
                              className="absolute w-full transition-all duration-300 hover:opacity-80"
                              style={{
                                height: `${heightPercentage}%`,
                                bottom: `${bottomPosition}%`,
                                backgroundColor: colorMap[achiever] || '#9ca3af', // gray-400
                              }}
                              aria-label={`Progress by ${achiever}: ${formatProgress(value)}`}
                            />
                          );
                      })}
                      {monthlyTarget && targetHeightPercentage > 0 && (
                         <div
                          className="absolute left-0 w-full border-t-2 border-dashed border-foreground/50"
                          style={{ bottom: `${targetHeightPercentage}%` }}
                          aria-label={`Monthly Target: ${formatProgress(monthlyTarget)}`}
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-bold">{monthName} - {formatProgress(totalMonthValue)}</p>
                    {Object.entries(contributions).map(([achiever, value]) => (
                      <div key={achiever} className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorMap[achiever] }} />
                        <span>{achiever}: {formatProgress(value)}</span>
                      </div>
                    ))}
                    {monthlyTarget && <p className="mt-2 pt-2 border-t">Target: {formatProgress(monthlyTarget)}</p>}
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
        {allAchievers.length > 1 && (
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            {allAchievers.map(achiever => (
              <div key={achiever} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colorMap[achiever] }} />
                <span>{achiever}</span>
              </div>
            ))}
          </div>
        )}
        <AiCoachInsight goal={goal} progress={overallPercentage !== null ? { percentage: overallPercentage } : null} />
      </CardContent>
    </Card>
  );
};

export default GoalProgressChart;