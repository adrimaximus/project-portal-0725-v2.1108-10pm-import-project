import { Goal } from '@/types';
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, isWithinInterval, parseISO } from 'date-fns';

export const calculateProgress = (goal: Goal) => {
  if (!goal.completions || goal.completions.length === 0) {
    return { total: 0, percentage: 0, target: 0 };
  }

  const today = new Date();
  let periodStart, periodEnd;

  switch (goal.target_period) {
    case 'week':
      periodStart = startOfWeek(today, { weekStartsOn: 1 });
      periodEnd = endOfWeek(today, { weekStartsOn: 1 });
      break;
    case 'month':
      periodStart = startOfMonth(today);
      periodEnd = endOfMonth(today);
      break;
    case 'year':
      periodStart = startOfYear(today);
      periodEnd = endOfYear(today);
      break;
    default: // day or other
      periodStart = today;
      periodEnd = today;
  }

  const relevantCompletions = goal.completions.filter(c => 
    isWithinInterval(parseISO(c.date), { start: periodStart, end: periodEnd })
  );

  const total = relevantCompletions.reduce((sum, item) => sum + item.value, 0);
  const target = goal.target_quantity ?? goal.target_value ?? 0;
  const percentage = target > 0 ? Math.min(Math.round((total / target) * 100), 100) : 0;

  return { total, percentage, target };
};