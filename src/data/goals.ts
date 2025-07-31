import { Book, Dumbbell, Target, Zap, Leaf, LucideIcon } from 'lucide-react';
import { subDays } from 'date-fns';

export interface Goal {
  id: string;
  title: string;
  frequency: string;
  icon: LucideIcon;
  color: string;
  completions: { date: string; completed: boolean }[];
  specificDays?: string[];
  assignedUserIds?: string[];
}

const generateCompletions = (days: number, specificDays?: string[]) => {
  const completions = [];
  const dayMapping: { [key: string]: number } = { 'Su': 0, 'Mo': 1, 'Tu': 2, 'We': 3, 'Th': 4, 'Fr': 5, 'Sa': 6 };

  for (let i = 1; i <= days; i++) {
    const date = subDays(new Date(), i);
    const dayOfWeek = date.getDay();
    
    const shouldTrack = !specificDays || specificDays.includes(Object.keys(dayMapping).find(key => dayMapping[key] === dayOfWeek)!);

    if (shouldTrack) {
      completions.push({
        date: date.toISOString(),
        completed: Math.random() > 0.3,
      });
    }
  }
  return completions;
};

export const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Read 10 pages of a book',
    frequency: 'Daily',
    icon: Book,
    color: '#3b82f6',
    completions: generateCompletions(90),
    assignedUserIds: ['user-1'],
  },
  {
    id: '2',
    title: 'Workout for 30 minutes',
    frequency: 'Mon, Wed, Fri',
    icon: Dumbbell,
    color: '#ef4444',
    specificDays: ['Mo', 'We', 'Fr'],
    completions: generateCompletions(90, ['Mo', 'We', 'Fr']),
    assignedUserIds: ['user-1', 'user-3'],
  },
  {
    id: '3',
    title: 'Achieve sales target',
    frequency: 'Weekly',
    icon: Target,
    color: '#10b981',
    completions: generateCompletions(90, ['Fr']),
    assignedUserIds: ['user-2', 'user-4'],
  },
  {
    id: '4',
    title: 'Learn a new skill',
    frequency: 'Weekend',
    icon: Zap,
    color: '#f97316',
    specificDays: ['Sa', 'Su'],
    completions: generateCompletions(90, ['Sa', 'Su']),
    assignedUserIds: [],
  },
  {
    id: '5',
    title: 'Meditate for 10 minutes',
    frequency: 'Daily',
    icon: Leaf,
    color: '#8b5cf6',
    completions: generateCompletions(90),
    assignedUserIds: ['user-5'],
  },
];