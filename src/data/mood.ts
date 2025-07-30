export interface Mood {
  id: string;
  label: string;
  emoji: string;
  color: string;
  score: number;
}

export const moods: Mood[] = [
  { id: 'great', label: 'Great', emoji: '😁', color: '#22c55e', score: 5 },
  { id: 'good', label: 'Good', emoji: '🙂', color: '#35d298', score: 4 },
  { id: 'okay', label: 'Okay', emoji: '😐', color: '#facc15', score: 3 },
  { id: 'bad', label: 'Bad', emoji: '🙁', color: '#f97316', score: 2 },
  { id: 'awful', label: 'Awful', emoji: '😭', color: '#ef4444', score: 1 },
];

export interface MoodHistoryEntry {
  id: string;
  date: string;
  moodId: Mood['id'];
  note?: string;
}

export const dummyHistory: MoodHistoryEntry[] = [
  { id: '1', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), moodId: 'good', note: 'Productive day at work.' },
  { id: '2', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), moodId: 'great', note: 'Met with old friends.' },
  { id: '3', date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), moodId: 'okay' },
  { id: '4', date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), moodId: 'bad', note: 'Feeling a bit sick.' },
  { id: '5', date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(), moodId: 'good' },
  { id: '6', date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), moodId: 'awful', note: 'A really tough day.' },
  { id: '7', date: new Date().toISOString(), moodId: 'great', note: 'Feeling awesome today!' },
];