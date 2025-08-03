import { User } from './projects';

export type GoalType = 'value' | 'quantity' | 'frequency';
export type GoalPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
export type GoalFrequency = 'Daily' | 'Weekly';

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string;
  collaboratorId?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: GoalType;
  targetPeriod: GoalPeriod;
  targetQuantity?: number;
  targetValue?: number;
  unit?: string;
  frequency?: GoalFrequency;
  specificDays?: string[];
  color: string;
  icon: string;
  iconUrl?: string;
  completions: GoalCompletion[];
  collaborators: User[];
  tags: string[];
  targetDate: string;
  status: 'On Track' | 'At Risk' | 'Completed';
}

const dummyUser1: User = { id: 'user-1', name: 'Alex Doe', avatar: 'https://i.pravatar.cc/150?u=alex', initials: 'AD' };
const dummyUser2: User = { id: 'user-2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=jane', initials: 'JS' };

export const dummyGoals: Goal[] = [
  { 
    id: 'goal-001', 
    title: 'Launch new marketing campaign', 
    description: 'Plan and execute a multi-channel marketing campaign for the new product.',
    targetDate: '2024-09-30', 
    status: 'On Track',
    type: 'quantity',
    targetPeriod: 'Monthly',
    targetQuantity: 5,
    color: '#4A90E2',
    icon: 'Megaphone',
    completions: [
      { id: 'c-1', date: '2024-07-15', value: 1, notes: 'Published blog post', collaboratorId: 'user-1' },
      { id: 'c-2', date: '2024-07-22', value: 1, notes: 'Launched social media ads', collaboratorId: 'user-1' },
    ],
    collaborators: [dummyUser1],
    tags: ['marketing', 'launch'],
  },
  { 
    id: 'goal-002', 
    title: 'Increase user engagement by 15%', 
    description: 'Implement features to improve user retention and daily active users.',
    targetDate: '2024-12-31', 
    status: 'At Risk',
    type: 'value',
    targetPeriod: 'Yearly',
    targetValue: 15,
    unit: '%',
    color: '#F5A623',
    icon: 'TrendingUp',
    completions: [
      { id: 'c-3', date: '2024-07-20', value: 5, notes: 'Initial increase after feature A', collaboratorId: 'user-2' },
    ],
    collaborators: [dummyUser1, dummyUser2],
    tags: ['product', 'growth', 'kpi'],
  },
  { 
    id: 'goal-003', 
    title: 'Complete Q2 financial audit', 
    description: 'Finalize and submit all financial documents for the second quarter.',
    targetDate: '2024-06-30', 
    status: 'Completed',
    type: 'frequency',
    targetPeriod: 'Weekly',
    frequency: 'Weekly',
    specificDays: ['Mo', 'We', 'Fr'],
    color: '#7ED321',
    icon: 'ClipboardCheck',
    completions: [
      { id: 'c-4', date: '2024-06-03', value: 1, collaboratorId: 'user-2' },
      { id: 'c-5', date: '2024-06-05', value: 1, collaboratorId: 'user-2' },
    ],
    collaborators: [dummyUser2],
    tags: ['finance', 'audit'],
  },
];