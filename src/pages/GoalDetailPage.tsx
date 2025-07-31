import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import { dummyUsers } from '@/data/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import GoalGrid from '@/components/goals/GoalGrid';
import GoalDetail from '@/components/goals/GoalDetail';
import NewGoalDialog from '@/components/goals/NewGoalDialog';
import CompletionCalendar from '@/components/goals/CompletionCalendar';
import CollaboratorManager from '@/components/goals/CollaboratorManager';

const GoalDetailPage = () => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(goals[0] || null);
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);

  const handleSelectGoal = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  const handleCreateGoal = (newGoalData: Omit<Goal, 'id' | 'completions' | 'collaborators'>) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: Date.now(),
      completions: {},
      collaborators: [dummyUsers[0]],
    };
    setGoals([...goals, newGoal]);
    setSelectedGoal(newGoal);
    toast.success(`Goal "${newGoal.title}" created!`);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
    setSelectedGoal(updatedGoal);
    toast.success('Goal updated!');
  };

  const handleDeleteGoal = (goalId: number) => {
    setGoals(goals.filter((g) => g.id !== goalId));
    setSelectedGoal(null);
    toast.error('Goal deleted');
  };

  const handleToggleCompletion = (date: string) => {
    if (!selectedGoal) return;

    const newCompletions = { ...selectedGoal.completions };
    if (newCompletions[date]) {
      delete newCompletions[date];
    } else {
      newCompletions[date] = true;
    }

    const updatedGoal = { ...selectedGoal, completions: newCompletions };
    handleUpdateGoal(updatedGoal);
  };

  const handleUpdateCollaborators = (updatedCollaborators: Goal['collaborators']) => {
    if (!selectedGoal) return;
    const updatedGoal = { ...selectedGoal, collaborators: updatedCollaborators };
    handleUpdateGoal(updatedGoal);
  };

  return (
    <PortalLayout>
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Left Sidebar: Goal List */}
        <div className="md:col-span-1 lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalGrid goals={goals} selectedGoal={selectedGoal} onSelectGoal={handleSelectGoal} />
              <Button className="w-full mt-4" onClick={() => setIsNewGoalDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Goal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Content: Goal Details */}
        <div className="md:col-span-2 lg:col-span-3">
          {selectedGoal ? (
            <div className="space-y-6">
              <Button variant="ghost" onClick={() => setSelectedGoal(null)} className="md:hidden">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Goals
              </Button>
              
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CompletionCalendar
                        goal={selectedGoal}
                        onToggleCompletion={handleToggleCompletion}
                      />
                    </CardContent>
                  </Card>
                  <CollaboratorManager
                    collaborators={selectedGoal.collaborators}
                    onUpdateCollaborators={handleUpdateCollaborators}
                    allUsers={dummyUsers}
                  />
                </div>
                <div className="space-y-6">
                  <GoalDetail
                    goal={selectedGoal}
                    onUpdate={handleUpdateGoal}
                    onDelete={handleDeleteGoal}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
              <h2 className="text-xl font-semibold">Select a goal</h2>
              <p className="text-muted-foreground mt-2">
                Choose a goal from the list to see its details, or create a new one.
              </p>
            </div>
          )}
        </div>
      </div>

      <NewGoalDialog
        open={isNewGoalDialogOpen}
        onOpenChange={setIsNewGoalDialogOpen}
        onGoalCreate={handleCreateGoal}
      />
    </PortalLayout>
  );
};

export default GoalDetailPage;