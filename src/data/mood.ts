import { Laugh, Smile, Meh, Frown, Angry } from 'lucide-react';
import { subDays, format } from 'date-fns';

export type Mood = {
  id: 'ecstatic' | 'happy' | 'neutral' | 'sad' | 'angry';
  label: string;
  Icon: React.ElementType;
  color: string;
  bgColor: string;
  ringColor: string;
  value: number;
};

export const moods: Mood[] = [
  { id: 'ecstatic', label: 'Ecstatic', Icon: Laugh, color: 'text-green-500', bgColor: 'bg-green-500', ringColor: 'ring-green-500', value: 5 },
  { id: 'happy', label: 'Happy', Icon: Smile, color: 'text-lime-500', bgColor: 'bg-lime-500', ringColor: 'ring-lime-500', value: 4 },
  { id: 'neutral', label: 'Neutral', Icon: Meh, color: 'text-orange-500', bgColor: 'bg-orange-500', ringColor: 'ring-orange-500', value: 3 },
  { id: 'sad', label: 'Sad', Icon: Frown, color: 'text-pink-500', bgColor: 'bg-pink-500', ringColor: 'ring-pink-500', value: 2 },
  { id: 'angry', label: 'Angry', Icon: Angry, color: 'text-red-500', bgColor: 'bg-red-500', ringColor: 'ring-red-500', value: 1 },
];

export type MoodEntry = {
  date: string; // YYYY-MM-DD
  moodId: Mood['id'];
  note?: string;
  tags?: string[];
  imageUrl?: string;
};

// Generate dummy data for the last 6 months
const generateDummyData = (): MoodEntry[] => {
  const entries: MoodEntry[] = [];
  const today = new Date();
  for (let i = 0; i < 180; i++) {
    const date = subDays(today, i);
    if (Math.random() > 0.3) { // Don't create an entry for every day
      const moodIndex = Math.floor(Math.pow(Math.random(), 0.5) * moods.length);
      entries.push({
        date: format(date, 'yyyy-MM-dd'),
        moodId: moods[moodIndex].id,
      });
    }
  }
  return entries;
};

export const dummyHistory: MoodEntry[] = generateDummyData();