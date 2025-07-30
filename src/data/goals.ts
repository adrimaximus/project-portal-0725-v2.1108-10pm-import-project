import { Target, Dumbbell, BookOpen, Bed, BrainCircuit, Trophy } from 'lucide-react';
import { addDays, format } from 'date-fns';

export type Goal = {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  frequency: string;
  completions: { date: string; completed: boolean }[];
};

// Helper to generate completions for a goal
const generateCompletions = (days: number, frequencyPattern: (dayOfWeek: number) => boolean) => {
  const completions = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (frequencyPattern(dayOfWeek)) {
      // For demo, some days are not completed
      completions.push({
        date: format(date, 'yyyy-MM-dd'),
        completed: Math.random() > 0.2, // 80% chance of completion
      });
    }
  }
  return completions.reverse();
};

export const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Set Small Goals',
    icon: Target,
    color: '#EF4444', // red-500
    frequency: 'Everyday',
    completions: generateCompletions(90, () => true),
  },
  {
    id: '2',
    title: 'Meditation',
    icon: BrainCircuit,
    color: '#22C55E', // green-500
    frequency: '5 days per week',
    completions: generateCompletions(90, (day) => day >= 1 && day <= 5), // Mon-Fri
  },
  {
    id: '3',
    title: 'Work',
    icon: Trophy,
    color: '#8B5CF6', // violet-500
    frequency: 'Everyday',
    completions: generateCompletions(90, () => true),
  },
  {
    id: '4',
    title: 'Sleep Over 8h',
    icon: Bed,
    color: '#3B82F6', // blue-500
    frequency: 'Everyday',
    completions: generateCompletions(90, () => true),
  },
  {
    id: '5',
    title: 'Exercise or Workout',
    icon: Dumbbell,
    color: '#14B8A6', // teal-500
    frequency: 'Everyday',
    completions: generateCompletions(90, () => true),
  },
];