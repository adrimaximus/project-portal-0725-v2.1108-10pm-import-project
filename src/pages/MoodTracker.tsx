import MoodTracker from '@/components/mood-tracker/MoodTracker';

const MoodTrackerPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Mood Tracker</h1>
      <MoodTracker />
    </div>
  );
};

export default MoodTrackerPage;