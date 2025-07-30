import { Book, Dumbbell, Droplets, LucideIcon, CalendarCheck } from 'lucide-react';
import { subDays, formatISO, startOfDay } from 'date-fns';

export interface Goal {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  frequency: string;
  startDate?: string;
  completions: {
    date: string; // ISO date string
    completed: boolean;
  }[];
}

const generateCompletions = (startDate: Date, freq: number, count: number) => {
  const completions = [];
  for (let i = 0; i < count; i++) {
    const date = subDays(startDate, i * freq);
    // Add some variety to completion data
    if (i % 3 !== 0) { 
      completions.push({ date: formatISO(startOfDay(date)), completed: true });
    } else {
      completions.push({ date: formatISO(startOfDay(date)), completed: false });
    }
  }
  return completions;
};

const today = new Date();

export const goals: Goal[] = [
  {
    id: '1',
    title: 'Read 10 pages of a book',
    icon: Book,
    color: '#4A90E2',
    frequency: 'Every 1 day for 1 week',
    startDate: formatISO(startOfDay(subDays(today, 30))),
    completions: generateCompletions(today, 1, 30),
  },
  {
    id: '2',
    title: 'Workout for 30 minutes',
    icon: Dumbbell,
    color: '#D0021B',
    frequency: 'Every 2 days for 2 weeks',
    startDate: formatISO(startOfDay(subDays(today, 60))),
    completions: generateCompletions(today, 2, 30),
  },
  {
    id: '3',
    title: 'Drink 8 glasses of water',
    icon: Droplets,
    color: '#50E3C2',
    frequency: 'Every 1 day for 4 weeks',
    startDate: formatISO(startOfDay(subDays(today, 45))),
    completions: generateCompletions(today, 1, 45),
  },
  {
    id: '4',
    title: 'Plan the next day',
    icon: CalendarCheck,
    color: '#F5A623',
    frequency: 'Once a week',
    startDate: formatISO(startOfDay(subDays(today, 90))),
    completions: generateCompletions(today, 7, 12),
  },
];