import { Goal } from '@/types';

export const getProgress = (goal: Goal) => {
  const current = goal.completions.reduce((sum, c) => sum + c.value, 0);
  
  const target = goal.type === 'quantity' 
    ? goal.target_quantity 
    : goal.target_value || 0;

  const percentage = target > 0 ? (current / target) * 100 : 0;

  return {
    percentage: Math.min(100, percentage),
    current: current,
    target: target,
  };
};