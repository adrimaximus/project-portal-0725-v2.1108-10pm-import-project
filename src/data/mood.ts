export type Mood = {
  id: number;
  label: string;
  emoji: string;
  ringColor: string;
  color: string;
  score: number;
};

export type MoodHistoryEntry = {
  id: number;
  moodId: number;
  date: string; // YYYY-MM-DD
};

export const moods: Mood[] = [
  { id: 1, label: 'Happy', emoji: '😄', ringColor: 'ring-green-500', color: '#10B981', score: 100 },
  { id: 2, label: 'Good', emoji: '😊', ringColor: 'ring-yellow-500', color: '#34D399', score: 75 },
  { id: 3, label: 'Okay', emoji: '😐', ringColor: 'ring-blue-500', color: '#FBBF24', score: 50 },
  { id: 4, label: 'Bad', emoji: '😟', ringColor: 'ring-orange-500', color: '#FCA5A5', score: 25 },
  { id: 5, label: 'Awful', emoji: '😠', ringColor: 'ring-red-500', color: '#EF4444', score: 0 },
];

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const d = today.getDate();

const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
}

// Filter out entries that might be in the future if the current day is early in the month
const safeDate = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    return date > today ? today : date;
}

export const dummyHistory: MoodHistoryEntry[] = [
  // This month's data
  { id: 1, moodId: 2, date: formatDate(safeDate(y, m, d - 2)) },
  { id: 2, moodId: 1, date: formatDate(safeDate(y, m, d - 5)) },
  { id: 3, moodId: 3, date: formatDate(safeDate(y, m, d - 6)) },
  { id: 4, moodId: 2, date: formatDate(safeDate(y, m, d - 8)) },
  { id: 5, moodId: 1, date: formatDate(safeDate(y, m, d - 10)) },
  { id: 6, moodId: 2, date: formatDate(safeDate(y, m, d - 15)) },
  { id: 7, moodId: 4, date: formatDate(safeDate(y, m, d - 18)) },
  { id: 8, moodId: 5, date: formatDate(safeDate(y, m, d - 20)) },
  { id: 9, moodId: 1, date: formatDate(safeDate(y, m, d - 25)) },
  
  // This year's data (but previous months)
  { id: 11, moodId: 3, date: formatDate(new Date(y, m > 1 ? m - 1 : 0, 18)) },
  { id: 12, moodId: 1, date: formatDate(new Date(y, m > 2 ? m - 2 : 0, 28)) },
  { id: 13, moodId: 2, date: formatDate(new Date(y, m > 2 ? m - 2 : 0, 15)) },
  { id: 14, moodId: 4, date: formatDate(new Date(y, m > 3 ? m - 3 : 0, 22)) },
  { id: 15, moodId: 1, date: formatDate(new Date(y, m > 4 ? m - 4 : 0, 10)) },
  { id: 16, moodId: 5, date: formatDate(new Date(y, m > 5 ? m - 5 : 0, 5)) },
  { id: 17, moodId: 2, date: formatDate(new Date(y, m > 6 ? m - 6 : 0, 20)) },

  // Last year's data
  { id: 18, moodId: 1, date: formatDate(new Date(y - 1, 11, 25)) },
  { id: 19, moodId: 3, date: formatDate(new Date(y - 1, 10, 1)) },
].filter(entry => new Date(entry.date) <= today);