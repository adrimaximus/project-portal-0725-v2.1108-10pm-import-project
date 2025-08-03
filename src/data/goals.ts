import { User } from './users';

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
  icon: string; // Icon name from lucide-react, or a placeholder if iconUrl is used
  iconUrl?: string; // URL for AI-generated icon
  color: string;
  type: 'quantity' | 'value' | 'frequency';
  targetQuantity?: number;
  targetValue?: number;
  frequency?: number;
  targetPeriod?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  unit?: string; // e.g., '$', '€', 'Tasks', 'Miles'
  collaborators: string[]; // Array of user IDs
  completions: GoalCompletion[];
}

export const initialGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Launch New Feature',
    description: 'Successfully launch the new "Teams" feature by the end of Q3.',
    icon: 'Rocket',
    color: '#6D28D9',
    type: 'quantity',
    targetQuantity: 1,
    targetPeriod: 'Yearly',
    collaborators: ['user-1', 'user-2', 'user-3'],
    completions: [
      { id: 'comp-1', date: '2024-08-15T00:00:00.000Z', value: 1, userId: 'user-1' },
    ],
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
    collaborators: ['user-1', 'user-4'],
    completions: [
      { id: 'comp-2', date: '2024-01-20T00:00:00.000Z', value: 8000, userId: 'user-1' },
      { id: 'comp-3', date: '2024-02-18T00:00:00.000Z', value: 9500, userId: 'user-1' },
      { id: 'comp-4', date: '2024-03-22T00:00:00.000Z', value: 11000, userId: 'user-2' },
      { id: 'comp-5', date: '2024-04-19T00:00:00.000Z', value: 10500, userId: 'user-2' },
      { id: 'comp-6', date: '2024-05-21T00:00:00.000Z', value: 13000, userId: 'user-1' },
    ],
  },
  {
    id: 'goal-3',
    title: 'Publish Blog Posts',
    description: 'Publish insightful content to drive organic traffic.',
    icon: 'FileText',
    color: '#EA580C',
    type: 'frequency',
    frequency: 2,
    targetPeriod: 'Weekly',
    collaborators: ['user-3', 'user-5'],
    completions: [
      { id: 'comp-7', date: '2024-05-02T00:00:00.000Z', value: 1, userId: 'user-3' },
      { id: 'comp-8', date: '2024-05-06T00:00:00.000Z', value: 1, userId: 'user-3' },
      { id: 'comp-9', date: '2024-05-09T00:00:00.000Z', value: 1, userId: 'user-5' },
      { id: 'comp-10', date: '2024-05-15T00:00:00.000Z', value: 1, userId: 'user-3' },
    ],
  },
];