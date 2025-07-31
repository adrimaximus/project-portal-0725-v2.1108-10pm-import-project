import React from 'react';
import {
  BookTwoTone,
  AimOutlined,
  SyncOutlined,
} from '@ant-design/icons';

export interface Goal {
  id: string;
  title: string;
  frequency: string;
  specificDays?: string[];
  icon: React.ElementType;
  color: string;
  completions: { date: string; completed: boolean }[];
}

export const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Read a chapter of a book',
    frequency: 'Every 1 day for 1 week',
    icon: BookTwoTone,
    color: '#8B5CF6',
    completions: [
      { date: '2024-07-21T00:00:00.000Z', completed: true },
      { date: '2024-07-22T00:00:00.000Z', completed: false },
      { date: '2024-07-23T00:00:00.000Z', completed: true },
    ],
  },
  {
    id: '2',
    title: 'Morning workout session',
    frequency: 'On 3 specific day(s) for 1 week',
    specificDays: ['mon', 'wed', 'fri'],
    icon: AimOutlined,
    color: '#EC4899',
    completions: [
       { date: '2024-07-22T00:00:00.000Z', completed: true },
    ],
  },
  {
    id: '3',
    title: 'Review daily tasks',
    frequency: 'Every 1 day for 1 week',
    icon: SyncOutlined,
    color: '#10B981',
    completions: [],
  },
];