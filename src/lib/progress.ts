import { Goal } from '@/types';
import { isToday, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';

export const calculateProgress = (goal: Goal) => {
  if (!goal.completions || goal.completions.length === 0) {
    return { percentage: 0, currentValue: 0 };
  }

  if (goal.type === 'value') {
    const currentValue = goal.completions.reduce((sum, c) => sum + c.value, 0);
    const percentage = goal.target_value ? (currentValue / goal.target_value) * 100 : 0;
    return { percentage, currentValue };
  }

  // Type is 'quantity'
  const target = goal.target_quantity || 1;
  const currentValue = goal.completions.length;
  const percentage = (currentValue / target) * 100;
  return { percentage, currentValue };
};

export const getCompletionsForPeriod = (goal: Goal, period: 'today' | 'week' | 'month' | 'year') => {
  const now = new Date();
  let interval: Interval;

  switch (period) {
    case 'today':
      return goal.completions.filter(c => isToday(parseISO(c.date)));
    case 'week':
      interval = { start: startOfWeek(now), end: endOfWeek(now) };
      break;
    case 'month':
      interval = { start: startOfMonth(now), end: endOfMonth(now) };
      break;
    case 'year':
      interval = { start: startOfYear(now), end: endOfYear(now) };
      break;
  }

  return goal.completions.filter(c => isWithinInterval(parseISO(c.date), interval));
};