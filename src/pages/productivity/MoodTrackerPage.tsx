import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const MoodTrackerPage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Mood Journey</CardTitle>
        <CardDescription>Track your daily mood to gain insights into your well-being.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is where the mood tracking components will be displayed.</p>
        {/* Components like MoodOverview and MoodStats would go here */}
      </CardContent>
    </Card>
  );
};

export default MoodTrackerPage;