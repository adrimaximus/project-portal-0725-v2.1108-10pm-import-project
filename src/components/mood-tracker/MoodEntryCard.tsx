import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { moods, Mood, MoodHistoryEntry } from '@/data/mood';
import MoodSelector from './MoodSelector';

interface MoodEntryCardProps {
  onAddEntry: (newEntry: Omit<MoodHistoryEntry, 'id' | 'date'>) => void;
}

const MoodEntryCard = ({ onAddEntry }: MoodEntryCardProps) => {
  const [selectedMoodId, setSelectedMoodId] = useState<Mood['id']>(moods[1].id); // Default to 'good'
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (selectedMoodId) {
      onAddEntry({ moodId: selectedMoodId, note });
      // Reset form
      setSelectedMoodId(moods[1].id);
      setNote('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling today?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MoodSelector selectedMoodId={selectedMoodId} onSelectMood={setSelectedMoodId} />
        <Textarea
          placeholder="Add a note... (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button onClick={handleSubmit} className="w-full">
          Save Entry
        </Button>
      </CardContent>
    </Card>
  );
};

export default MoodEntryCard;