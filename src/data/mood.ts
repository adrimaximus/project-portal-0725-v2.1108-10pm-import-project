export type Mood = {
  id: number;
  label: string;
  emoji: string;
  ringColor: string;
};

export type MoodHistoryEntry = {
  id: number;
  moodId: number;
  date: string;
};

export const moods: Mood[] = [
  { id: 1, label: 'Happy', emoji: '😄', ringColor: 'ring-green-500' },
  { id: 2, label: 'Good', emoji: '😊', ringColor: 'ring-yellow-500' },
  { id: 3, label: 'Okay', emoji: '😐', ringColor: 'ring-blue-500' },
  { id: 4, label: 'Bad', emoji: '😟', ringColor: 'ring-orange-500' },
  { id: 5, label: 'Awful', emoji: '😠', ringColor: 'ring-red-500' },
];

export const dummyHistory: MoodHistoryEntry[] = [
  { id: 1, moodId: 2, date: '2023-10-26' },
  { id: 2, moodId: 1, date: '2023-10-25' },
  { id: 3, moodId: 3, date: '2023-10-24' },
  { id: 4, moodId: 4, date: '2023-10-23' },
  { id: 5, moodId: 2, date: '2023-10-22' },
  { id: 6, moodId: 5, date: '2023-10-21' },
  { id: 7, moodId: 1, date: '2023-10-20' },
];