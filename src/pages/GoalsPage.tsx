import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyGoals, Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import GoalDetail from '@/components/goals/GoalDetail';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { parseISO, isToday } from 'date-fns';

const GoalsPage = () => {
  const [goals, setGoals] = useState(dummyGoals);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateGoal = (newGoal: Goal) => {
    setGoals(prev => [...prev, { ...newGoal, id: `g${prev.length + 1}` }]);
    setIsCreateModalOpen(false);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Goals</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <GoalDetail onUpdate={handleCreateGoal} onClose={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {goals.map(goal => {
          const Icon = goal.icon;
          const todaysCompletion = goal.completions.find(c => isToday(parseISO(c.date)));
          const progress = Math.round((goal.completions.filter(c => c.completed).length / goal.completions.length) * 100);

          return (
            <Link to={`/goals/${goal.id}`} key={goal.id}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
                      <Icon className="h-6 w-6" style={{ color: goal.color }} />
                    </div>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{goal.frequency}</CardDescription>
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm font-bold">{progress}%</span>
                    </div>
                    <Progress value={progress} indicatorStyle={{ backgroundColor: goal.color }} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default GoalsPage;