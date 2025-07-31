import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dummyGoals, Goal } from "@/data/goals";
import { PlusCircle, Target, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import NewGoalDialog from "@/components/goals/NewGoalDialog";

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);

  const handleGoalCreate = (newGoalData: Omit<Goal, 'id' | 'icon' | 'color' | 'completions' | 'collaborators'>) => {
    const icons = [Target, TrendingUp, Users, PlusCircle];
    const colors = ['#4A90E2', '#50E3C2', '#F5A623', '#E02020'];

    const newGoal: Goal = {
      ...newGoalData,
      id: `goal-${Date.now()}`,
      completions: [],
      collaborators: [],
      icon: icons[Math.floor(Math.random() * icons.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setGoals(prevGoals => [...prevGoals, newGoal]);
  };

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Goals</h1>
        <Button onClick={() => setIsNewGoalDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
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
      <NewGoalDialog
        open={isNewGoalDialogOpen}
        onOpenChange={setIsNewGoalDialogOpen}
        onGoalCreate={handleGoalCreate}
      />
    </PortalLayout>
  );
};

export default GoalsPage;