import { useParams } from "react-router-dom";
import { useGoals } from "@/context/GoalsContext";
import { Goal, GoalCompletion } from "@/data/goals";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { GoalDetail } from "@/components/goals/GoalDetail";
import { GoalProgressChart } from "@/components/goals/GoalProgressChart";
import { GoalLogTable } from "@/components/goals/GoalLogTable";
import { GoalQuantityTracker } from "@/components/goals/GoalQuantityTracker";
import { GoalValueTracker } from "@/components/goals/GoalValueTracker";
import { GoalYearlyProgress } from "@/components/goals/GoalYearlyProgress";
import { Badge } from "@/components/ui/badge";
import { GoalCollaborationManager } from "@/components/goals/GoalCollaborationManager";
import { dummyUsers } from "@/data/projects";

const GoalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { goals, updateGoal, addCompletion } = useGoals();
  const { user } = useUser();
  const goal = goals.find((g) => g.id === id);

  if (!goal) {
    return (
      <PortalLayout>
        <p>Goal not found.</p>
      </PortalLayout>
    );
  }

  const handleUpdateGoal = (updatedGoal: Goal) => {
    updateGoal(updatedGoal);
  };

  const handleAddCompletion = (value?: number, notes?: string) => {
    if (!goal) return;
    const newCompletion: GoalCompletion = {
      id: `comp-${Date.now()}`,
      date: new Date().toISOString(),
      value: value,
      notes: notes,
      collaboratorId: user.id,
    };
    addCompletion(goal.id, newCompletion);
  };

  const renderTracker = () => {
    switch (goal.type) {
      case "quantity":
        return <GoalQuantityTracker goal={goal} onAddCompletion={handleAddCompletion} />;
      case "value":
        return <GoalValueTracker goal={goal} onAddCompletion={handleAddCompletion} />;
      case "frequency":
        return <GoalYearlyProgress goal={goal} onAddCompletion={handleAddCompletion} />;
      default:
        return null;
    }
  };

  return (
    <PortalLayout>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <GoalDetail goal={goal} onUpdate={handleUpdateGoal} />
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTracker()}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalProgressChart goal={goal} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {goal.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </CardContent>
          </Card>
          <GoalCollaborationManager goal={goal} allUsers={dummyUsers} onUpdateGoal={handleUpdateGoal} />
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalLogTable goal={goal} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;