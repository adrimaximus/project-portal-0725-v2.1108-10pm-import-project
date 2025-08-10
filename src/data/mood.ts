export interface Mood {
  id: number;
  label: string;
  emoji: string;
  color: string;
  score: number;
}

export interface MoodHistoryEntry {
  id: string; // Changed from number to string for UUID
  date: string; // YYYY-MM-DD format
  moodId: number;
  userId: string;
}

export const moods: Mood[] = [
  { id: 1, label: 'Happy', emoji: '😄', color: '#BFDBFE', score: 5 },   // blue-200
  { id: 2, label: 'Calm', emoji: '🙂', color: '#A7F3D0', score: 4 },    // emerald-200
  { id: 3, label: 'Neutral', emoji: '😐', color: '#FEF08A', score: 3 },  // yellow-200
  { id: 4, label: 'Sad', emoji: '😢', color: '#FED7AA', score: 2 },      // orange-200
  { id: 5, label: 'Depressed', emoji: '😔', color: '#FECACA', score: 1 },// red-200
];