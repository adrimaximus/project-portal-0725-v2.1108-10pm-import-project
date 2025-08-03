import { User, dummyUsers } from './users';
import { Tag } from './tags';

export type GoalType = 'quantity' | 'value' | 'frequency';
export type GoalPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface GoalCompletion {
  id: string;
  date: string; // ISO 8601 date string
  value: number;
  notes?: string;
  userId: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconUrl?: string;
  color: string;
  type: GoalType;
  targetQuantity?: number;
  targetValue?: number;
  frequency: 'Daily' | 'Weekly';
  targetPeriod?: GoalPeriod;
  unit?: string;
  collaborators: User[];
  completions: GoalCompletion[];
  tags: Tag[];
  specificDays: string[];
}

export const dummyGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Launch New Feature',
    description: 'Successfully launch the new "Teams" feature by the end of Q3.',
    icon: 'Rocket',
    color: '#6D28D9',
    type: 'quantity',
    targetQuantity: 1,
    targetPeriod: 'Yearly',
    collaborators: [dummyUsers[0], dummyUsers[1], dummyUsers[2]],
    completions: [
      { id: 'comp-1', date: '2024-08-15T00:00:00.000Z', value: 1, userId: 'user-1' },
    ],
    tags: [],
    specificDays: [],
    frequency: 'Daily',
  },
  {
    id: 'goal-2',
    title: 'Increase MRR',
    description: 'Grow Monthly Recurring Revenue by 20% in the second half of the year.',
    icon: 'DollarSign',
    color: '#16A34A',
    type: 'value',
    targetValue: 120000,
    targetPeriod: 'Yearly',
    unit: '$',
    collaborators: [dummyUsers[0], dummyUsers[3]],
    completions: [
      { id: 'comp-2', date: '2024-01-20T00:00:00.000Z', value: 8000, userId: 'user-1' },
      { id: 'comp-3', date: '2024-02-18T00:00:00.000Z', value: 9500, userId: 'user-1' },
    ],
    tags: [],
    specificDays: [],
    frequency: 'Daily',
  },
  {
    id: 'goal-3',
    title: 'Publish Blog Posts',
    description: 'Publish insightful content to drive organic traffic.',
    icon: 'FileText',
    color: '#EA580C',
    type: 'frequency',
    frequency: 'Weekly',
    targetPeriod: 'Weekly',
    collaborators: [dummyUsers[2], dummyUsers[4]],
    completions: [
      { id: 'comp-7', date: '2024-05-02T00:00:00.000Z', value: 1, userId: 'user-3' },
      { id: 'comp-8', date: '2024-05-06T00:00:00.000Z', value: 1, userId: 'user-3' },
    ],
    tags: [],
    specificDays: [],
  },
];