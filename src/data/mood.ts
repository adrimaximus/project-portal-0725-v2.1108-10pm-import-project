export interface Mood {
  id: number;
  label: string;
  emoji: string;
  color: string;
  ringColor: string;
  score: number;
}

export interface MoodHistoryEntry {
  id: string; // Changed from number to string for UUID
  date: string; // YYYY-MM-DD format
  moodId: number;
  userId: string;
}

export const moods: Mood[] = [
  { id: 1, label: 'Happy', emoji: '😄', color: '#BFDBFE', ringColor: '#60A5FA', score: 5 },   // blue-200, ring: blue-400
  { id: 2, label: 'Calm', emoji: '🙂', color: '#A7F3D0', ringColor: '#34D399', score: 4 },    // emerald-200, ring: emerald-400
  { id: 3, label: 'Neutral', emoji: '😐', color: '#FEF08A', ringColor: '#FBBF24', score: 3 },  // yellow-200, ring: amber-400
  { id: 4, label: 'Sad', emoji: '😢', color: '#FED7AA', ringColor: '#FB923C', score: 2 },      // orange-200, ring: orange-400
  { id: 5, label: 'Depressed', emoji: '😔', color: '#FECACA', ringColor: '#F87171', score: 1 },// red-200, ring: red-400
];