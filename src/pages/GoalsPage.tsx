import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import NewGoalDialog from '@/components/goals/NewGoalDialog';
import GoalList from '@/components/goals/GoalList';
import { useGoals } from '@/context/GoalsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GoalsPage = () => {
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const { goals } = useGoals();

  const activeGoals = goals; // For now, all goals are active.
  const completedGoals = goals.filter(g => {
    // This is a placeholder logic. A goal is "completed" if all its completions are done.
    // In a real app, this would be more complex.
    const totalCompletions = g.completions.length;
    if (totalCompletions === 0) return false;
    const doneCompletions = g.completions.filter(c => c.completed).length;
    return totalCompletions === doneCompletions;
  });

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
            <p className="text-muted-foreground">
              Track and manage your personal and professional goals.
            </p>
          </div>
          <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <NewGoalDialog setOpen={setIsNewGoalOpen} />
          </Dialog>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <GoalList goals={activeGoals} />
          </TabsContent>
          <TabsContent value="completed">
            <GoalList goals={completedGoals} />
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
};

export default GoalsPage;