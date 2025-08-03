import { User, dummyUsers } from './users';
import { Tag, dummyTags } from './tags';

export interface GoalCompletion {
  date: string; // ISO String for value/quantity logs, YYYY-MM-DD for frequency
  value: number;
  achieverId?: string;
}

export type GoalType = 'frequency' | 'quantity' | 'value';
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

  // Value-specific
  targetValue?: number;
  unit?: string;

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
    frequency: 'Daily',
    specificDays: [],
    tags: [dummyTags[0], dummyTags[1]],
    completions: [
      { date: '2024-08-01T09:00:00Z', value: 25, achieverId: '1' },
      { date: '2024-08-02T09:05:00Z', value: 15, achieverId: '1' }
    ],
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
    id: '6',
    title: 'Save Money',
    description: 'Save Rp 5.000.000 for a new gadget.',
    icon: '💰',
    color: '#22C55E',
    type: 'value',
    targetValue: 5000000,
    unit: 'IDR',
    frequency: 'Daily',
    specificDays: [],
    tags: [{ id: 'tag-12', name: 'Finance', color: '#22C55E' }],
    completions: [
      { date: '2024-08-01T10:00:00Z', value: 500000, achieverId: '1' },
      { date: '2024-08-05T14:30:00Z', value: 1250000, achieverId: '2' }
    ],
    collaborators: [dummyUsers[0], dummyUsers[1]],
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