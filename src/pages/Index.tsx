import { useState } from 'react';
import { Goal, initialGoals, createNewGoal } from '@/data/goals';
import GoalCard from '@/components/goals/GoalCard';
import GoalDetail from '@/components/goals/GoalDetail';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';

export default function Index() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const handleSelectGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedGoal(createNewGoal());
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedGoal(null);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    if (isCreateMode) {
      setGoals([...goals, { ...updatedGoal, id: `goal_${Date.now()}` }]);
    } else {
      setGoals(goals.map(g => (g.id === updatedGoal.id ? updatedGoal : g)));
    }
    handleCloseDialog();
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
    handleCloseDialog();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto p-4 md:p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Goals</h1>
          <Button onClick={handleOpenCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => (
            <div key={goal.id} onClick={() => handleSelectGoal(goal)} className="cursor-pointer">
              <GoalCard goal={goal} />
            </div>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isCreateMode ? 'Create New Goal' : 'Edit Goal'}</DialogTitle>
            </DialogHeader>
            {selectedGoal && (
              <GoalDetail
                goal={selectedGoal}
                onUpdate={handleUpdateGoal}
                onDelete={handleDeleteGoal}
                onClose={handleCloseDialog}
                isCreateMode={isCreateMode}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}