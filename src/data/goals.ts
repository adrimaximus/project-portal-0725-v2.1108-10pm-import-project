export interface GoalCompletion {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  frequency: 'Daily' | 'Weekly';
  specificDays: string[];
  tags: string[];
  completions: GoalCompletion[];
}

export const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Read a Book',
    description: 'Read at least 10 pages of a book every day.',
    icon: '📚',
    color: '#3B82F6',
    frequency: 'Daily',
    specificDays: [],
    tags: ['Learning', 'Personal Growth'],
    completions: [],
  },
  {
    id: '2',
    title: 'Morning Run',
    description: 'Go for a 30-minute run every weekday morning.',
    icon: '🏃',
    color: '#10B981',
    frequency: 'Weekly',
    specificDays: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
    tags: ['Health', 'Fitness', 'Cardio'],
    completions: [],
  },
  {
    id: '3',
    title: 'Practice Guitar',
    description: 'Practice guitar for 20 minutes.',
    icon: '🎸',
    color: '#F59E0B',
    frequency: 'Weekly',
    specificDays: ['Mo', 'We', 'Fr'],
    tags: ['Music', 'Hobby', 'Skill'],
    completions: [],
  },
  {
    id: '4',
    title: 'Drink 8 Glasses of Water',
    description: 'Stay hydrated by drinking at least 8 glasses of water.',
    icon: '💧',
    color: '#0EA5E9',
    frequency: 'Daily',
    specificDays: [],
    tags: ['Health', 'Hydration'],
    completions: [],
  },
  {
    id: '5',
    title: 'Meditate',
    description: 'Meditate for 10 minutes every morning.',
    icon: '🧘',
    color: '#8B5CF6',
    frequency: 'Daily',
    specificDays: [],
    tags: ['Mindfulness', 'Mental Health'],
    completions: [],
  },
];