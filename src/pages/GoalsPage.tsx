import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import GoalCard from '@/components/goals/GoalCard';
import GoalDetail from '@/components/goals/GoalDetail';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(goals[0] || null);

  const handleUpdateGoal = (updatedGoal: Goal) => {
    const newGoals = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    setGoals(newGoals);
    setSelectedGoal(updatedGoal);
  };

  return (
    <PortalLayout noPadding disableMainScroll>
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="flex flex-col h-full">
            <header className="p-6 border-b flex items-center justify-between sticky top-0 bg-background z-10">
              <div>
                <h1 className="text-2xl font-bold">My Goals</h1>
                <p className="text-muted-foreground">Track your habits and stay consistent.</p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Goal
              </Button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {goals.map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    isSelected={selectedGoal?.id === goal.id}
                    onClick={() => setSelectedGoal(goal)}
                  />
                ))}
              </div>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={35} minSize={30}>
          {selectedGoal ? (
            <GoalDetail 
              key={selectedGoal.id}
              goal={selectedGoal} 
              onUpdate={handleUpdateGoal}
              onClose={() => setSelectedGoal(null)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a goal to see details</p>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </PortalLayout>
  );
};

export default GoalsPage;