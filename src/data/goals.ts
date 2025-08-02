import { User, user1, user2 } from './users';

export interface GoalCompletion {
  date: string; // ISO 8601 format
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  icon: string;
  color: string;
  frequency: 'Daily' | 'Weekly';
  specificDays?: number[]; // 0 for Sunday, 1 for Monday, etc.
  completions: GoalCompletion[];
  collaborators?: User[];
  tags?: string[];
}

export const dummyGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Read 10 pages of a book',
    icon: 'BookOpen',
    color: '#4A90E2',
    frequency: 'Daily',
    completions: [
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
      { date: new Date().toISOString(), completed: true },
    ],
    collaborators: [user1, user2],
    tags: ['Personal Growth', 'Reading'],
  },
  {
    id: 'goal-2',
    title: 'Workout for 30 minutes',
    icon: 'Dumbbell',
    color: '#50E3C2',
    frequency: 'Weekly',
    specificDays: [1, 3, 5], // Mon, Wed, Fri
    completions: [
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { date: new Date().toISOString(), completed: true },
    ],
    collaborators: [user1],
    tags: ['Health', 'Fitness'],
  },
  {
    id: 'goal-3',
    title: 'Meditate for 5 minutes',
    icon: 'Brain',
    color: '#F5A623',
    frequency: 'Daily',
    completions: [],
    collaborators: [],
    tags: ['Health', 'Mindfulness'],
  },
];