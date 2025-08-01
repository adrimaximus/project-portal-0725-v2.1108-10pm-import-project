import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const MoodTrackerPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Mood Tracker</CardTitle>
          <CardDescription>This feature is coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Check back later to track your mood throughout your projects!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MoodTrackerPage;