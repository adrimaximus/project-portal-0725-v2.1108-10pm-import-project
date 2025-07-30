import { Activity, Dumbbell, Target, BookOpen, Leaf, HeartPulse } from 'lucide-react';
import { eachDayOfInterval, startOfYear, getDay, subDays } from 'date-fns';

export const dummyIcons = {
  Activity,
  Dumbbell,
  Target,
  BookOpen,
  Leaf,
  HeartPulse,
};

export type Goal = {
  id: string;
  title: string;
  frequency: string; // e.g., "Daily", "Specific Days"
  specificDays?: string[]; // e.g., ["Mo", "We", "Fr"]
  color: string;
  icon: React.ElementType;
  iconName: keyof typeof dummyIcons;
  completions: {
    date: string; // ISO string
    completed: boolean;
  }[];
};

const generateCompletions = (endDate: Date, daysToGoBack: number, specificDays?: string[]): Goal['completions'] => {
  const dayKeys = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const startDate = subDays(endDate, daysToGoBack);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return days
    .filter(day => {
      if (!specificDays || specificDays.length === 0 || specificDays.length === 7) return true; // Daily
      const dayKey = dayKeys[getDay(day)];
      return specificDays.includes(dayKey);
    })
    .map(date => ({
      date: date.toISOString(),
      completed: Math.random() > 0.4, // Randomly mark as completed
    }));
};

const today = new Date();

export const dummyGoals: Goal[] = [
  {
    id: 'g1',
    title: 'Read 10 pages',
    frequency: 'Daily',
    color: '#4ECDC4',
    icon: BookOpen,
    iconName: 'BookOpen',
    completions: generateCompletions(today, 365),
  },
  {
    id: 'g2',
    title: '30-minute workout',
    frequency: 'Specific Days',
    specificDays: ['Mo', 'We', 'Fr'],
    color: '#FF6B6B',
    icon: Dumbbell,
    iconName: 'Dumbbell',
    completions: generateCompletions(today, 365, ['Mo', 'We', 'Fr']),
  },
  {
    id: 'g3',
    title: 'Meditate',
    frequency: 'Daily',
    color: '#45B7D1',
    icon: Leaf,
    iconName: 'Leaf',
    completions: generateCompletions(today, 365),
  },
];