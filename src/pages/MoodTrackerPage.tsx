import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MoodTrackerPage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Track your mood throughout the day to see your progress.</p>
        {/* Mood tracker components will go here */}
      </CardContent>
    </Card>
  );
};

export default MoodTrackerPage;