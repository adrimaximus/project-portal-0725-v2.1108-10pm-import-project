import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const MoodTracker = () => {
  return (
    <div className="py-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Mood Journey</CardTitle>
          <CardDescription>Track your daily mood to gain insights into your well-being.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is where the mood tracking components will be displayed.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MoodTracker;