export interface Mood {
  id: number;
  label: string;
  emoji: string;
  color: string;
  score: number;
}

export interface MoodHistoryEntry {
  id: number;
  date: string;
  moodId: number;
}

export const moods: Mood[] = [
  { id: 1, label: 'Happy', emoji: '😄', color: '#BFDBFE', score: 5 },   // blue-200
  { id: 2, label: 'Calm', emoji: '😌', color: '#A7F3D0', score: 4 },    // emerald-200
  { id: 3, label: 'Neutral', emoji: '😐', color: '#FEF08A', score: 3 },  // yellow-200
  { id: 4, label: 'Sad', emoji: '😢', color: '#FED7AA', score: 2 },      // orange-200
  { id: 5, label: 'Angry', emoji: '😠', color: '#FECACA', score: 1 },    // red-200
];

const generateDummyHistory = (): MoodHistoryEntry[] => {
  const history: MoodHistoryEntry[] = [];
  const today = new Date();
  for (let i = 0; i < 45; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    if (Math.random() > 0.3) {
      const moodId = moods[Math.floor(Math.random() * moods.length)].id;
      history.push({
        id: Date.now() + i,
        date: date.toISOString().split('T')[0],
        moodId: moodId,
      });
    }
  }
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const dummyHistory: MoodHistoryEntry[] = generateDummyHistory();