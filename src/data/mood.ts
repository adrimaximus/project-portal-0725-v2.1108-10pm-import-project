export interface Mood {
  id: 'good' | 'neutral' | 'bad';
  label: 'Good' | 'Neutral' | 'Bad';
  emoji: '😊' | '😐' | '😔';
  color: string;
  pastelColor: string;
  score: number;
}

export const moods: Mood[] = [
  {
    id: 'good',
    label: 'Good',
    emoji: '😊',
    color: '#34d399',
    pastelColor: 'bg-green-100',
    score: 2,
  },
  {
    id: 'neutral',
    label: 'Neutral',
    emoji: '😐',
    color: '#f59e0b',
    pastelColor: 'bg-amber-100',
    score: 1,
  },
  {
    id: 'bad',
    label: 'Bad',
    emoji: '😔',
    color: '#ef4444',
    pastelColor: 'bg-red-100',
    score: 0,
  },
];

export interface MoodHistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  moodId: Mood['id'];
  notes?: string;
}

// Dummy data for demonstration
export const dummyHistory: MoodHistoryEntry[] = [
  { id: '1', date: '2024-07-01', moodId: 'good', notes: 'Great day at work!' },
  { id: '2', date: '2024-07-02', moodId: 'neutral', notes: 'Just a regular day.' },
  { id: '3', date: '2024-07-03', moodId: 'bad', notes: 'Feeling a bit down.' },
  { id: '4', date: '2024-07-05', moodId: 'good' },
  { id: '5', date: '2024-07-08', moodId: 'good' },
  { id: '6', date: '2024-07-10', moodId: 'bad', notes: 'Headache all day.' },
  { id: '7', date: '2024-07-12', moodId: 'neutral' },
  { id: '8', date: '2024-07-15', moodId: 'good' },
  { id: '9', date: '2024-06-28', moodId: 'good' },
];