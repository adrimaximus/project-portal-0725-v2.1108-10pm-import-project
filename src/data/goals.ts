import { BookOpen, Dumbbell, TrendingUp, Heart, LucideIcon } from 'lucide-react';

export interface Goal {
  id: string;
  title: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  specificDays?: number[];
  color: string;
  icon: LucideIcon;
  completions: { date: string; completed: boolean }[];
  assignedTo?: string;
}

export const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Read 10 pages of a book',
    frequency: 'Daily',
    color: '#4A90E2',
    icon: BookOpen,
    assignedTo: 'user-1',
    completions: [
      { date: '2024-07-20T00:00:00.000Z', completed: true },
      { date: '2024-07-21T00:00:00.000Z', completed: false },
      { date: '2024-07-22T00:00:00.000Z', completed: true },
    ],
  },
  {
    id: '2',
    title: 'Go to the gym',
    frequency: 'Weekly',
    specificDays: [1, 3, 5],
    color: '#D0021B',
    icon: Dumbbell,
    assignedTo: 'user-2',
    completions: [
       { date: '2024-07-22T00:00:00.000Z', completed: true },
    ],
  },
  {
    id: '3',
    title: 'Track monthly expenses',
    frequency: 'Monthly',
    color: '#F5A623',
    icon: TrendingUp,
    completions: [
       { date: '2024-07-15T00:00:00.000Z', completed: true },
    ],
  },
  {
    id: '4',
    title: 'Meditate for 5 minutes',
    frequency: 'Daily',
    color: '#50E3C2',
    icon: Heart,
    completions: [],
  },
];