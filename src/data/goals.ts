import { Book, Dumbbell, Target, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import { allUsers, type User } from './users';
export type { User } from './users';

export interface GoalCompletion {
  date: string; // ISO string
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  specificDays?: number[]; // 0 for Sunday, 6 for Saturday
  icon: LucideIcon;
  color: string;
  completions: GoalCompletion[];
  collaborators?: User[];
}

const generateCompletions = (startDate: string, days: number, frequency: 'Daily' | 'Weekly' | 'Monthly'): GoalCompletion[] => {
  const completions: GoalCompletion[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    if (frequency === 'Daily') {
      date.setDate(start.getDate() - i);
    } else if (frequency === 'Weekly') {
      date.setDate(start.getDate() - i * 7);
    } else { // Monthly
      date.setMonth(start.getMonth() - i);
    }
    
    if (Math.random() > 0.3) { // 70% chance of being completed
      completions.push({
        date: date.toISOString(),
        completed: true,
      });
    }
  }
  return completions;
};

export const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Read 10 pages every day',
    frequency: 'Daily',
    icon: Book,
    color: '#3b82f6',
    completions: generateCompletions('2024-07-28', 90, 'Daily'),
    collaborators: [allUsers[0], allUsers[2]],
  },
  {
    id: '2',
    title: 'Workout 3 times a week',
    frequency: 'Weekly',
    specificDays: [1, 3, 5],
    icon: Dumbbell,
    color: '#ef4444',
    completions: generateCompletions('2024-07-28', 12, 'Weekly'),
    collaborators: [allUsers[1]],
  },
  {
    id: '3',
    title: 'Achieve monthly sales target',
    frequency: 'Monthly',
    icon: Target,
    color: '#10b981',
    completions: generateCompletions('2024-07-28', 6, 'Monthly'),
  },
  {
    id: '4',
    title: 'Learn a new skill',
    frequency: 'Weekly',
    specificDays: [0, 6],
    icon: Zap,
    color: '#f97316',
    completions: generateCompletions('2024-07-28', 10, 'Weekly'),
  },
  {
    id: '5',
    title: 'Track daily expenses',
    frequency: 'Daily',
    icon: TrendingUp,
    color: '#8b5cf6',
    completions: generateCompletions('2024-07-28', 120, 'Daily'),
    collaborators: [allUsers[0], allUsers[3], allUsers[4]],
  },
];