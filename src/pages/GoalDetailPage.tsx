import { useParams } from "react-router-dom";
import { useGoals } from "@/context/GoalsContext";
import { Goal, GoalCompletion } from "@/data/goals";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import GoalDetail from "@/components/goals/GoalDetail";
import GoalProgressChart from "@/components/goals/GoalProgressChart";
import { GoalLogTable } from "@/components/goals/GoalLogTable";
import GoalQuantityTracker from "@/components/goals/GoalQuantityTracker";
import { GoalValueTracker } from "@/components/goals/GoalValueTracker";
import GoalYearlyProgress from "@/components/goals/GoalYearlyProgress";
import { Badge } from "@/components/ui/badge";
import GoalCollaborationManager from "@/components/goals/GoalCollaborationManager";
import { dummyUsers } from "@/data/users";

const GoalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { goals, updateGoal } = useGoals(); // Removed addCompletion, will be handled inside trackers
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

  const handleAddCompletion = (value: number, notes?: string) => {
    if (!goal) return;
    const newCompletion: GoalCompletion = {
      id: `comp-${Date.now()}`,
      date: new Date().toISOString(),
      value: value,
      notes: notes,
      collaboratorId: user.id,
    };
    const updatedGoal = { ...goal, completions: [...goal.completions, newCompletion] };
    updateGoal(updatedGoal);
  };

  const handleToggleCompletion = (date: Date) => {
    if (!goal) return;
    const dateString = date.toISOString().split('T')[0];
    const existingCompletion = goal.completions.find(c => c.date.startsWith(dateString));
    
    let updatedCompletions;
    if (existingCompletion) {
      updatedCompletions = goal.completions.filter(c => !c.date.startsWith(dateString));
    } else {
      updatedCompletions = [...goal.completions, {
        id: `comp-${Date.now()}`,
        date: date.toISOString(),
        value: 1,
        collaboratorId: user.id,
      }];
    }
    updateGoal({ ...goal, completions: updatedCompletions });
  };

  const renderTracker = () => {
    switch (goal.type) {
      case "quantity":
        return <GoalQuantityTracker goal={goal} onLogProgress={handleAddCompletion} />;
      case "value":
        return <GoalValueTracker goal={goal} onAddCompletion={handleAddCompletion} />;
      case "frequency":
        return <GoalYearlyProgress goal={goal} onToggleCompletion={handleToggleCompletion} />;
      default:
        return null;
    }
  };

  return (
    <PortalLayout>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* GoalDetail component would be here if it existed and was correct */}
          <Card><CardHeader><CardTitle>{goal.title}</CardTitle></CardHeader></Card>
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
          <GoalCollaborationManager goal={goal} onCollaboratorsUpdate={(collaborators) => updateGoal({...goal, collaborators})} />
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