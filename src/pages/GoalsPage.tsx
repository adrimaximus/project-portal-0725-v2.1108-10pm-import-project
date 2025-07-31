import { useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GoalDetail from '@/components/goals/GoalDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const newGoalTemplate: Goal = {
    id: '',
    title: '',
    frequency: 'Daily', // Fixed: Was 'Everyday'
    color: '#888888',
    icon: PlusCircle,
    completions: [],
  };

  const handleCreateGoal = (newGoal: Goal) => {
    setGoals(prev => [...prev, { ...newGoal, id: `goal-${Date.now()}` }]);
    setIsCreateModalOpen(false);
  };

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Goals</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <GoalDetail
              goal={newGoalTemplate}
              onUpdate={handleCreateGoal}
              onClose={() => setIsCreateModalOpen(false)}
              isCreateMode={true}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const Icon = goal.icon;
          return (
            <Link to={`/goals/${goal.id}`} key={goal.id}>
              <Card className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                       <div className="p-3 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
                         <Icon className="h-6 w-6" style={{ color: goal.color }} />
                       </div>
                       <div>
                         <CardTitle className="text-lg">{goal.title}</CardTitle>
                         <p className="text-sm text-muted-foreground">{goal.frequency}</p>
                       </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {goal.completions.filter(c => c.completed).length} completions this month.
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </PortalLayout>
  );
};

export default GoalsPage;