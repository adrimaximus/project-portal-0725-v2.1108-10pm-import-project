import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Goal } from "@/data/goals";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import NewGoalDialog from "@/components/goals/NewGoalDialog";

interface GoalsPageProps {
  goals: Goal[];
  onGoalCreate: (newGoalData: Omit<Goal, 'id' | 'icon' | 'completions' | 'collaborators'> & { icon: string }) => void;
}

const GoalsPage = ({ goals, onGoalCreate }: GoalsPageProps) => {
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);

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
        onGoalCreate={onGoalCreate}
      />
    </PortalLayout>
  );
};

export default GoalsPage;