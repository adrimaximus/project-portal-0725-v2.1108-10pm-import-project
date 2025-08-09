import { User } from '@/types';
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

export const dummyUsers: User[] = [
    { id: 'user-0', name: 'Adri Maximus', email: 'adri@example.com', avatar: 'https://i.pravatar.cc/150?u=adri', initials: 'AM', first_name: 'Adri', last_name: 'Maximus' },
    { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'AJ', first_name: 'Alice', last_name: 'Johnson' },
    { id: 'user-2', name: 'Michael Chen', email: 'michael@example.com', avatar: 'https://i.pravatar.cc/150?u=michael', initials: 'MC', first_name: 'Michael', last_name: 'Chen' },
    { id: 'user-3', name: 'Samantha Bee', email: 'samantha@example.com', avatar: 'https://i.pravatar.cc/150?u=samantha', initials: 'SB', first_name: 'Samantha', last_name: 'Bee' },
    { id: 'user-4', name: 'David Kim', email: 'david@example.com', avatar: 'https://i.pravatar.cc/150?u=david', initials: 'DK', first_name: 'David', last_name: 'Kim' },
];

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