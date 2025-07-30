import { Book, Dumbbell, Target, Coffee, Code } from 'lucide-react';
import { format } from 'date-fns';

export interface Goal {
  id: string;
  title: string;
  icon: React.ElementType;
  frequency: string; // e.g., "Every 1 day(s) for 1 week"
  color: string;
  completions: { date: string }[]; // ISO date strings: "YYYY-MM-DD"
}

export const initialGoals: Goal[] = [
  {
    id: 'goal_1',
    title: 'Read 10 pages',
    icon: Book,
    frequency: 'Every 1 day for 1 week',
    color: '#8B5CF6',
    completions: [
      { date: format(new Date(), 'yyyy-MM-dd') },
      { date: '2024-07-21' },
    ],
  },
  {
    id: 'goal_2',
    title: '30-min workout',
    icon: Dumbbell,
    frequency: 'Every 2 days for 1 week',
    color: '#EC4899',
    completions: [],
  },
  {
    id: 'goal_3',
    title: 'Review daily tasks',
    icon: Target,
    frequency: 'Every 1 day for 1 week',
    color: '#10B981',
    completions: [],
  },
];

export const createNewGoal = (): Goal => {
  return {
    id: `new_${Date.now()}`,
    title: '',
    icon: Coffee,
    frequency: 'Every 1 day for 1 week',
    color: '#3B82F6',
    completions: [],
  };
};