import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const GoalsPage = () => {
  return (
    <div className="py-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Goals</CardTitle>
          <CardDescription>Set and track your personal and professional goals.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is where your goals and progress will be displayed.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoalsPage;