import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import MoodSelector from '@/components/mood-tracker/MoodSelector';
import MoodOverview from '@/components/mood-tracker/MoodOverview';
import MoodHistory from '@/components/mood-tracker/MoodHistory';
import { moods, dummyHistory, Mood } from '@/data/mood';

const MoodTracker = () => {
  const [selectedMoodId, setSelectedMoodId] = useState<Mood['id']>(moods[0].id);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mood tracker</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
          <div className="xl:col-span-7 space-y-2">
            <section className="max-w-md">
              <h2 className="text-lg font-semibold mb-2">Bagaimana perasaanmu hari ini?</h2>
              <MoodSelector selectedMoodId={selectedMoodId} onSelectMood={setSelectedMoodId} />
            </section>
          </div>
          <div className="xl:col-span-3">
            <MoodOverview history={dummyHistory} />
          </div>
        </div>

        <MoodHistory history={dummyHistory} />
      </div>
    </PortalLayout>
  );
};

export default MoodTracker;