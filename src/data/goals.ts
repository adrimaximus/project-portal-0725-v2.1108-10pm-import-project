import { User, dummyUsers } from './users';
import { Tag, dummyTags } from './tags';

export interface GoalCompletion {
  date: string; // YYYY-MM-DD
  value: number; // 1 for completed frequency, actual number for quantity
}

export type GoalType = 'frequency' | 'quantity';
export type GoalPeriod = 'Weekly' | 'Monthly';

export interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: GoalType;
  
  // Frequency-specific
  frequency: 'Daily' | 'Weekly';
  specificDays: string[];

  // Quantity-specific
  targetQuantity?: number;
  targetPeriod?: GoalPeriod;

  tags: Tag[];
  completions: GoalCompletion[];
  collaborators: User[];
}

export const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Read a Book',
    description: 'Read at least 300 pages this month.',
    icon: '📚',
    color: '#3B82F6',
    type: 'quantity',
    targetQuantity: 300,
    targetPeriod: 'Monthly',
    frequency: 'Daily', // Fallback/default
    specificDays: [],
    tags: [dummyTags[0], dummyTags[1]],
    completions: [{ date: '2024-08-01', value: 25 }, { date: '2024-08-02', value: 15 }],
    collaborators: [dummyUsers[0]],
  },
  {
    id: '2',
    title: 'Morning Run',
    description: 'Go for a 30-minute run every weekday morning.',
    icon: '🏃',
    color: '#10B981',
    type: 'frequency',
    frequency: 'Weekly',
    specificDays: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
    tags: [dummyTags[2], dummyTags[3], dummyTags[4]],
    completions: [],
    collaborators: [dummyUsers[0], dummyUsers[2]],
  },
  {
    id: '3',
    title: 'Practice Guitar',
    description: 'Practice guitar for 20 minutes.',
    icon: '🎸',
    color: '#F59E0B',
    type: 'frequency',
    frequency: 'Weekly',
    specificDays: ['Mo', 'We', 'Fr'],
    tags: [dummyTags[5], dummyTags[6], dummyTags[7]],
    completions: [],
    collaborators: [],
  },
  {
    id: '4',
    title: 'Drink 8 Glasses of Water',
    description: 'Stay hydrated by drinking at least 8 glasses of water.',
    icon: '💧',
    color: '#0EA5E9',
    type: 'frequency',
    frequency: 'Daily',
    specificDays: [],
    tags: [dummyTags[8], dummyTags[2]],
    completions: [],
    collaborators: [dummyUsers[1]],
  },
  {
    id: '5',
    title: 'Meditate',
    description: 'Meditate for 10 minutes every morning.',
    icon: '🧘',
    color: '#8B5CF6',
    type: 'frequency',
    frequency: 'Daily',
    specificDays: [],
    tags: [dummyTags[9], dummyTags[10]],
    completions: [],
    collaborators: [],
  },
];