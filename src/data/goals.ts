import { dummyUsers, User } from './users';

export interface GoalCompletion {
  date: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  specificDays?: number[]; // 0 for Sunday, 1 for Monday, etc.
  target: number;
  unit: string;
  owner: User;
  collaborators: User[];
  completions: GoalCompletion[];
}

export const dummyGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Run 5k',
    description: 'Run 5 kilometers every day to stay fit.',
    icon: 'run',
    color: '#4A90E2',
    frequency: 'daily',
    target: 5,
    unit: 'km',
    owner: dummyUsers[0],
    collaborators: [dummyUsers[1]],
    completions: [
      { date: '2024-07-01T00:00:00.000Z', completed: true },
      { date: '2024-07-02T00:00:00.000Z', completed: true },
      { date: '2024-07-03T00:00:00.000Z', completed: false },
      { date: '2024-07-04T00:00:00.000Z', completed: true },
    ],
  },
  {
    id: 'goal-2',
    title: 'Read 3 Books',
    description: 'Finish reading three books on product management.',
    icon: 'book',
    color: '#50E3C2',
    frequency: 'monthly',
    target: 3,
    unit: 'books',
    owner: dummyUsers[1],
    collaborators: [],
    completions: [
      { date: '2024-07-10T00:00:00.000Z', completed: true },
      { date: '2024-07-20T00:00:00.000Z', completed: true },
    ],
  },
  {
    id: 'goal-3',
    title: 'Weekly Team Sync',
    description: 'Hold a sync meeting with the development team.',
    icon: 'users',
    color: '#F5A623',
    frequency: 'weekly',
    specificDays: [1], // Monday
    target: 1,
    unit: 'meeting',
    owner: dummyUsers[0],
    collaborators: [dummyUsers[1], dummyUsers[2]],
    completions: [
      { date: '2024-07-01T00:00:00.000Z', completed: true },
      { date: '2024-07-08T00:00:00.000Z', completed: true },
    ],
  },
];