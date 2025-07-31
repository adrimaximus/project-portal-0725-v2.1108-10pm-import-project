import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dummyGoals, Goal } from "@/data/goals";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

// This mock goal previously had `frequency: "Everyday"` which caused a TS error.
// It has been corrected to `frequency: "Daily"`.
const newGoalTemplate: Goal = {
  id: 'new-goal-placeholder',
  title: 'A Brand New Goal',
  frequency: 'Daily', // FIX: Was "Everyday"
  icon: PlusCircle,
  color: '#888888',
  completions: [],
  collaborators: [],
};

const GoalsPage = () => {
  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Goals</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dummyGoals.map((goal) => (
          <Link to={`/goals/${goal.id}`} key={goal.id}>
            <Card className="hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
                  <goal.icon className="h-6 w-6" style={{ color: goal.color }} />
                </div>
                <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{goal.frequency}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PortalLayout>
  );
};

export default GoalsPage;