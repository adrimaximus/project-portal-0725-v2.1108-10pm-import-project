import { subDays, subMonths, subWeeks } from 'date-fns';

export type GoalType = 'quantity' | 'value' | 'frequency';
export type GoalPeriod = 'Daily' | 'Weekly' | 'Monthly';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Completion {
  date: string; // ISO 8601 format
  value: number;
  achiever: string; // Name of the person who completed it
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: GoalType;
  targetPeriod: GoalPeriod | null;
  targetQuantity: number | null;
  targetValue: number | null;
  unit: string | null;
  frequency: number | null; // e.g., 3 for "3 times a week"
  specificDays: DayOfWeek[] | null;
  color: string;
  tags: string[];
  collaborators: string[];
  completions: Completion[];
}

const today = new Date();

export const sampleGoals: Goal[] = [
  {
    id: '1',
    title: 'Read 20 Pages a Day',
    description: 'Cultivate a daily reading habit to expand knowledge.',
    icon: 'book-open',
    type: 'quantity',
    targetPeriod: 'Daily',
    targetQuantity: 20,
    targetValue: null,
    unit: 'pages',
    frequency: null,
    specificDays: null,
    color: '#3b82f6', // blue-500
    tags: ['education', 'habit'],
    collaborators: ['You'],
    completions: [
      { date: subDays(today, 1).toISOString(), value: 25, achiever: 'You' },
      { date: subDays(today, 2).toISOString(), value: 18, achiever: 'You' },
      { date: subDays(today, 3).toISOString(), value: 22, achiever: 'You' },
      { date: subMonths(today, 1).toISOString(), value: 30, achiever: 'You' },
    ],
  },
  {
    id: '2',
    title: 'Save IDR 5,000,000 per Week',
    description: 'Weekly savings goal for future investments.',
    icon: 'piggy-bank',
    type: 'value',
    targetPeriod: 'Weekly',
    targetQuantity: null,
    targetValue: 5000000,
    unit: 'IDR',
    frequency: null,
    specificDays: null,
    color: '#22c55e', // green-500
    tags: ['finance', 'savings'],
    collaborators: ['You', 'Alex', 'Sarah'],
    completions: [
      { date: subDays(today, 2).toISOString(), value: 2500000, achiever: 'You' },
      { date: subDays(today, 4).toISOString(), value: 1500000, achiever: 'Alex' },
      { date: subWeeks(today, 1).toISOString(), value: 5500000, achiever: 'You' },
      { date: subWeeks(today, 2).toISOString(), value: 4800000, achiever: 'Sarah' },
      { date: subWeeks(today, 3).toISOString(), value: 6000000, achiever: 'You' },
      { date: subMonths(today, 1).toISOString(), value: 4000000, achiever: 'Alex' },
      { date: subMonths(today, 1).toISOString(), value: 1000000, achiever: 'You' },
      { date: subMonths(today, 2).toISOString(), value: 5200000, achiever: 'Sarah' },
      { date: subMonths(today, 3).toISOString(), value: 4900000, achiever: 'You' },
    ],
  },
  {
    id: '3',
    title: 'Workout 3 Times a Week',
    description: 'Stay active and healthy with regular exercise.',
    icon: 'dumbbell',
    type: 'frequency',
    targetPeriod: 'Weekly',
    targetQuantity: null,
    targetValue: null,
    unit: null,
    frequency: 3,
    specificDays: ['Mon', 'Wed', 'Fri'],
    color: '#ef4444', // red-500
    tags: ['health', 'fitness'],
    collaborators: ['You'],
    completions: [
      { date: subDays(today, 1).toISOString(), value: 1, achiever: 'You' },
      { date: subDays(today, 3).toISOString(), value: 1, achiever: 'You' },
      { date: subWeeks(today, 1).toISOString(), value: 1, achiever: 'You' },
      { date: subWeeks(today, 1).toISOString(), value: 1, achiever: 'You' },
      { date: subWeeks(today, 1).toISOString(), value: 1, achiever: 'You' },
    ],
  },
];