import { Book, Dumbbell, Droplets } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface GoalCompletion {
  date: string; // ISO 8601 format: "YYYY-MM-DD"
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  frequency: string; // e.g., "daily", "specific_days"
  specificDays?: string[]; // e.g., ["Mo", "We", "Fr"]
  completions: GoalCompletion[];
}

export const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Read 10 pages',
    icon: Book,
    color: '#4A90E2',
    frequency: 'Every 1 day for 1 week',
    completions: [
      { date: '2024-07-20', completed: true },
      { date: '2024-07-21', completed: true },
    ],
  },
  {
    id: '2',
    title: 'Workout for 30 mins',
    icon: Dumbbell,
    color: '#D0021B',
    frequency: 'On 3 specific day(s) for 1 week',
    specificDays: ['Mo', 'We', 'Fr'],
    completions: [
      { date: '2024-07-22', completed: true },
    ],
  },
  {
    id: '3',
    title: 'Drink 8 glasses of water',
    icon: Droplets,
    color: '#50E3C2',
    frequency: 'Every 1 day for 1 week',
    completions: [
      { date: '2024-07-20', completed: true },
      { date: '2024-07-21', completed: false },
      { date: '2024-07-22', completed: true },
    ],
  },
];