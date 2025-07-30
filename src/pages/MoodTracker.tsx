import { useState } from 'react';
import MoodEntryCard from '@/components/mood-tracker/MoodEntryCard';
import MoodOverview from '@/components/mood-tracker/MoodOverview';
import MonthHistorySection from '@/components/mood-tracker/MonthHistorySection';
import { MoodHistoryEntry, dummyHistory } from '@/data/mood';

const MoodTracker = () => {
  const [history, setHistory] = useState<MoodHistoryEntry[]>(dummyHistory);

  const handleAddEntry = (newEntry: Omit<MoodHistoryEntry, 'id' | 'date'>) => {
    const entry: MoodHistoryEntry = {
      ...newEntry,
      id: (history.length + 1).toString(),
      date: new Date().toISOString(),
    };
    setHistory(prev => [entry, ...prev]);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mood Tracker</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <MoodEntryCard onAddEntry={handleAddEntry} />
          <MoodOverview history={history} />
        </div>
        <div className="lg:col-span-2">
          <MonthHistorySection history={history} />
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;