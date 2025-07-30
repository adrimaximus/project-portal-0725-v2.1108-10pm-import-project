import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import MoodSelector from '@/components/mood-tracker/MoodSelector';
import MoodEntryCard from '@/components/mood-tracker/MoodEntryCard';
import MoodOverview from '@/components/mood-tracker/MoodOverview';
import MoodHistory from '@/components/mood-tracker/MoodHistory';
import { moods, dummyHistory, Mood } from '@/data/mood';

const MoodTracker = () => {
  const [selectedMoodId, setSelectedMoodId] = useState<Mood['id']>(moods[0].id);
  const [note, setNote] = useState("Very excited to have met our new puppy!");
  const [tags, setTags] = useState(["Excited", "Family", "Love"]);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>('/images/puppy.png');

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mood tracker</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">How are you feeling today?</h2>
              <MoodSelector selectedMoodId={selectedMoodId} onSelectMood={setSelectedMoodId} />
            </section>
            <MoodEntryCard
              note={note}
              onNoteChange={setNote}
              tags={tags}
              onTagsChange={setTags}
              image={image}
              onImageChange={setImage}
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
            />
          </div>
          <div className="xl:col-span-1">
            <MoodOverview history={dummyHistory} />
          </div>
        </div>

        <MoodHistory history={dummyHistory} />
      </div>
    </PortalLayout>
  );
};

export default MoodTracker;