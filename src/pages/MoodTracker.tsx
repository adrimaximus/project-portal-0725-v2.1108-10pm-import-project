import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import MoodSelector from '@/components/mood-tracker/MoodSelector';
import MoodOverview from '@/components/mood-tracker/MoodOverview';
import MoodHistory from '@/components/mood-tracker/MoodHistory';
import { moods, dummyHistory, Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MoodTracker = () => {
  const [selectedMoodId, setSelectedMoodId] = useState<Mood['id']>(moods[0].id);

  const handleSubmit = () => {
    const selectedMood = moods.find(mood => mood.id === selectedMoodId);
    console.log('Mood submitted:', selectedMood);
    alert(`You submitted: ${selectedMood?.label}`);
  };

  return (
    <PortalLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mood Tracker</h1>
          <p className="text-muted-foreground">Keep a diary of your daily feelings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>How are you feeling today?</CardTitle>
              </CardHeader>
              <CardContent>
                <MoodSelector selectedMoodId={selectedMoodId} onSelectMood={setSelectedMoodId} />
                <Button onClick={handleSubmit} className="w-full mt-4">
                  Submit Mood
                </Button>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Your Mood History</CardTitle>
              </CardHeader>
              <CardContent>
                <MoodHistory history={dummyHistory} />
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-1 row-start-1 lg:row-start-auto">
            <MoodOverview history={dummyHistory} />
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default MoodTracker;