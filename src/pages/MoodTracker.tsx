import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import MoodSelector from '@/components/mood-tracker/MoodSelector';
import MoodOverview from '@/components/mood-tracker/MoodOverview';
import MoodHistory from '@/components/mood-tracker/MoodHistory';
import { moods, dummyHistory, Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';

const MoodTracker = () => {
  const [selectedMoodId, setSelectedMoodId] = useState<Mood['id']>(moods[0].id);

  const handleSubmit = () => {
    const selectedMood = moods.find(mood => mood.id === selectedMoodId);
    console.log('Mood submitted:', selectedMood);
    // Anda bisa menambahkan logika untuk menyimpan mood di sini
    alert(`You submitted: ${selectedMood?.label}`);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mood tracker</h1>
        </div>

        <div className="flex flex-col xl:flex-row items-start gap-8">
          <div className="w-full xl:w-auto">
            <section className="max-w-md">
              <h2 className="text-lg font-semibold mb-2">How are you feeling today?</h2>
              <MoodSelector selectedMoodId={selectedMoodId} onSelectMood={setSelectedMoodId} />
              <Button onClick={handleSubmit} className="w-full mt-4">
                Submit
              </Button>
            </section>
          </div>
          <div className="w-full xl:w-5/12">
            <MoodOverview history={dummyHistory} />
          </div>
        </div>

        <MoodHistory history={dummyHistory} />
      </div>
    </PortalLayout>
  );
};

export default MoodTracker;