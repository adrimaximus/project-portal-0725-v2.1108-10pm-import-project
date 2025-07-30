import { useState } from 'react';
import { moods, dummyHistory, MoodHistoryEntry, Mood } from '@/data/mood';
import MoodSelector from './MoodSelector';
import MoodDashboard from './MoodDashboard';

const MoodTracker = () => {
  const [history, setHistory] = useState<MoodHistoryEntry[]>(dummyHistory);

  const handleMoodSelect = (moodId: number) => {
    const newEntry: MoodHistoryEntry = {
      id: history.length + 1,
      moodId,
      date: new Date().toISOString().split('T')[0],
    };
    // Avoid adding duplicate entries for the same day
    setHistory(prev => {
      const todaysEntryIndex = prev.findIndex(entry => entry.date === newEntry.date);
      if (todaysEntryIndex !== -1) {
        const updatedHistory = [...prev];
        updatedHistory[todaysEntryIndex] = newEntry;
        return updatedHistory;
      }
      return [...prev, newEntry];
    });
  };

  const todaysMoodId = history.find(entry => entry.date === new Date().toISOString().split('T')[0])?.moodId;
  const todaysMood = todaysMoodId ? moods.find(m => m.id === todaysMoodId) as Mood : null;

  return (
    <div className="space-y-6">
      <MoodSelector onSelectMood={handleMoodSelect} selectedMoodId={todaysMood?.id} />
      <MoodDashboard history={history} />
    </div>
  );
};

export default MoodTracker;