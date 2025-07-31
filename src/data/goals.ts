import { BookOpen, Target, Repeat, CheckCircle, TrendingUp, Award, Dumbbell, Droplet, Leaf, Heart, DollarSign, Briefcase, Coffee, Bed, Music, Film, Code, PenTool, Brush, Bike, Plane, Star, Smile, Brain, Zap, Sunrise, Sunset, Apple, Activity, AlarmClock, Anchor, Archive, Wallet, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { goalIcons } from './icons';
import { User, dummyUsers } from './users';

export interface Goal {
  id: string;
  title: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  icon: LucideIcon;
  color: string;
  completions: { date: string; completed: boolean }[];
  specificDays?: string[]; // 0 for Sunday, 6 for Saturday
  invitedUsers?: User[];
}

export const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Read 12 Books This Year',
    frequency: 'Monthly',
    icon: BookOpen,
    color: '#3b82f6',
    specificDays: [],
    completions: [
      { date: '2024-01-15', completed: true },
      { date: '2024-02-10', completed: true },
      { date: '2024-03-20', completed: true },
      { date: '2024-04-18', completed: false },
      { date: '2024-05-25', completed: true },
    ],
    invitedUsers: [dummyUsers[0], dummyUsers[2]],
  },
  {
    id: '2',
    title: 'Run 3 Times a Week',
    frequency: 'Weekly',
    icon: Dumbbell,
    color: '#ef4444',
    specificDays: ['1', '3', '5'], // Monday, Wednesday, Friday
    completions: [
      { date: '2024-07-01', completed: true },
      { date: '2024-07-03', completed: true },
      { date: '2024-07-05', completed: false },
      { date: '2024-07-08', completed: true },
      { date: '2024-07-10', completed: true },
    ],
    invitedUsers: [dummyUsers[1]],
  },
  {
    id: '3',
    title: 'Daily Meditation',
    frequency: 'Daily',
    icon: Heart,
    color: '#8b5cf6',
    completions: Array.from({ length: 30 }, (_, i) => ({
      date: `2024-06-${String(i + 1).padStart(2, '0')}`,
      completed: Math.random() > 0.3,
    })),
    invitedUsers: [dummyUsers[3], dummyUsers[4], dummyUsers[0]],
  },
  {
    id: '4',
    title: 'Save $500 per Month',
    frequency: 'Monthly',
    icon: DollarSign,
    color: '#10b981',
    specificDays: [],
    completions: [
      { date: '2024-01-30', completed: true },
      { date: '2024-02-28', completed: true },
      { date: '2024-03-30', completed: false },
      { date: '2024-04-30', completed: true },
      { date: '2024-05-30', completed: true },
      { date: '2024-06-30', completed: true },
    ],
  },
  {
    id: '5',
    title: 'Learn a New Language',
    frequency: 'Weekly',
    icon: Code,
    color: '#f97316',
    specificDays: ['0', '2', '4', '6'],
    completions: [],
  },
];