import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import MoodSelector from '@/components/mood-tracker/MoodSelector';
import MoodOverview from '@/components/mood-tracker/MoodOverview';
import MoodHistory from '@/components/mood-tracker/MoodHistory';
import { moods, dummyHistory, Mood, MoodHistoryEntry } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const MoodTracker = () => {
  const [selectedMoodId, setSelectedMoodId] = useState<Mood['id']>(moods[0].id);
  const [history, setHistory] = useState<MoodHistoryEntry[]>(dummyHistory);
  const user = { name: 'Alex' }; // Data pengguna tiruan

  const handleSubmit = () => {
    const selectedMood = moods.find(mood => mood.id === selectedMoodId);
    if (!selectedMood) return;

    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const existingEntryIndex = history.findIndex(entry => entry.date === todayString);

    const newEntry: MoodHistoryEntry = {
      id: existingEntryIndex !== -1 ? history[existingEntryIndex].id : Date.now(),
      date: todayString,
      moodId: selectedMoodId,
    };

    let updatedHistory;
    if (existingEntryIndex !== -1) {
      // Perbarui entri yang ada untuk hari ini
      updatedHistory = history.map((entry, index) =>
        index === existingEntryIndex ? newEntry : entry
      );
    } else {
      // Tambahkan entri baru
      updatedHistory = [...history, newEntry];
    }

    // Urutkan riwayat berdasarkan tanggal secara menurun
    updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setHistory(updatedHistory);

    toast.success(`Mood Anda telah direkam: ${selectedMood.label} ${selectedMood.emoji}`);
  };

  return (
    <PortalLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">Keep a diary of your daily feelings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>How are you feeling, {user.name}?</CardTitle>
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
              <CardTitle>This Week's Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <MoodOverview history={history} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Your Mood History</CardTitle>
            </CardHeader>
            <CardContent>
              <MoodHistory history={history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default MoodTracker;