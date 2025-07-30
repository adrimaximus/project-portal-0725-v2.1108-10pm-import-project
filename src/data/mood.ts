export interface Mood {
  id: string;
  label: string;
  emoji: string;
  value: number;
  color: string;
}

export const moods: Mood[] = [
  { id: 'rad', label: 'Rad', emoji: '😎', value: 5, color: 'bg-green-100' },
  { id: 'good', label: 'Good', emoji: '🙂', value: 4, color: 'bg-sky-100' },
  { id: 'meh', label: 'Meh', emoji: '😐', value: 3, color: 'bg-yellow-100' },
  { id: 'bad', label: 'Bad', emoji: '🙁', value: 2, color: 'bg-orange-100' },
  { id: 'awful', label: 'Awful', emoji: '😭', value: 1, color: 'bg-red-100' },
];

export interface MoodEntry {
  id: string;
  moodId: Mood['id'];
  date: Date;
  notes?: string;
}

export const dummyHistory: MoodEntry[] = [
  { id: '1', moodId: 'good', date: new Date('2023-10-26T09:00:00') },
  { id: '2', moodId: 'rad', date: new Date('2023-10-25T14:30:00') },
  { id: '3', moodId: 'meh', date: new Date('2023-10-24T18:00:00') },
  { id: '4', moodId: 'bad', date: new Date('2023-10-23T11:00:00') },
  { id: '5', moodId: 'good', date: new Date('2023-10-22T20:00:00') },
  { id: '6', moodId: 'awful', date: new Date('2023-10-21T08:00:00') },
  { id: '7', moodId: 'rad', date: new Date('2023-10-20T12:00:00') },
];